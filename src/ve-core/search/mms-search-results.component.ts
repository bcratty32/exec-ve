import * as angular from "angular";

import {veCore} from "../ve-core.module";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";

export class MmsSearchResultsController implements angular.IComponentController {

}
let MmsSearchResultsComponent: VeComponentOptions = {
    selector: "mmsSearchResults",
    require: {
      $search: "^^mmsSearch"
    },
    bindings: {
        elem: "<"
    },
    template: `
    <div class="elem-name-wrapper">
    <span class="{{ getTypeClass(elem) }}"></span>
    <a class="elem-name" ng-click="userResultClick(elem, 'name')">{{elem.name}}</a>
    <a class="elem-name" ng-show="elem.type == 'Slot'" ng-click="userResultClick(elem, 'name')">
        <mms-transclude-name mms-element-id="{{elem.definingFeatureId}}" mms-project-id="{{elem._projectId}}" mms-ref-id="{{elem._refId}}" no-click="true"></mms-transclude-name>
    </a>
</div>
<div class="elem-qualified-name-wrapper">
    <div ng-click="expandQualifiedName($event, elem._qualifiedName);" class="elem-qualified-name">
        {{qualifiedNameFormatter(elem._qualifiedName)}}
    </div>
</div>
<div ng-if="elem.type === 'Diagram' && elem._artifacts">
    <mms-transclude-img ng-click="userResultClick(elem, 'img')" mms-element-id="{{elem.id}}" mms-project-id="{{elem._projectId}}" mms-ref-id="{{elem._refId}}"></mms-transclude-img>
</div>
<div ng-if="elem.type !== 'Diagram' && elem._artifacts">
    <mms-transclude-art mms-element-id="{{elem.id}}" mms-project-id="{{elem._projectId}}" mms-ref-id="{{elem._refId}}"></mms-transclude-art>
</div>
<div class="elem-documentation-wrapper">
    <label>Documentation</label>
    <div class="elem-documentation">
        <a ng-show="elem.documentation" ng-bind-html="elem.documentation | limitTo:270" ng-click="userResultClick(elem, 'doc')"></a><span class="ellipses">{{elem.documentation.length > 270 ? ' ...' : ''}}</span>
        <span><a ng-show="!elem.documentation" ng-click="userResultClick(elem, 'doc')">
          {{emptyDocTxt}}
          </a></span>
    </div>
</div>
<div ng-if="(elem.type === 'Property' || elem.type === 'Port') && elem.defaultValue">
    <label>Value</label>
    <div class="elem-properties">
        <a ng-click="userResultClick(elem, 'val')">
            {{elem.defaultValue.value + '' | limitTo:250 || elem.defaultValue.body[0] | limitTo:250 || 'Default Value'}}<span class="ellipses">{{(elem.defaultValue.body[0] && elem.defaultValue.body.length > 1 || val.value.length > 250) ? ' ...' : '' }}</span>
        </a>
    </div>
</div>
<div ng-if="elem.type === 'Slot' && elem.value">
    <label>Value</label>
    <div class="elem-properties">
        <a ng-click="userResultClick(elem, 'val')">
            <span ng-repeat="val in elem.value">
                {{val.value + '' | limitTo:250 || val.body[0] | limitTo:250 || 'Default Value'}}<span class="ellipses">{{(val.body[0] && val.body.length > 1 || val.value.length > 250) ? ' ...' : '' }}</span>{{$last ? '' : ', '}}
            </span>
        </a>
    </div>
</div>
<div ng-if="elem.type === 'Constraint'">
    <label>Specification</label>
    <div class="elem-specification">
        <a ng-click="userResultClick(elem, 'val')">
            {{elem.specification.value + '' || 'Constraint Specification'}}
        </a>
    </div>
    <a ng-click="userResultClick(elem, 'val')">
        <div ng-repeat="str in elem.specification.body">
            <div class="elem-specification">{{str}}</div>
        </div>
    </a>
</div>
<div ng-if="elem._properties[0]" class="elem-properties-wrapper ve-search">
    <label>Properties</label>
    <table>
        <tr ng-repeat="property in elem._properties | limitTo : limitForProps">
            <td>
                {{property.name}}<span ng-if="property.type === 'Slot'"><mms-transclude-name mms-element-id="{{property.definingFeatureId}}" mms-project-id="{{elem._projectId}}" mms-ref-id="{{elem._refId}}" no-click="true"></mms-transclude-name></span>: 
            </td>
            <td>
                <a ng-click="userResultClick(property, 'val')">{{property.defaultValue.value | limitTo:300}}
                    <span ng-if="property.type === 'Slot'" ng-repeat="val in property.value | limitTo:4">
                        <span ng-bind-html="val.value | limitTo:300"></span>
                        <span ng-bind-html="val.body[0] | limitTo:300"></span>
                        <span ng-if="!val.value && !val.body[0]">Default Value</span>
                    </span>
                    <!-- set variable for limit -->
                    <span ng-if="property.value.length > 4 || property.defaultValue.value.length > 300">...</span>
                </a>
            </td>
        </tr>
        <tr class="visibility-toggle" ng-show="elem._properties.length > 6">
            <td></td>
            <td>
                <a ng-click="showSearchResultProps = !showSearchResultProps; showSearchResultProps ? switchText='Less' : switchText='More'; showSearchResultProps ? limitForProps=50 : limitForProps=6" ng-class="{active: showSearchResultProps}">{{switchText}}</a>
            </td>
        </tr>
    </table>
</div>
<div ng-if="elem.allRelatedDocuments.length > 0" class="elem-related-docs-wrapper">
    <label>Related Documents</label>
    <!-- show no more than three related views here-->
    <div ng-repeat="doc in elem.someRelatedDocuments" class="elem-documentation">
        <mms-view-link suppress-numbering="true" mms-project-id="{{elem._projectId}}" mms-ref-id="{{elem._refId}}" mms-doc-id="{{doc.relatedDocument.id}}" mms-element-id="{{doc.relatedDocument.id}}" ng-click="userRelatedClick($event, doc.relatedDocument, doc.relatedDocument, elem)"></mms-view-link>
        > <mms-view-link suppress-numbering="true" mms-project-id="{{elem._projectId}}" mms-ref-id="{{elem._refId}}" mms-doc-id="{{doc.relatedDocument.id}}" mms-element-id="{{doc.relatedView.id}}" ng-click="userRelatedClick($event, doc.relatedDocument, doc.relatedView, elem)"></mms-view-link><br/>
    </div>

    <!-- show the remaining related views when users click on "More" -->
    <div ng-if="elem.remainingRelatedDocuments">
        <div ng-repeat="doc in elem.remainingRelatedDocuments" class="elem-documentation">
            <mms-view-link suppress-numbering="true" mms-project-id="{{elem._projectId}}" mms-ref-id="{{elem._refId}}" mms-doc-id="{{doc.relatedDocument.id}}" mms-element-id="{{doc.relatedDocument.id}}" ng-click="userRelatedClick($event, doc.relatedDocument, doc.relatedDocument, elem)"></mms-view-link>
            > <mms-view-link suppress-numbering="true" mms-project-id="{{elem._projectId}}" mms-ref-id="{{elem._refId}}" mms-doc-id="{{doc.relatedDocument.id}}" mms-element-id="{{doc.relatedView.id}}" ng-click="userRelatedClick($event, doc.relatedDocument, doc.relatedView, elem)"></mms-view-link><br/>
        </div>
    </div>

    <div class="show-more-container" ng-if="!elem.remainingRelatedDocuments && elem.allRelatedDocuments.length > elem.someRelatedDocuments.length">
        <a class="show-more-btn" ng-click="showMoreRelatedViews(elem);"> {{(elem.allRelatedDocuments.length - elem.someRelatedDocuments.length) + ' More'}}
        </a>
    </div>

</div>
<div ng-if="elem.type != 'InstanceSpecification'">
    <label>Metatypes</label>
    <div class="elem-type-wrapper">
        <span class="elem-type">{{elem.type}}</span>
        <span ng-if="elem._appliedStereotypeIds.length">
            <span ng-repeat="type in elem._appliedStereotypeIds">
                <mms-transclude-name class="elem-type" mms-element-id="{{type}}" mms-project-id="{{elem._projectId}}" mms-ref-id="{{elem._refId}}" no-click="true"></mms-transclude-name>
            </span>
        </span>
    </div>
</div>
<div class="elem-updated-wrapper">
    <div>Last modified {{elem._modified | date:'M/d/yy h:mm a'}} by <b>{{elem._modifier}}</b></div>
</div>
    `,
    controller: MmsSearchResultsController
}