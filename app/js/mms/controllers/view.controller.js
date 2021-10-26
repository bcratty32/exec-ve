'use strict';

/* Controllers */

angular.module('mmsApp')
    .controller('ViewCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$window', '$location',
    '$http', '$element', 'growl', 'hotkeys', 'MmsAppUtils', 'UxService', 'URLService', 'UtilsService', 'ShortenUrlService', 'Utils',
    'search', 'orgOb', 'projectOb', 'refOb', 'groupOb', 'documentOb', 'viewOb', 'PermissionsService', 'SessionService', 'TreeService',
    function($scope, $rootScope, $state, $timeout, $window, $location, $http,
             $element, growl, hotkeys, MmsAppUtils, UxService, URLService, UtilsService, ShortenUrlService, Utils,
             search, orgOb, projectOb, refOb, groupOb, documentOb, viewOb, PermissionsService, SessionService, TreeService) {
        
    let session = SessionService;
    let tree = TreeService.getTree().getApi();

    function isPageLoading() {
        if ($element.find('.isLoading').length > 0) {
            growl.warning("Still loading!");
            return true;
        }
        return false;
    }

    $scope.vidLink = false; //whether to have go to document link
    if ($state.includes('project.ref.preview') && viewOb && viewOb.id.indexOf('_cover') < 0) {
        $scope.vidLink = true;
    }

    session.veFullDocMode(true);
    if (!session.veCommentsOn())
        session.veCommentsOn(false);
    if (!session.veElementsOn())
        session.veElementsOn(false);
    if (!session.veEditMode())
        session.veEditMode(false);

    $scope.search = search;
    Utils.toggleLeftPane(search);
    $scope.viewOb = viewOb;
    $scope.projectOb = projectOb;
    $scope.refOb = refOb;

    $scope.buttons = [];
    $scope.viewApi = {
        init: function() {
            if (session.veCommentsOn()) {
                $scope.viewApi.toggleShowComments();
            }
            if (session.veElementsOn()) {
                $scope.viewApi.toggleShowElements();
            }
            if (session.veEditMode()) {
                $scope.viewApi.toggleShowEdits();
            }
        },
        elementTranscluded: function(elementOb, type) {
            if (type === 'Comment' && !$scope.comments.map.hasOwnProperty(elementOb.id)) {
                $scope.comments.map[elementOb.id] = elementOb;
                $scope.comments.count++;
                if (elementOb._modified > $scope.comments.lastCommented) {
                    $scope.comments.lastCommented = elementOb._modified;
                    $scope.comments.lastCommentedBy = elementOb._modifier;
                }
            }
        },
        elementClicked: function(elementOb) {
            $rootScope.$broadcast('elementSelected', elementOb, 'latest');
        }
    };
    $scope.comments = {
        count: 0,
        lastCommented: '',
        lastCommentedBy: '',
        map: {}
    };

    $scope.docLibLink = '';
    if (groupOb !== null) {
        $scope.docLibLink = groupOb._link;
    } else if (documentOb !== null && documentOb._groupId !== undefined && documentOb._groupId !== null) {
        $scope.docLibLink = '/share/page/repository#filter=path|/Sites/' + orgOb.id + '/documentLibrary/' +
        projectOb.id + '/' + documentOb._groupId;
    } else {
        $scope.docLibLink = '/share/page/repository#filter=path|/Sites/' + orgOb.id + '/documentLibrary/' +
        projectOb.id;
    }

    $scope.bbApi = {
        init: function() {
            if (viewOb && refOb.type === 'Branch' && PermissionsService.hasBranchEditPermission(refOb)) {
                $scope.bbApi.addButton(UxService.getButtonBarButton('show-edits'));
                $scope.bbApi.setToggleState('show-edits', session.veEditMode());
                hotkeys.bindTo($scope)
                .add({
                    combo: 'alt+d',
                    description: 'toggle edit mode',
                    callback: function() {$scope.$broadcast('show-edits');}
                });
            }
            $scope.bbApi.addButton(UxService.getButtonBarButton('show-elements'));
            $scope.bbApi.setToggleState('show-elements', session.veElementsOn());
            $scope.bbApi.addButton(UxService.getButtonBarButton('show-comments'));
            $scope.bbApi.setToggleState('show-comments', session.veCommentsOn());

            // Set hotkeys for toolbar
            hotkeys.bindTo($scope)
            .add({
                combo: 'alt+c',
                description: 'toggle show comments',
                callback: function() {$scope.$broadcast('show-comments');}
            }).add({
                combo: 'alt+e',
                description: 'toggle show elements',
                callback: function() {$scope.$broadcast('show-elements');}
            });

            if ($state.includes('project.ref.preview') || $state.includes('project.ref.document')) {
                $scope.bbApi.addButton(UxService.getButtonBarButton('refresh-numbering'));
                // $scope.bbApi.addButton(UxService.getButtonBarButton('share-url'));
                $scope.bbApi.addButton(UxService.getButtonBarButton('print'));
                if ($state.includes('project.ref.document')) {
                    var exportButtons = UxService.getButtonBarButton('export');
                    exportButtons.dropdown_buttons.push(UxService.getButtonBarButton("convert-pdf"));
                    $scope.bbApi.addButton(exportButtons);
                    $scope.bbApi.addButton(UxService.getButtonBarButton('center-previous'));
                    $scope.bbApi.addButton(UxService.getButtonBarButton('center-next'));
                    // Set hotkeys for toolbar
                    hotkeys.bindTo($scope)
                    .add({
                        combo: 'alt+.',
                        description: 'next',
                        callback: function() {$scope.$broadcast('center-next');}
                    }).add({
                        combo: 'alt+,',
                        description: 'previous',
                        callback: function() {$scope.$broadcast('center-previous');}
                    });
                } else {
                    $scope.bbApi.addButton(UxService.getButtonBarButton('export'));
                }
            }
        }
    };

    $scope.$on('show-comments', function() {
        $scope.viewApi.toggleShowComments();
        $scope.bbApi.toggleButtonState('show-comments');
        session.veCommentsOn(!session.veCommentsOn());
    });

    $scope.$on('show-elements', function() {
        $scope.viewApi.toggleShowElements();
        $scope.bbApi.toggleButtonState('show-elements');
        session.veElementsOn(!session.veElementsOn());
    });

    $scope.$on('show-edits', function() {
        if( (session.veElementsOn() && session.veEditMode()) || (!session.veElementsOn() && !session.veEditMode()) ){
            $scope.viewApi.toggleShowElements();
            $scope.bbApi.toggleButtonState('show-elements');
            session.veElementsOn(!session.veElementsOn());
        }
        $scope.viewApi.toggleShowEdits();
        $scope.bbApi.toggleButtonState('show-edits');
        session.veEditMode(!session.veEditMode());
    });

    $scope.$on('center-previous', function() {
        var prev = tree.get_prev_branch(tree.get_selected_branch());
        if (!prev)
            return;
        while (prev.type !== 'view' && prev.type !== 'section') {
            prev = tree.get_prev_branch(prev);
            if (!prev)
                return;
        }
        $scope.bbApi.toggleButtonSpinner('center-previous');
        tree.select_branch(prev);
        $scope.bbApi.toggleButtonSpinner('center-previous');
    });

    $scope.$on('center-next', function() {
        var next = tree.get_next_branch(tree.get_selected_branch());
        if (!next)
            return;
        while (next.type !== 'view' && next.type !== 'section') {
            next = tree.get_next_branch(next);
            if (!next)
                return;
        }
        $scope.bbApi.toggleButtonSpinner('center-next');
        tree.select_branch(next);
        $scope.bbApi.toggleButtonSpinner('center-next');
    });

    // Share URL button settings
    $scope.dynamicPopover = ShortenUrlService.dynamicPopover;
    $scope.copyToClipboard = ShortenUrlService.copyToClipboard;
    $scope.handleShareURL = ShortenUrlService.getShortUrl.bind(null, $location.absUrl(), $scope);

    if (viewOb && $state.includes('project.ref')) {
        $timeout(function() {
            $rootScope.$broadcast('viewSelected', viewOb, 'latest');
        }, 1000);
    }

    $scope.searchOptions = {
        emptyDocTxt: 'This field is empty.',
        searchInput: search,
        getProperties: true,
        closeable: true,
        callback: function(elementOb) {
            $rootScope.$broadcast('elementSelected', elementOb, 'latest');
            if ($rootScope.ve_togglePane && $rootScope.ve_togglePane.closed)
                $rootScope.ve_togglePane.toggle();
        },
        relatedCallback: function (doc, view, elem) {//siteId, documentId, viewId) {
            $state.go('project.ref.document.view', {projectId: doc._projectId, documentId: doc.id, viewId: view.id, refId: doc._refId, search: undefined});
        }
    };

    $scope.$on('convert-pdf', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.printModal(viewOb, refOb, false, 3)
        .then(function(ob) {
            growl.info('Exporting as PDF file. Please wait for a completion email.',{ttl: -1});
        }, function(reason){
            growl.error("Exporting as PDF file Failed: " + reason.message);
        });
    });

    $scope.$on('print', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.printModal(viewOb, refOb, false, 1);
    });

    $scope.$on('word', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.printModal(viewOb, refOb, false, 2)
        .then(function(ob) {
            growl.info('Exporting as Word file. Please wait for a completion email.',{ttl: -1});
        }, function(reason){
            growl.error("Exporting as Word file Failed: " + reason.message);
        });
    });

    $scope.$on('tabletocsv', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.tableToCsv(false);
    });

    $scope.$on('refresh-numbering', function() {
        if (isPageLoading())
            return;
        var printElementCopy = angular.element("#print-div");
        MmsAppUtils.refreshNumbering(tree.get_rows(), printElementCopy);
    });
}]);
