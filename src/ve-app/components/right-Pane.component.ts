import * as angular from 'angular';
import Rx from 'rx';
var veApp = angular.module('veApp');
import { StateService } from '@uirouter/angularjs';
import {ElementService} from "../../ve-utils/services/Element.service";
import {ProjectService} from "../../ve-utils/services/Project.service";
import {Utils} from "../../ve-core/utilities/Utils.service";
import {RootScopeService} from "../../ve-utils/services/RootScope.service";
import {PermissionsService} from "../../ve-utils/services/Permissions.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {EditService} from "../../ve-utils/services/Edit.service";
import { ToolbarService } from 'src/ve-core/tools/Toolbar.service';
import {SpecService} from "../../ve-core/tools/Spec.service";
import {ViewReorderApi, ViewReorderService} from "../../ve-core/tools/ViewReorder.service";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {ElementObject} from "../../ve-utils/types/mms";




/* Controllers */

//veApp.controller('ToolCtrl', ['this', ]);
//TODO: Make this more flexible and based on a more extensible pattern?
// Example:https://kamranicus.com/dynamic-angularjs-components/
let RightPaneComponent: VeComponentOptions = {
    selector: 'rightPane',
    template: `
    <div class="pane-right">
    <div ng-if="$ctrl.documentOb">
        <div class="container-fluid" ng-show="$ctrl.show.element">
            <h4 ng-if="$ctrl.specSvc.getEditing()" class="right-pane-title">Edit Element</h4>
            <h4 ng-if="!$ctrl.specSvc.getEditing()" class="right-pane-title">Preview Element</h4>
            <form class="form-horizontal">
                <div class="form-group">
                    <label class="col-sm-3 control-label">Edits ({{$ctrl.openEdits}}):</label>
                    <div class="col-sm-9">
                        <select class="form-control"
                            ng-options="eid as edit.type + ': ' + edit.name for (eid, edit) in $ctrl.edits"
                            ng-model="$ctrl.specSvc.tracker.etrackerSelected" ng-change="$ctrl.etrackerChange()">
                        </select>
                    </div>
                </div>
            </form>
            <hr class="spec-title-divider">
            <spec mms-element-id="{{$ctrl.specInfo.id}}" mms-commit-id="{{$ctrl.specInfo.commitId}}"
                mms-ref-id="{{$ctrl.specInfo.refId}}" mms-project-id="{{$ctrl.specInfo.projectId}}"
                mms-display-old-content="specInfo.mmsDisplayOldContent"></spec>
        </div>
    </div>

    <div ng-if="$ctrl.documentOb">
        <div class="container-fluid" ng-if="$ctrl.show.history">
            <mms-history mms-element-id="{{$ctrl.specInfo.id}}" mms-ref-id="{{$ctrl.specInfo.refId}}"
                mms-project-id="{{$ctrl.specInfo.projectId}}"></mms-history>
        </div>
    </div>

    <div class="container-fluid container-tags" id="ve-branches-tags" ng-show="$ctrl.show.tags">
        <h4 class="right-pane-title">Project Branches/Tags</h4>
        <hr class="spec-title-divider">
        <mms-ref-list mms-doc-id="{{$ctrl.documentOb.id}}" mms-project-id="{{$ctrl.projectOb.id}}"
        mms-ref-id="{{$ctrl.refOb.id}}" mms-ref-type="{{$ctrl.refOb.type}}" mms-branches="$ctrl.branchObs" mms-tags="$ctrl.tagObs"></mms-ref-list>
    </div>

    <div class="container-fluid" ng-show="$ctrl.show.reorder">
        <view-reorder mms-element-id="{{$ctrl.viewOb.id}}" mms-project-id="{{$ctrl.viewOb._projectId}}"
            mms-commit-id="{{$ctrl.viewCommitId}}" mms-order="true" mms-ref-id="{{$ctrl.viewOb._refId}}"
            ></view-reorder>
    </div>
</div>

    `,
    bindings: {
        projectOb: "<",
        refOb: "<",
        tagObs: "<",
        branchObs: "<",
        documentOb: "<",
        viewOb: "<"
    },
    controller: class RightPaneController implements angular.IComponentController {

        private projectOb;
        refOb;
        tagObs;
        branchObs;
        documentOb;
        viewOb;

        public subs: Rx.IDisposable[];

        private specInfo;
        show = {
            element: true,
            history: false,
            tags: false,
            reorder: false
        };

        viewContentsOrderApi: ViewReorderApi;
        editable: any;
        viewId: any;
        elementSaving: boolean;
        openEdits: number;
        edits: {};
        viewCommitId: any;
        $pane

        static $inject = ['$scope', '$state', '$uibModal', '$q', '$timeout', 'hotkeys', 'growl',
            'ElementService', 'ProjectService', 'Utils', 'PermissionsService', 'RootScopeService', 'EventService',
            'EditService', 'ToolbarService', 'SpecService', 'ViewReorderService']

        constructor(private $scope, private $state: StateService, private $uibModal: angular.ui.bootstrap.IModalService,
                    private $q: angular.IQService, private $timeout: angular.ITimeoutService,
                    private hotkeys: angular.hotkeys.HotkeysProvider, private growl: angular.growl.IGrowlService,
                    private elementSvc: ElementService, private projectSvc: ProjectService, private utils: Utils,
                    private permissionsSvc: PermissionsService, private rootScopeSvc: RootScopeService,
                    private eventSvc: EventService, private editSvc: EditService, private toolbarSvc: ToolbarService,
                    private specSvc: SpecService, private viewReorderSvc: ViewReorderService) {
        }

        $onInit() {
            this.eventSvc.$init(this);
            this.$pane = this.$scope.$parent.$parent.$parent.$pane;
            this.viewContentsOrderApi = this.viewReorderSvc.getApi();
            this.specInfo = {
                refId: this.refOb.id,
                commitId: 'latest',
                projectId: this.projectOb.id,
                id: ""
            }
            this.specSvc.specInfo = this.specInfo
                this.specSvc.editable = this.documentOb && this.refOb.type === 'Branch' && this.permissionsSvc.hasBranchEditPermission(this.refOb);

            if (this.viewOb) {
                this.specInfo.id = this.viewOb.id;
                this.viewId = this.viewOb.id;
            } else if (this.documentOb) {
                this.specInfo.id = this.documentOb.id;
                this.viewId = this.documentOb.id;
            }

            this.elementSaving = false;

            this.rootScopeSvc.rightPaneClosed(this.$pane.closed);

            this.subs.push(this.eventSvc.$on('right-pane-toggled', () => {
                this.rootScopeSvc.rightPaneClosed(this.$pane.closed);
            }));

            this.subs.push(this.eventSvc.$on('right-pane-toggle', (paneClosed) => {
                if (paneClosed === undefined) {
                    this.$pane.toggle();
                } else if (paneClosed && !this.$pane.closed) {
                    this.$pane.toggle();
                } else if (!paneClosed && this.$pane.closed) {
                    this.$pane.toggle();
                }
            }));

            this.subs.push(this.eventSvc.$on(this.editSvc.EVENT, () => {
                this.openEdits = this.editSvc.openEdits();
            }));
            this.edits = this.editSvc.getAll();

            this.subs.push(this.eventSvc.$on('element-history', () => {
                this.showPane('history');
            }));

            this.subs.push(this.eventSvc.$on('tags', () => {
                this.showPane('tags');
            }));

            this.subs.push(this.eventSvc.$on('gotoTagsBranches', () => {
                this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'tags'});
                this.showPane('tags');
            }));

            this.subs.push(this.eventSvc.$on('presentationElem.edit', (editOb) => {
                var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
                this.editSvc.addOrUpdate(key, editOb);
                this.specSvc.cleanUpSaveAll();
            }));

            this.subs.push(this.eventSvc.$on('presentationElem.save', (editOb) => {
                this.cleanUpEdit(editOb, true);
            }));

            this.subs.push(this.eventSvc.$on('presentationElem.cancel', (editOb) => {
                this.cleanUpEdit(editOb);
            }));

            this.subs.push(this.eventSvc.$on('elementSelected', (data) => {
                let elementOb = data.elementOb;
                let commitId = (data.commitId) ? data.commitId : null;
                let displayOldContent = (data.displayOldContent) ? data.displayOldContent : null;
                this.specInfo.id = elementOb.id;
                this.specInfo.projectId = elementOb._projectId;
                this.specInfo.refId = elementOb._refId;
                this.specInfo.commitId = commitId ? commitId : elementOb._commitId;
                this.specInfo.mmsDisplayOldContent = displayOldContent;
                if (this.show.element) {
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'element-viewer'});
                }
                if (this.specSvc.setEditing) {
                    this.specSvc.setEditing(false);
                }
                var editable = this.refOb.type === 'Branch' && commitId === 'latest' && this.permissionsSvc.hasBranchEditPermission(this.refOb);
                this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                    id: 'element-editor',
                    value: editable
                });
                //this.$apply();
            }));

            this.subs.push(this.eventSvc.$on('element-viewer', () => {
                this.specSvc.setEditing(false);
                this.specSvc.cleanUpSaveAll();
                this.showPane('element');
            }));
            this.subs.push(this.eventSvc.$on('element-editor', () => {
                this.specSvc.setEditing(true);
                this.showPane('element');
                var editOb = this.specSvc.getEdits();
                if (editOb) {
                    var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
                    this.specSvc.tracker.etrackerSelected = key;
                    this.editSvc.addOrUpdate(key, editOb);
                    this.specSvc.cleanUpSaveAll();
                }
                this.elementSvc.isCacheOutdated(editOb)
                    .then((data) => {
                        let server = (data.server) ? <Date>data.server._modified : new Date();
                        let cache = (data.cache) ? <Date>data.cache._modified : new Date()
                        if (data.status && server > cache)
                            this.growl.error('This element has been updated on the server. Please refresh the page to get the latest version.');
                    });
            }));
            this.subs.push(this.eventSvc.$on('viewSelected', (data) => {
                let elementOb = data.elementOb;
                let commitId = (data.commitId) ? data.commitId : null;
                this.eventSvc.$broadcast('elementSelected', {elementOb: elementOb, commitId: commitId});
                this.viewOb = elementOb;
                var editable = this.refOb.type === 'Branch' && commitId === 'latest' && this.permissionsSvc.hasBranchEditPermission(this.refOb);
                this.viewCommitId = commitId ? commitId : elementOb._commitId;
                this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                    id: 'view-reorder',
                    value: editable
                });
            }));

            this.subs.push(this.eventSvc.$on('view-reorder.refresh', () => {
                this.viewContentsOrderApi.refresh();
            }));

            this.subs.push(this.eventSvc.$on('view-reorder', () => {
                this.viewContentsOrderApi.setEditing(true);
                this.showPane('reorder');
            }));

            this.subs.push(this.eventSvc.$on('element-editor-save', () => {
                this.save(false);
            }));
            this.subs.push(this.eventSvc.$on('element-editor-saveC', () => {
                this.save(true);
            }));

            this.subs.push(this.eventSvc.$on('element-saving', (data) =>{
                this.elementSaving = data;
            }));

            this.hotkeys.bindTo(this.$scope)
                .add({
                    combo: 'alt+a',
                    description: 'save all',
                    callback: () => {
                        this.eventSvc.$broadcast('element-editor-saveall');
                    }
                });
            var savingAll = false;
            this.subs.push(this.eventSvc.$on('element-editor-saveall', () => {
                if (savingAll) {
                    this.growl.info('Please wait...');
                    return;
                }
                if (this.editSvc.openEdits() === 0) {
                    this.growl.info('Nothing to save');
                    return;
                }

                Object.values(this.editSvc.getAll()).forEach((ve_edit: ElementObject) => {
                    this.utils.clearAutosaveContent(ve_edit._projectId + ve_edit._refId + ve_edit.id, ve_edit.type);
                });

                if (this.specSvc && this.specSvc.editorSave)
                    this.specSvc.editorSave();
                savingAll = true;
                this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'element-editor-saveall'});
                this.elementSvc.updateElements(Object.values(this.editSvc.getAll()))
                    .then((responses) => {
                        responses.forEach((elementOb) => {
                            this.editSvc.remove(elementOb.id + '|' + elementOb._projectId + '|' + elementOb._refId);
                            let data = {
                                element: elementOb,
                                continueEdit: false
                            };
                            this.eventSvc.$broadcast('element.updated', data);
                            this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'element-viewer'});
                            this.specSvc.setEditing(false);
                        });
                        this.growl.success("Save All Successful");

                    }, (responses) => {
                        // reset the last edit elementOb to one of the existing element
                        var elementToSelect = (<ElementObject>Object.values(this.editSvc.getAll())[0]);
                        this.specSvc.tracker.etrackerSelected = elementToSelect.id + '|' + elementToSelect._projectId + '|' + elementToSelect._refId;
                        this.specSvc.keepMode();
                        this.specInfo.id = elementToSelect.id;
                        this.specInfo.projectId = elementToSelect._projectId;
                        this.specInfo.refId = elementToSelect._refId;
                        this.specInfo.commitId = 'latest';
                        this.growl.error("Some elements failed to save, resolve individually in edit pane");

                    }).finally(() => {
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'element-editor-saveall'});
                    savingAll = false;
                    this.specSvc.cleanUpSaveAll();
                    if (this.editSvc.openEdits() === 0) {
                        this.eventSvc.$broadcast(this.toolbarSvc.constants.SETICON, {
                            id: 'element-editor',
                            value: 'fa-edit'
                        });
                    }
                });
            }));
            this.subs.push(this.eventSvc.$on('element-editor-cancel', () => {
                let go = () => {
                    var rmEdit = this.specSvc.getEdits();
                    this.editSvc.remove(rmEdit.id + '|' + rmEdit._projectId + '|' + rmEdit._refId);
                    this.specSvc.revertEdits();
                    if (this.editSvc.openEdits() > 0) {
                        var next = Object.keys(this.editSvc.getAll())[0];
                        var id = next.split('|');
                        this.specSvc.tracker.etrackerSelected = next;
                        this.specSvc.keepMode();
                        this.specInfo.id = id[0];
                        this.specInfo.projectId = id[1];
                        this.specInfo.refId = id[2];
                        this.specInfo.commitId = 'latest';
                    } else {
                        this.specSvc.setEditing(false);
                        this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'element-viewer'});
                        this.eventSvc.$broadcast(this.toolbarSvc.constants.SETICON, {
                            id: 'element-editor',
                            value: 'fa-edit'
                        });
                        this.specSvc.cleanUpSaveAll();
                    }
                };
                if (this.specSvc.hasEdits()) {
                    var ve_edit = this.specSvc.getEdits();
                    let deleteOb = {
                        type: ve_edit.type,
                        element: ve_edit.element,
                    }

                    this.utils.deleteEditModal(deleteOb).result.then(() => {
                        go();
                    });
                } else
                    go();
            }));
            var viewSaving = false;
            this.subs.push(this.eventSvc.$on('view-reorder-save', () => {
                if (viewSaving) {
                    this.growl.info('Please Wait...');
                    return;
                }
                viewSaving = true;
                this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'view-reorder-save'});
                this.viewContentsOrderApi.save().then((data) => {
                    viewSaving = false;
                    this.viewContentsOrderApi.refresh();
                    this.growl.success('Save Succesful');
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'view-reorder-save'});
                    this.eventSvc.$broadcast('view.reorder.saved', {id: this.viewOb.id});
                }, (response) => {
                    this.viewContentsOrderApi.refresh();
                    viewSaving = false;
                    var reason = response.failedRequests[0];
                    this.growl.error(reason.message);
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'view-reorder-save'});
                });
                this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'view-reorder'});
            }));
            this.subs.push(this.eventSvc.$on('view-reorder-cancel', () => {
                this.specSvc.setEditing(false);
                this.viewContentsOrderApi.refresh();
                this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'element-viewer'});
                this.showPane('element');
            }));
        }


        public etrackerChange() {
            this.specSvc.keepMode();
            var id = this.specSvc.tracker.etrackerSelected;
            if (!id)
                return;
            var info = id.split('|');
            this.specInfo.id = info[0];
            this.specInfo.projectId = info[1];
            this.specInfo.refId = info[2];
            this.specInfo.commitId = 'latest';
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {id: 'element-editor', value: true});
        };

        public showPane(pane) {
            angular.forEach(this.show, (value, key) => {
                if (key === pane)
                    this.show[key] = true;
                else
                    this.show[key] = false;
            });
        };

        


        public cleanUpEdit(editOb, cleanAll?) {
            if (!this.utils.hasEdits(editOb) || cleanAll) {
                var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
                this.editSvc.remove(key);
                this.specSvc.cleanUpSaveAll();
            }
        };

        public save(continueEdit) {
            if (this.elementSaving) {
                this.growl.info('Please Wait...');
                return;
            }
            this.specSvc.save(continueEdit);
            
        }




    }
}

veApp.component(RightPaneComponent.selector,RightPaneComponent);
