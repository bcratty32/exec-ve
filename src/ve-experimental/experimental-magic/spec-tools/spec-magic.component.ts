import angular from 'angular'
import _ from 'lodash'

import { ComponentService } from '@ve-components/services'
import { SpecTool, ISpecTool, SpecService } from '@ve-components/spec-tools'
import { ToolbarService } from '@ve-core/tool-bar'
import {
    AuthService,
    ElementService,
    PermissionsService,
    ProjectService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { EventService, UtilsService } from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VeComponentOptions } from '@ve-types/angular'

class SpecMagicController extends SpecTool implements ISpecTool {
    static $inject = [...SpecTool.$inject]

    constructor(
        $scope: angular.IScope,
        $element: JQuery<HTMLElement>,
        $q: angular.IQService,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        uRLSvc: URLService,
        authSvc: AuthService,
        elementSvc: ElementService,
        projectSvc: ProjectService,
        utilsSvc: UtilsService,
        viewSvc: ViewService,
        permissionsSvc: PermissionsService,
        eventSvc: EventService,
        specSvc: SpecService,
        toolbarSvc: ToolbarService
    ) {
        super(
            $scope,
            $element,
            $q,
            growl,
            componentSvc,
            uRLSvc,
            authSvc,
            elementSvc,
            projectSvc,
            utilsSvc,
            viewSvc,
            permissionsSvc,
            eventSvc,
            specSvc,
            toolbarSvc
        )
        this.specType = _.kebabCase(SpecMagicComponent.selector)
        this.specTitle = 'Magic Element'
    }
}

const SpecMagicComponent: VeComponentOptions = {
    selector: 'specMagic',
    template: `
    <p>Hello World!!</p>
`,
    controller: SpecMagicController,
}

veComponents.component(SpecMagicComponent.selector, SpecMagicComponent)
