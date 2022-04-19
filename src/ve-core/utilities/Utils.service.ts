import * as angular from "angular";
import {URLService} from "../../ve-utils/services/URL.provider";
import {RootScopeService} from "../../ve-utils/services/RootScope.service";
import {CacheService} from "../../ve-utils/services/Cache.service";
import {ElementService} from "../../ve-utils/services/Element.service";
import {ViewService} from "../../ve-utils/services/View.service";
import {UtilsService} from "../../ve-utils/services/Utils.service";
import {AuthService} from "../../ve-utils/services/Authorization.service";
import {PermissionsService} from "../../ve-utils/services/Permissions.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {EditService} from "../../ve-utils/services/Edit.service";
import {ElementObject} from "../../ve-utils/types/mms";
import {veCore} from "../ve-core.module";

import {IComponentController, IScope} from "angular";
import {UtilController} from "./utils";
import {ButtonBarApi} from "../button-bar/ButtonBar.service";
import {VeEditorApi} from "../editor/CKEditor.service";
import {TranscludeController, TranscludeScope} from "../../ve-extensions/transclusions/transclusion";
import {ValueSpec} from "../../ve-utils/utils/emf.util";

/**
 * @ngdoc service
 * @name Utils
 * @requires $q
 * @requires $uibModal
 * @requires $timeout
 * @requires $compile
 * @requires $window
 * @requires URLService
 * @requires CacheService
 * @requires ElementService
 * @requires EditService
 * @requires _
 *
 * @description
 * Utility methods for performing edit like behavior to a transclude element
 * WARNING These are intended to be internal utility functions and not designed to be used as api
 *
 */
export class Utils {
    
    //locals
    private addItemData

    private revertData: { elementId: string; baseCommit: object; refId: string; compareCommit: object;
                        projectId: string; element: object };

    static $inject = ['$q', '$uibModal', '$timeout', '$compile', '$window', 'growl',
        'URLService', 'CacheService', 'ElementService', 'ViewService',  'UtilsService', 'AuthService',
        'PermissionsService', 'RootScopeService', 'EventService', 'EditService']

    constructor(private $q, private $uibModal, private $timeout, private $compile, private $window, private growl,
                private uRLSvc : URLService, private cacheSvc : CacheService, private elementSvc : ElementService, 
                private viewSvc : ViewService, private utilsSvc : UtilsService, private authSvc : AuthService,
                private permissionsSvc : PermissionsService, private rootScopeSvc : RootScopeService,
                private eventSvc : EventService, private editSvc : EditService) {

    }

    public clearAutosaveContent(autosaveKey, elementType) {
        if ( elementType === 'Slot' ) {
            Object.keys(this.$window.localStorage)
                .forEach((key) =>{
                    if ( key.indexOf(autosaveKey) !== -1 ) {
                        this.$window.localStorage.removeItem(key);
                    }
                });
        } else {
            this.$window.localStorage.removeItem(autosaveKey);
        }
    }

    // var ENUM_ID = '_9_0_62a020a_1105704885400_895774_7947';
    // var ENUM_LITERAL = '_9_0_62a020a_1105704885423_380971_7955';


