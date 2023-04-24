import { PresentationLite } from '@ve-components/presentations'

import { veComponents } from '@ve-components'

import { IPresentationComponentOptions } from '@ve-types/components/presentation'

const PresentTableTComponent: IPresentationComponentOptions = {
    selector: 'presentTablet',
    template: `<view-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></view-cf>
`,
    bindings: {
        peObject: '<',
        instanceSpec: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
}

veComponents.component(PresentTableTComponent.selector, PresentTableTComponent)
