'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('MainCtrl', ['$scope', '$timeout', '$location', '$rootScope', '$state', '_', '$window', '$uibModal', 'growl', '$http', 'URLService', 'hotkeys', 'growlMessages', 'UtilsService', 'HttpService', 'AuthService', 'ElementService', 'CacheService', 'ApplicationService', 'SessionService', 'TreeService', 'EditService', 'EventService', '$interval',
function($scope, $timeout, $location, $rootScope, $state, _, $window, $uibModal, growl, $http, URLService, hotkeys, growlMessages, UtilsService, HttpService, AuthService, ElementService, CacheService, ApplicationService, SessionService, TreeService, EditService, EventService, $interval) {
    var tree = TreeService;
    var session = SessionService;
    var edit = EditService;
    var eventSvc = EventService;
    var openEdits = {};

    session.veViewContentLoading(false);
    session.treeInitialSelection('');
    session.veTitle('');
    session.veFn(false);

    var modalOpen = false;

    eventSvc.$on(edit.EVENT, () => {
        openEdits = edit.getAll();
    });


    $window.addEventListener('beforeunload', function(event) {
        if (Object.keys(openEdits).length > 0) {
            var message = 'You may have unsaved changes, are you sure you want to leave?';
            event.returnValue = message;
            return message;
        }
    });

    hotkeys.bindTo($scope)
        .add({
            combo: 'alt+m',
            description: 'close all messages',
            callback: function() {growlMessages.destroyAllMessages();}
        }).add({
            combo: '@',
            description: 'fast cf in editor',
            callback: function() {}
        });

    $scope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        session.veStateChanging(false);
        session.veViewContentLoading(false);
        //check if error is ticket error
        if (!error || error.status === 401 || 
                (error.status === 404 && error.config && error.config.url && 
                error.config.url.indexOf('/authentication') !== -1)) { //check if 404 if checking valid ticket
            event.preventDefault();
            session.veRedirect({toState: toState, toParams: toParams});
            $state.go('login', {notify: false});
            return;
        }
        growl.error('Error: ' + error.message);
    });

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        session.veViewContentLoading(true);
        HttpService.transformQueue();
        session.veStateChanging(true);
    });

    eventSvc.$on("mms.unauthorized", function(event, response) {
        // add a boolean to the 'or' statement to check for modal window
        if ($state.$current.name === 'login' || session.veStateChanging() || modalOpen)
            return;
        AuthService.checkLogin().then(function(){}, function() {
            if ($state.$current.name === 'login' || modalOpen)
                return;
            modalOpen = true;
            $uibModal.open({
                template: '<div class="modal-header"><h4>You have been logged out, please login again.</h4></div><div class="modal-body"><form name="loginForm" ng-submit="login(credentials)">' +
                                '<input type="text" class="form-control" ng-model="credentials.username" placeholder="Username" style="margin-bottom: 1.5em;" autofocus>' +
                                '<input type="password" class="form-control" ng-model="credentials.password" placeholder="Password" style="margin-bottom: 1.5em;">' +
                                '<button class="btn btn-block btn-primary" type="submit">LOG IN <span ng-if="spin" ><i class="fa fa-spin fa-spinner"></i>' +
                            '</span></button></form></div>',
                scope: $scope,
                backdrop: 'static',
                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                    $scope.credentials = {
                        username: '',
                        password: ''
                    };
                    $scope.spin = false;
                    $scope.login = function (credentials) {
                        $scope.spin = true;
                        var credentialsJSON = {"username":credentials.username, "password":credentials.password};
                        AuthService.getAuthorized(credentialsJSON).then(function (user) {
                            growl.success("Logged in");
                            $uibModalInstance.dismiss();
                            // Check if user had changes queued before refreshing page data
                            // add edits to cache
                            var edits = edit.getAll();
                            _.map(edits, function(element, key) {
                                var cacheKey = UtilsService.makeElementKey(element, true);
                                CacheService.put(cacheKey, element);
                            });
                            $state.go($state.current, {}, {reload: true});
                        }, function (reason) {
                            $scope.spin = false;
                            $scope.credentials.password = '';
                            growl.error(reason.message);
                        });
                    };
                }],
                size: 'md'
            }).result.finally(function(){
                modalOpen = false;
            });
        });
    });
    // broadcast mms.unauthorized every 10 minutes with interval service
    $interval(function() {
        eventSvc.$broadcast('mms.unauthorized');
    }, 600000, 0, false);

    $rootScope.$on('$stateChangeSuccess', 
        function(event, toState, toParams, fromState, fromParams) {
            session.veStateChanging(false);
            $scope.hidePanes = false;
            $scope.showManageRefs = false;
            $scope.showLogin = false;
            if ($state.current.name === 'login' || $state.current.name === 'login.select' || $state.current.name === 'login.redirect') {
                $scope.hidePanes = true;
                $scope.showLogin = true;
            } else if ( $state.includes('project') && !($state.includes('project.ref')) ) {
                $scope.hidePanes = true;
                $scope.showManageRefs = true;
                eventSvc.$broadcast('fromParamChange', fromParams);
            }
            if ($state.current.name === 'project.ref') {
                session.treeInitialSelection(toParams.refId);
            } else if ($state.current.name === 'project.ref.preview') {
                var index = toParams.documentId.indexOf('_cover');
                if (index > 0)
                    session.treeInitialSelection(toParams.documentId.substring(5, index));
                else
                    session.treeInitialSelection(toParams.documentId);
            } else if ($state.includes('project.ref.document') && ($state.current.name !== 'project.ref.document.order')) {
                if (toParams.viewId !== undefined)
                    session.treeInitialSelection(toParams.viewId);
                else
                    session.treeInitialSelection(toParams.documentId);
            }
            if ($state.includes('project.ref.document')) {
                ApplicationService.getState().inDoc = true;
                ApplicationService.getState().currentDoc = toParams.documentId;
                if ($state.includes('project.ref.document.full')) {
                    ApplicationService.getState().fullDoc = true;
                } else {
                    ApplicationService.getState().fullDoc = false;
                }
            } else {
                ApplicationService.getState().inDoc = false;
                ApplicationService.getState().fullDoc = false;
            }
            session.veViewContentLoading(false);
            if ($state.includes('project.ref') && (fromState.name === 'login' || fromState.name === 'login.select' || fromState.name === 'project' || fromState.name === 'login.redirect')) {
                $timeout(function() {
                    let originalState = session.treePaneClosed();
                    eventSvc.$broadcast('tree-pane-toggle');
                    //Wait for pane to toggle
                    while (session.treePaneClosed() === originalState) {}
                    eventSvc.$broadcast('tree-pane-toggle');
                    //Wait again for toggle
                    while (session.treePaneClosed() !== originalState) {}
                }, 1, false);
            }
        }
    );

    var workingModalOpen = false;
    eventSvc.$on('mms.working', function(event, response) {
        session.veViewContentLoading(false);
        if (workingModalOpen) {
            return;
        }
        $scope.mmsWorkingTime = response.data;
        workingModalOpen = true;
        $uibModal.open({
            template: "<div class=\"modal-header\">Please come back later</div><div class=\"modal-body\">The document you're requesting has been requested already at {{mmsWorkingTime.startTime | date:'M/d/yy h:mm a'}} and is currently being cached, please try again later.</div>",
            scope: $scope,
            backdrop: true,
            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                }],
            size: 'md'
        }).result.finally(function(){
            workingModalOpen = false;
        });
    });

    eventSvc.$on('element.updated', function(event, data) {
        let element = data.element;
        //if element is not being edited and there's a cached edit object, update the edit object also
        //so next time edit forms will show updated data (mainly for stomp updates)
        var editKey = UtilsService.makeElementKey(element, true);
        var veEditsKey = element.id + '|' + element._projectId + '|' + element._refId;
        if (edit.getAll() && !edit.get(veEditsKey) && CacheService.exists(editKey)) {
            ElementService.cacheElement({projectId: element._projectId, refId: element._refId, elementId: element.id, commitId: 'latest'}, JSON.parse(JSON.stringify(element)), true);
        }
    });
}]);
