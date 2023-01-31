import { IToolBarButton } from '@ve-core/toolbar'

export const default_toolbar_buttons: IToolBarButton[] = [
    {
        id: 'spec-inspector',
        category: 'document',
        icon: 'fa-eye',
        selected: true,
        active: true,
        permission: true,
        tooltip: 'Preview Element',
        spinner: false,
        dynamic_ids: ['spec-editor-saveall'],
        enabledFor: ['main'],
    },
    {
        id: 'spec-history',
        category: 'global',
        icon: 'fa-history',
        selected: false,
        active: true,
        permission: true,
        tooltip: 'Element History',
        spinner: false,
        dynamic_ids: ['spec-editor-saveall'],
    },
    {
        id: 'spec-editor',
        category: 'document',
        icon: 'fa-edit',
        selected: false,
        active: true,
        permission: false,
        tooltip: 'Edit Element',
        spinner: false,
        dynamic_ids: [
            'spec-editor-save',
            'spec-editor-saveC',
            'spec-editor-saveall',
            'spec-editor-cancel',
        ],
    },
    {
        id: 'spec-reorder',
        category: 'global',
        icon: 'fa-arrows-v',
        selected: false,
        active: true,
        permission: false,
        tooltip: 'Reorder Spec',
        spinner: false,
        dynamic_ids: ['spec-reorder-save', 'spec-reorder-cancel'],
        enabledFor: [
            'main.project.ref.portal.preview',
            'main.project.ref.document',
        ],
    },
    {
        id: 'spec-ref-list',
        category: 'document',
        icon: 'fa-code-fork',
        selected: false,
        active: true,
        permission: true,
        tooltip: 'Branches and Tags',
        spinner: false,
    },
]

export const default_dynamic_buttons: IToolBarButton[] = [
    {
        id: 'spec-editor-save',
        category: 'dynamic',
        icon: 'fa-save',
        dynamic: true,
        selected: false,
        active: false,
        permission: true,
        tooltip: 'Save',
        spinner: false,
    },
    {
        id: 'spec-editor-saveC',
        category: 'dynamic',
        icon: 'fa-regular fa-paper-plane',
        dynamic: true,
        selected: false,
        active: false,
        permission: true,
        tooltip: 'Save and Continue',
        spinner: false,
    },
    {
        id: 'spec-editor-saveall',
        category: 'dynamic',
        icon: 'fa-save-all',
        dynamic: true,
        selected: false,
        active: false,
        permission: false,
        tooltip: 'Save All (alt + a)',
        spinner: false,
    },
    {
        id: 'spec-editor-cancel',
        category: 'dynamic',
        icon: 'fa-times',
        dynamic: true,
        selected: false,
        active: false,
        permission: true,
        tooltip: 'Cancel',
        spinner: false,
    },
    {
        id: 'spec-reorder-save',
        category: 'dynamic',
        icon: 'fa-save',
        dynamic: true,
        selected: false,
        active: false,
        permission: true,
        tooltip: 'Save',
        spinner: false,
    },
    {
        id: 'spec-reorder-cancel',
        category: 'dynamic',
        icon: 'fa-times',
        dynamic: true,
        selected: false,
        active: false,
        permission: true,
        tooltip: 'Cancel',
        spinner: false,
    },
]