    public setupValEditFunctions(scope: TranscludeController) {
        scope.addValueTypes = {string: 'LiteralString', boolean: 'LiteralBoolean', integer: 'LiteralInteger', real: 'LiteralReal'};
        scope.addValue = (type) => {
            var newValueSpec: ValueSpec;
            var elementOb: ElementObject = {
                id: '',
                _projectId: scope.mmsProjectId,
                _refId: scope.mmsRefId,
                type: ''
            }
            switch(type) {
                case 'LiteralBoolean': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: false,
                        id: this.utilsSvc.createMmsId(),
                        ownerId: scope.element.id
                    });
                    newValueSpec = new ValueSpec(elementOb);
                    break;
                }
                case 'LiteralInteger': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: 0,
                        id: this.utilsSvc.createMmsId(),
                        ownerId: scope.element.id
                    })
                    newValueSpec = new ValueSpec(elementOb);
                    break;
                }
                case 'LiteralString': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: '',
                        id: this.utilsSvc.createMmsId(),
                        ownerId: scope.element.id
                    });
                    newValueSpec = new ValueSpec(elementOb);
                    break;
                }
                case 'LiteralReal': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: 0.0,
                        id: this.utilsSvc.createMmsId(),
                        ownerId: scope.element.id
                    });
                    newValueSpec = new ValueSpec(elementOb);
                    break;
                }
                default: {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: {},
                        id: this.utilsSvc.createMmsId(),
                        ownerId: scope.element.id
                    })
                }
            }




            scope.editValues.push(newValueSpec);
            if (scope.element.type == 'Property' || scope.element.type == 'Port') {
                scope.edit.defaultValue = newValueSpec;
            }
        };
        scope.addValueType = 'LiteralString';
        
        scope.addEnumerationValue = () => {
            var newValueSpec: ValueSpec = new ValueSpec({type: "InstanceValue", instanceId: scope.options[0], _projectId: scope.mmsProjectId, _refId: scope.mmsRefId, id: this.utilsSvc.createMmsId(), ownerId: scope.element.id});
            scope.editValues.push(newValueSpec);
            if (scope.element.type == 'Property' || scope.element.type == 'Port') {
                scope.edit.defaultValue = newValueSpec;
            }
        };

        scope.removeVal = (i) => {
            scope.editValues.splice(i, 1);
        };
    };

    public setupValCf(scope) {
        var data = scope.element;
        if (data.type === 'Property' || data.type === 'Port') {
            if (data.defaultValue) {
                scope.values = [data.defaultValue];
            } else {
                scope.values = [];
            }
        }
        if (data.type === 'Slot') {
            scope.values = data.value;
        }
        if (data.type === 'Constraint' && data.specification) {
            scope.values = [data.specification];
        }
        if (data.type === 'Expression') {
            scope.values = data.operand;
        }
    };

    /**
     * @ngdoc function
     * @name Utils#save
     * @methodOf veCore.Utils
     *
     * @description
     * save edited element
     *
     * @param {object} edit the edit object to save
     * @param {object} [editorApi=null] optional editor api
     * @param {object} scope angular scope that has common functions
     * @return {Promise} promise would be resolved with updated element if save is successful.
     *      For unsuccessful saves, it will be rejected with an object with type and message.
     *      Type can be error or info. In case of conflict, there is an option to discard, merge,
     *      or force save. If the user decides to discord or merge, type will be info even though
     *      the original save failed. Error means an actual error occured.
     */
    public save(edit, editorApi, scope, continueEdit) {
        var deferred = this.$q.defer();
        if (editorApi && editorApi.save) {
            editorApi.save();
        }
        this.elementSvc.updateElement(edit)
        .then((element) => {
            deferred.resolve(element);
            this.setupValCf(scope);
            let data = {
                element: element,
                continueEdit: (continueEdit) ? continueEdit : false
            };

            this.eventSvc.$broadcast('element.updated', data);
        }, (reason) => {
            if (reason.status === 409) {
                let latest = reason.data.elements[0]
                var instance = this.$uibModal.open({
                    component: 'saveConflict',
                    size: 'lg',
                    resolve: {
                        latest: () => {
                            return latest
                        }
                    }
                });
                instance.result.then((data) => {
                    let choice = data.$value;
                    if (choice === 'ok') {
                        var reqOb = {elementId: latest.id, projectId: latest._projectId, refId: latest._refId, commitId: 'latest'};
                        this.elementSvc.cacheElement(reqOb, latest, true);
                        this.elementSvc.cacheElement(reqOb, latest, false);
                    } else if (choice === 'force') {
                        edit._read = latest._read;
                        edit._modified = latest._modified;
                        this.save(edit, editorApi, scope, continueEdit).then((resolved) => {
                            deferred.resolve(resolved);
                        }, (error) => {
                            deferred.reject(error);
                        });
                    } else {
                        deferred.reject({type: 'cancel'});
                    }
                });
            } else {
                deferred.reject({type: 'error', message: reason.message});
            }
        });
        return deferred.promise;
    };

    /**
     * @ngdoc function
     * @name Utils#hasEdits
     * @methodOf  veCore.Utils
     *
     * @description
     * whether editing object has changes compared to base element,
     * currently compares name, doc, property values, if element is not
     * editable, returns false
     *
     * @param {object} editOb edit object
     * @return {boolean} has changes or not
     */
    public hasEdits(editOb) {
        editOb._commitId = 'latest';
        var cachedKey = this.utilsSvc.makeElementKey(editOb);
        var elementOb: ElementObject = this.cacheSvc.get<ElementObject>(cachedKey);
        if (editOb.name !== elementOb.name) {
            return true;
        }
        if (editOb.documentation !== elementOb.documentation) {
            return true;
        }
        if ((editOb.type === 'Property' || editOb.type === 'Port') && !angular.equals(editOb.defaultValue, elementOb.defaultValue)) {
            return true;
        } else if (editOb.type === 'Slot' && !angular.equals(editOb.value, elementOb.value)) {
            return true;
        } else if (editOb.type === 'Constraint' && !angular.equals(editOb.specification, elementOb.specification)) {
            return true;
        }
        return false;
    };

    /**
     * @ngdoc function
     * @name Utils#revertEdits
     * @methodOf veCore.Utils
     *
     * @description
     * reset editing object back to base element values for name, doc, values
     *
     * @param {object} editOb scope with common properties
     * @param {object} editorApi editor api to kill editor if reverting changes
     */
    public revertEdits(editValues, editOb, editorApi?) {
        if (editorApi && editorApi.destroy) {
            editorApi.destroy();
        }
        editOb._commitId = 'latest';
        var cachedKey = this.utilsSvc.makeElementKey(editOb);
        var elementOb: ElementObject = this.cacheSvc.get<ElementObject>(cachedKey);

        if (elementOb.name) {
            editOb.name = elementOb.name;
        }
        editOb.documentation = elementOb.documentation;
        if (editOb.type === 'Property' || editOb.type === 'Port') {
            editOb.defaultValue = JSON.parse(JSON.stringify(elementOb.defaultValue));
            if (editOb.defaultValue) {
                editValues = [editOb.defaultValue];
            } else {
                editValues = [];
            }
        } else if (editOb.type === 'Slot') {
            editOb.value = JSON.parse(JSON.stringify(elementOb.value));
            editValues = editOb.value;
        } else if (editOb.type === 'Constraint' && editOb.specification) {
            editOb.specification = JSON.parse(JSON.stringify(elementOb.specification));
            editValues = [editOb.specification];
        }
        return editValues;
    };

    public handleError(reason) {
        if (reason.type === 'info')
            this.growl.info(reason.message);
        else if (reason.type === 'warning')
            this.growl.warning(reason.message);
        else if (reason.type === 'error')
            this.growl.error(reason.message);
    };

    /**
     * @ngdoc function
     * @name Utils#isEnumeration
     * @methodOf veCore.Utils
     *
     * @description
     * Check if element is enumeration and if true get enumerable options
     *
     * @param {object} elementOb element object
     * @return {Promise} promise would be resolved with options and if object is enumerable.
     *      For unsuccessful saves, it will be rejected with an object with reason.
     */
    public isEnumeration(elementOb) {
        var deferred = this.$q.defer();
        if (elementOb.type === 'Enumeration') {
            var isEnumeration = true;
            var reqOb = {
                elementId: elementOb.id,
                projectId: elementOb._projectId,
                refId: elementOb._refId,
                depth: 1
            };
            this.elementSvc.getOwnedElements(reqOb).then(
                (val) => {
                    var newArray = [];
                     // Filter for enumeration type
                    for (var i = 0; i < val.length; i++) {
                        if (val[i].type === 'EnumerationLiteral') {
                            newArray.push(val[i]);
                        }
                    }
                    newArray.sort((a, b) => {
                        return a.name.localeCompare(b.name);
                    });
                    deferred.resolve({options: newArray, isEnumeration: isEnumeration});
                },
                (reason) => {
                    deferred.reject(reason);
                }
            );
        } else {
            deferred.resolve({options: [], isEnumeration: false});
        }
        return deferred.promise;
    };

    public getPropertySpec(elementOb) {
        var deferred = this.$q.defer();
        var id = elementOb.typeId;
        var isSlot = false;
        var isEnum = false;
        var options = [];
        if (elementOb.type === 'Slot') {
            isSlot = true;
            id = elementOb.definingFeatureId;
        }
        if (!id) { //no property type, will not be enum
            deferred.resolve({options: options, isEnumeration: isEnum, isSlot: isSlot});
            return deferred.promise;
        }
        // Get defining feature or type info
        var reqOb = {elementId: id, projectId: elementOb._projectId, refId: elementOb._refId};
        this.elementSvc.getElement(reqOb)
        .then((value) => {
            if (isSlot) {
                if (!value.typeId) {
                    deferred.resolve({options: options, isEnumeration: isEnum, isSlot: isSlot});
                    return;
                }
                //if it is a slot
                reqOb.elementId = value.typeId;
                this.elementSvc.getElement(reqOb) //this gets tyep of defining feature
                .then((val) => {
                    this.isEnumeration(val)
                    .then((enumValue) => {
                        if (enumValue.isEnumeration) {
                            isEnum = enumValue.isEnumeration;
                            options = enumValue.options;
                        }
                        deferred.resolve({options: options, isEnumeration: isEnum, isSlot: isSlot});
                    }, (reason) => {
                        deferred.resolve({options: options, isEnumeration: isEnum, isSlot: isSlot});
                    });
                });
            } else {
                this.isEnumeration(value)
                .then((enumValue) => {
                    if (enumValue.isEnumeration) {
                        isEnum = enumValue.isEnumeration;
                        options = enumValue.options;
                    }
                    deferred.resolve({options: options, isEnumeration: isEnum, isSlot:isSlot });
                }, (reason) => {
                    deferred.reject(reason);
                });
            }
        }, (reason) => {
            deferred.resolve({options: options, isEnumeration: isEnum, isSlot: isSlot});
        });
        return deferred.promise;
    };

    /**
    * @ngdoc function
    * @name Utils#startEdit
    * @methodOf veCore.Utils
    * @description
    * called by transcludes and section, adds the editing frame
    * uses these in the scope:
    *   element - element object for the element to edit (for sections it's the instance spec)
    *   isEditing - boolean
    *   commitId - calculated commit id
    *   isEnumeration - boolean
    *   recompileScope - child scope of directive scope
    *   skipBroadcast - boolean (whether to broadcast presentationElem.edit for keeping track of open edits)
    * sets these in the scope:
    *   edit - editable element object
    *   isEditing - true
    *   inPreviewMode - false
    *   editValues - array of editable values (for element that are of type Property, Slot, Port, Constraint)
    *
    * @param {UtilController} ctrl scope of the transclude directives or view section directive
    * @param {object} mmsViewCtrl parent view directive controller
    * @param {object} domElement dom of the directive, jquery wrapped
    * @param {string} template template to compile
    * @param {boolean} doNotScroll whether to scroll to element
    */
    public startEdit(ctrl: UtilController,
                     mmsViewCtrl, domElement: JQuery, template, doNotScroll) {
        if (mmsViewCtrl.isEditable() && !ctrl.isEditing && ctrl.element && ctrl.commitId === 'latest' && this.permissionsSvc.hasProjectIdBranchIdEditPermission(ctrl.mmsProjectId, ctrl.mmsRefId)) {
            var elementOb = ctrl.element;
            var reqOb = {elementId: elementOb.id, projectId: elementOb._projectId, refId: elementOb._refId};
            this.elementSvc.getElementForEdit(reqOb)
            .then((data) => {
                ctrl.isEditing = true;
                ctrl.inPreviewMode = false;
                ctrl.edit = data;

                if (data.type === 'Property' || data.type === 'Port') {
                    if (ctrl.edit.defaultValue) {
                        ctrl.editValues = [ctrl.edit.defaultValue];
                    }
                } else if (data.type === 'Slot') {
                    if (angular.isArray(data.value)) {
                        ctrl.editValues = data.value;
                    }
                } else if (data.type === 'Constraint' && data.specification) {
                    ctrl.editValues = [data.specification];
                }
                if (!ctrl.editValues) {
                    ctrl.editValues = [];
                }
                /*
                if (ctrl.isEnumeration && ctrl.editValues.length === 0) {
                    ctrl.editValues.push({type: 'InstanceValue', instanceId: null});
                }
                */
                if (template) {
                    if (ctrl.recompileScope) {
                        ctrl.recompileScope.$destroy();
                    }
                    ctrl.recompileScope = ctrl.$scope.$new();
                    domElement.empty();
                    domElement.append(template);
                    this.$compile(domElement.contents())(ctrl.recompileScope);
                }
                if (!ctrl.skipBroadcast) {
                    // Broadcast message for the toolCtrl:
                    this.eventSvc.$broadcast('presentationElem.edit',ctrl.edit);
                } else {
                    ctrl.skipBroadcast = false;
                }
                if (!doNotScroll) {
                    this._scrollToElement(domElement);
                }
            }, this.handleError);

            this.elementSvc.isCacheOutdated(ctrl.element)
            .then((data) => {
                if (data.status && data.server._modified > data.cache._modified) {
                    this.growl.warning('This element has been updated on the server');
                }
            });
        }
    };

    /**
     * @ngdoc function
     * @name Utils#saveAction
     * @methodOf veCore.Utils
     * @description
     * called by transcludes and section, saves edited element
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   elementSaving - boolean
     *   isEditing - boolean
     *   bbApi - button bar api - handles spinny
     * sets these in the scope:
     *   elementSaving - boolean
     *
     * @param {UtilController} ctrl
     * @param {object} domElement dom of the directive, jquery wrapped
     * @param {boolean} continueEdit save and continue
     */
    public saveAction(ctrl: UtilController, domElement: JQuery, continueEdit) {
        if (ctrl.elementSaving) {
            this.growl.info('Please Wait...');
            return;
        }
        this.clearAutosaveContent(ctrl.element._projectId + ctrl.element._refId + ctrl.element.id, ctrl.edit.type);
        if (ctrl.bbApi) {
            if (!continueEdit) {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-save');
            } else {
                ctrl.bbApi.toggleButtonSpinner('presentation-element-saveC');
            }
        }
        
        ctrl.elementSaving = true;

        const work = () => {
            this.save(ctrl.edit, ctrl.editorApi, ctrl, continueEdit).then((data) => {
                ctrl.elementSaving = false;
                if (!continueEdit) {
                    ctrl.isEditing = false;
                    this.eventSvc.$broadcast('presentationElem.save', ctrl.edit);
                }
                this.growl.success('Save Successful');
                //scrollToElement(domElement);
            }, (reason) => {
                ctrl.elementSaving = false;
                this.handleError(reason);
            }).finally(() => {
                if (ctrl.bbApi) {
                    if (!continueEdit) {
                        ctrl.bbApi.toggleButtonSpinner('presentation-element-save');
                    } else {
                        ctrl.bbApi.toggleButtonSpinner('presentation-element-saveC');
                    }
                }
            });
        };
        this.$timeout(work, 1000, false); //to give ckeditor time to save any changes
    };

    /**
    * @ngdoc function
    * @name veUtils/directives.Utils#cancelAction
    * @methodOf veUtils/directives.Utils
    * @description
    * called by transcludes and section, cancels edited element
    * uses these in the scope:
    *   element - element object for the element to edit (for sections it's the instance spec)
    *   edit - edit object
    *   elementSaving - boolean
    *   isEditing - boolean
    *   bbApi - button bar api - handles spinny
    * sets these in the scope:
    *   isEditing - false
    *
    * @param {object} scope scope of the transclude directives or view section directive
    * @param {object} recompile recompile function object
    * @param {object} domElement dom of the directive, jquery wrapped
    */
    public cancelAction(scope, recompile, domElement) {
        if (scope.elementSaving) {
            this.growl.info('Please Wait...');
            return;
        }
        const cancelCleanUp = () => {
            scope.isEditing = false;
            this.revertEdits(scope, scope.edit);
             // Broadcast message for the ToolCtrl:
            this.eventSvc.$broadcast('presentationElem.cancel', scope.edit);
            recompile();
            // scrollToElement(domElement);
        };
        if (scope.bbApi) {
            scope.bbApi.toggleButtonSpinner('presentation-element-cancel');
        }
        // Only need to confirm the cancellation if edits have been made:
        if (this.hasEdits(scope.edit)) {
            let deleteOb = {
                type: scope.edit.type,
                element: scope.element,
            }
            let instance = this.deleteEditModal(deleteOb)
            instance.result.then(() => {
                cancelCleanUp();
            }).finally(() => {
                if (scope.bbApi) {
                    scope.bbApi.toggleButtonSpinner('presentation-element-cancel');
                }
            });
        } else {
            cancelCleanUp();
            if (scope.bbApi) {
                scope.bbApi.toggleButtonSpinner('presentation-element-cancel');
            }
        }
    };

    public deleteEditModal(deleteOb) {
        return this.$uibModal.open({
            component: 'confirmDeleteModal',
            resolve: {
                getName: () => {
                    return deleteOb.type + " " + deleteOb.element.id;
                },
                getType: () => {
                    return 'edit';
                },
                ok: () => {
                    this.clearAutosaveContent(deleteOb.element._projectId + deleteOb.element._refId + deleteOb.element.id, deleteOb.type);
                    return true;
                }
            }
        });
    }

    public deleteAction(scope, bbApi, section) {
        if (scope.elementSaving) {
            this.growl.info('Please Wait...');
            return;
        }

        bbApi.toggleButtonSpinner('presentation-element-delete');

        let instance = this.$uibModal.open({
            component: 'confirmDeleteModal',
            resolve: {
                getType: () => {
                    return (scope.edit.type) ? scope.edit.type : 'element';
                },
                getName: () => {
                    return (scope.edit.name) ? scope.edit.name : 'Element';
                },
                ok: () => {
                    this.clearAutosaveContent(scope.element._projectId + scope.element._refId + scope.element.id, scope.edit.type);
                    return true;
                }
            }
        });
        instance.result.then(() => {
            var viewOrSec = section ? section : scope.view;
            var reqOb = {elementId: viewOrSec.id, projectId: viewOrSec._projectId, refId: viewOrSec._refId, commitId: 'latest'};
            this.viewSvc.removeElementFromViewOrSection(reqOb, scope.instanceVal)
            .then((data) => {
                if (this.viewSvc.isSection(scope.instanceSpec) || this.viewSvc.isTable(scope.instanceSpec) || this.viewSvc.isFigure(scope.instanceSpec) || this.viewSvc.isEquation(scope.instanceSpec)) {
                    // Broadcast message to TreeCtrl:
                    this.eventSvc.$broadcast('viewctrl.delete.element', scope.instanceSpec);
                }

                this.eventSvc.$broadcast('view-reorder.refresh');

                 // Broadcast message for the ToolCtrl:
                this.eventSvc.$broadcast('presentationElem.cancel',scope.edit);

                this.growl.success('Remove Successful');
            }, this.handleError);

        }).finally(() => {
            scope.bbApi.toggleButtonSpinner('presentation-element-delete');
        });
        }

    /**
    * @ngdoc function
    * @name Utils#previewAction
    * @methodOf veCore.Utils
    * @description
    * called by transcludes and section, previews edited element
    * uses these in the scope:
    *   element - element object for the element to edit (for sections it's the instance spec)
    *   edit - edit object
    *   elementSaving - boolean
    *   inPreviewMode - boolean
    *   isEditing - boolean
    *   bbApi - button bar api - handles spinny
    * sets these in the scope:
    *   skipBroadcast - true
    *   inPreviewMode - false
    *   isEditing - false
    *   elementSaving - false
    *
    * @param {object} scope scope of the transclude directives or view section directive
    * @param {object} recompile recompile function object
    * @param {object} domElement dom of the directive, jquery wrapped
    */
    public previewAction(scope, recompile, domElement) {
        if (scope.elementSaving) {
            this.growl.info('Please Wait...');
            return;
        }
        if (scope.edit && this.hasEdits(scope.edit) && !scope.inPreviewMode) {
            scope.skipBroadcast = true; //preview next click to go into edit mode from broadcasting
            scope.inPreviewMode = true;
            recompile(true);
        } else { //nothing has changed, cancel instead of preview
            if (scope.edit && scope.isEditing) {
                // Broadcast message for the ToolCtrl to clear out the tracker window:
                this.eventSvc.$broadcast('presentationElem.cancel', scope.edit);
                if (scope.element) {
                    recompile();
                }
            }
        }
        scope.isEditing = false;
        scope.elementSaving = false;
        this._scrollToElement(domElement);
    };

    public isDirectChildOfPresentationElementFunc(element, mmsViewCtrl) {
        var parent = element[0].parentElement;
        while (parent && parent.nodeName !== 'MMS-VIEW-PRESENTATION-ELEM' && parent.nodeName !== 'MMS-VIEW') {
            if (mmsViewCtrl.isTranscludedElement(parent.nodeName)) {
                return false;
            }
            if (parent.nodeName === 'MMS-VIEW-TABLE' || parent.nodeName === 'MMS-VIEW-LIST' || parent.nodeName === 'MMS-VIEW-SECTION')
                return false;
            parent = parent.parentElement;
        }
        return parent && parent.nodeName !== 'MMS-VIEW';

    };

    public hasHtml(s) {
        return s.indexOf('<p>') !== -1;

    };

    private _scrollToElement(domElement: JQuery) {
        this.$timeout(() => {
            var el = domElement[0];
            if ($(domElement).isOnScreen())
                return;
            el.scrollIntoView();
        }, 500, false);
    };

    public successUpdates(elemType, id) {
        this.eventSvc.$broadcast('view-reorder.refresh');
        this.eventSvc.$broadcast('view.reorder.saved', {id: id});
        this.growl.success("Adding " + elemType + " Successful");
        // Show comments when creating a comment PE
        if (elemType === 'Comment' && !this.rootScopeSvc.veCommentsOn()) {
            this.$timeout(() => {
                $('.show-comments').click();
            }, 0, false);
        }
    };

    /**
     * @ngdoc method
     * @name Utils#addPresentationElement
     * @methodOf veCore.Utils
     *
     * @description
     * Utility to add a new presentation element to view or section
     *
     * @param {Object} $ctrl controller
     * @param {string} type type of presentation element (Paragraph, Section)
     * @param {ElementObject} viewOrSectionOb the view or section (instance spec) object
     */
    public addPresentationElement($ctrl: angular.IComponentController, type: string, viewOrSectionOb: ElementObject) {
        // $ctrl.viewOrSectionOb = viewOrSectionOb;
        // $ctrl.presentationElemType = type;
        this.addItemData = {
            addType: 'pe',
            itemType: type,
            viewOrSectionOb: viewOrSectionOb,
            addPeIndex: $ctrl.addPeIndex
        }
        let instance = this.$uibModal.open({
            component: 'addItemModal',
            resolve: {
                getAddData: () => {
                    return this.addItemData;
                }
            }});
        instance.result.then((data) => {
            if (data.type !== 'InstanceSpecification' || this.viewSvc.isSection(data)) {
                return; //do not open editor for existing pes added or if pe/owner is a section
            }
            this.$timeout(() => { //auto open editor for newly added pe
                $('#' + data.id).find('mms-transclude-doc,mms-transclude-com').click();
            }, 0, false);
        });
    };

    /**
     * @ngdoc method
     * @name Utils#reopenUnsavedElts
     * @methodOf veCore.Utils
     * @description
     * called by transcludes when users have unsaved edits, leaves that view, and comes back to that view.
     * the editor will reopen if there are unsaved edits.
     * assumes no reload.
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   ve_edits - unsaved edits object
     *   startEdit - pop open the editor window
     * @param {object} scope scope of the transclude directives or view section directive
     * @param {String} transcludeType name, documentation, or value
     */
    public reopenUnsavedElts(ctrl: TranscludeController, transcludeType){
        var unsavedEdits = {};
        if (this.editSvc.openEdits() > 0) {
            unsavedEdits = this.editSvc.getAll();
        }
        var key = ctrl.element.id + '|' + ctrl.element._projectId + '|' + ctrl.element._refId;
        var thisEdits = unsavedEdits[key];
        if (!thisEdits || ctrl.commitId !== 'latest') {
            return;
        }
        if (transcludeType === 'value') {
            if (ctrl.element.type === 'Property' || ctrl.element.type === 'Port') {
                if (ctrl.element.defaultValue.value !== thisEdits.defaultValue.value ||
                        ctrl.element.defaultValue.instanceId !== thisEdits.defaultValue.instanceId) {
                    ctrl.startEdit();
                }
            } else if (ctrl.element.type === 'Slot') {
                var valList1 = thisEdits.value;
                var valList2 = ctrl.element.value;

                // Check if the lists' lengths are the same
                if (valList1.length !== valList2.length) {
                    ctrl.startEdit();
                } else {
                    for (var j = 0; j < valList1.length; j++) {
                        if (valList1[j].value !== valList2[j].value || valList1[j].instanceId !== valList2[j].instanceId) {
                            ctrl.startEdit();
                            break;
                        }
                    }
                }
            }
        } else if (ctrl.element[transcludeType] !== thisEdits[transcludeType]) {
            ctrl.startEdit();
        }
    };
    /**
     * @ngdoc method
     * @name Utils#revertAction
     * @methodOf veCore.Utils
     * @description
     * called by transcludes and section, cancels edited element
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   edit - edit object
     *   elementSaving - boolean
     *   isEditing - boolean
     *   bbApi - button bar api - handles spinny
     * sets these in the scope:
     *   isEditing - false
     *
     * @param {angular.IComponentController} $ctrl of the transclude component or view section component
     * @param {JQLite} domElement dom of the directive, jquery wrapped
     */
    public revertAction($ctrl: angular.IComponentController, domElement: JQLite) {
        this.revertData = {
            elementId: $ctrl.mmsElementId,
            projectId : $ctrl.mmsProjectId,
            refId: $ctrl.mmsRefId,
            baseCommit: $ctrl.baseCommit,
            compareCommit: $ctrl.compareCommit,
            element: $ctrl.element
        }
        var instance = this.$uibModal.open({
            size: 'lg',
            windowClass: 'revert-spec',
            component: 'revertConfirm',
            resolve: {
                getRevertData: () => {
                    return this.revertData
                }
            }
        });
        instance.result.then((data) => {
              // TODO: do anything here?
        });
    };

    public checkForDuplicateInstances(operand) {
        var seen = {}, dups = [], curr;
        for (var i = 0; i < operand.length; i++) {
            curr = operand[i].instanceId;
            if (curr) {
                if (seen[curr]) {
                    dups.push(operand[i]);
                    operand.splice(i, 1);
                    i--;
                    continue;
                }
                seen[curr] = true;
            } else {
                //instanceId is invalid?
            }
        }
        return dups;
    };

    public fixImgSrc(imgDom) {
        var src = imgDom.attr('src');
        if (src) {
            imgDom.attr('src', src + '?token=' + this.authSvc.getToken());
        }
        if (imgDom.width() < 860) { //keep image relative centered with text if less than 9 in
            return;
        }
        var parent = imgDom.parent('p');
        if (parent.length > 0) {
            if (parent.css('text-align') == 'center' || parent.hasClass('image-center')) {
                imgDom.addClass('image-center');
            }
            imgDom.unwrap(); //note this removes parent p and puts img and any of its siblings in its place
        }
    };

    public toggleLeftPane(searchTerm) {
        if ( searchTerm && !this.rootScopeSvc.leftPaneClosed() ) {
            this.eventSvc.$broadcast('left-pane-toggle', true);
        }

        if ( !searchTerm && this.rootScopeSvc.leftPaneClosed() ) {
            this.eventSvc.$broadcast('left-pane-toggle', false);
        }
    };

    public focusOnEditorAfterAddingWidgetTag(editor) {
        var element = editor.widgets.focused.element.getParent();
        var range = editor.createRange();
        if(range) {
            range.moveToClosestEditablePosition(element, true);
            range.select();
        }
    };
}

veCore.service('Utils',  Utils)
