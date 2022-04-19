import * as angular from "angular";
import {ButtonBarApi, ButtonBarService} from "./ButtonBar.service";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {veCore} from "../ve-core.module";



let ButtonBarComponent: VeComponentOptions = {
    selector: "buttonBar",
    template: `
    <span ng-repeat="button in $ctrl.buttons | filter: {permission: true}">

  <!-- Normal button -->
  <a type="button" ng-if="!button.dropdown_buttons" class="btn btn-tools btn-sm {{button.id}}"
      ng-click="button.action($event)" uib-tooltip="{{button.tooltip}}" tooltip-append-to-body="false"
      tooltip-trigger="mouseenter" tooltip-popup-delay="100" tooltip-placement="{{button.placement}}">
      <i class="fa {{button.icon}}"></i>{{button.text}}</a>

  <!-- Button with dropdown buttons -->
  <span ng-if="button.dropdown_buttons" class="btn-group" uib-dropdown>
    <button type="button" class="btn btn-tools btn-sm dropdown-toggle {{button.id}}" uib-dropdown-toggle uib-tooltip="{{button.tooltip}}"
        tooltip-append-to-body="false" tooltip-trigger="mouseenter" tooltip-popup-delay="100"
        tooltip-placement="{{button.placement}}">
        <i class="fa {{button.icon}}"></i>{{button.button_content}}<span class="caret"></span></button>
    <ul class="dropdown-menu" role="menu">
      <li>
          <a ng-repeat="dropdown_button in button.dropdown_buttons | filter: {permission: true}" type="button"
              class="center {{dropdown_button.id}} {{ button.id === 'view-mode-dropdown' && dropdown_button.selected ? 'checked-list-item' : ''}}" ng-click="dropdown_button.action($event); mmsBbApi.select(button, dropdown_button)"><i
              class="fa {{dropdown_button.icon}}"> </i>&nbsp;{{dropdown_button.tooltip}}</a>
      </li>
    </ul>
  </span>

</span>

`,
    bindings: {
        bbApi: "<buttonApi"
    },
    controller: class ButtonBarController implements angular.IComponentController {

        public buttons
        private bbApi

        static $inject = []

        constructor() {
        }

        $doCheck() {
            if (this.bbApi instanceof ButtonBarApi) {
                this.buttons = this.bbApi.buttons;
            }
        }

    }
}

veCore.component(ButtonBarComponent.selector, ButtonBarComponent);