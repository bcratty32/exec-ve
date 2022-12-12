import angular from 'angular'

import { veComponents } from '@ve-components'

import { PresentationComponentOptions } from '@ve-types/components'

const PresentTableTComponent: PresentationComponentOptions = {
    selector: 'presentTableT',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></mms-cf>
`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: class PresentTableTController
        implements angular.IComponentController
    {
        public peObject
        public element
        public peNumber

        constructor() {}
    },
}

veComponents.component(PresentTableTComponent.selector, PresentTableTComponent)
