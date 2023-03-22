import { IToolBarButton } from '@ve-core/toolbar'

export const right_default_toolbar: IToolBarButton[] = [
    {
        id: 'spec-inspector',
        icon: 'fa-eye',
        selected: true,
        active: true,
        permission: true,
        tooltip: 'Preview Element',
        spinner: false,
        dynamic_ids: ['spec-editor.saveall'],
        enabledFor: ['main.project.ref'],
    },
    {
        id: 'spec-history',
        icon: 'fa-history',
        selected: false,
        active: true,
        permission: true,
        tooltip: 'Element History',
        spinner: false,
        dynamic_ids: ['spec-editor.saveall'],
        enabledFor: ['main.project.ref'],
    },
    {
        id: 'spec-editor',
        icon: 'fa-edit',
        selected: false,
        active: true,
        permission: false,
        tooltip: 'Edit Element',
        spinner: false,
        dynamic_ids: ['spec-editor.save', 'spec-editor.saveC', 'spec-editor.saveall', 'spec-editor.cancel'],
        enabledFor: ['main.project.ref'],
    },
    {
        id: 'spec-reorder',
        icon: 'fa-arrows-v',
        selected: false,
        active: true,
        permission: false,
        tooltip: 'Reorder Spec',
        spinner: false,
        dynamic_ids: ['spec-reorder.save', 'spec-reorder.cancel'],
        enabledFor: ['**.portal.**', '**.present.**'],
    },
    {
        id: 'spec-ref-list',
        icon: 'fa-code-fork',
        selected: false,
        active: true,
        permission: true,
        tooltip: 'Branches and Tags',
        spinner: false,
        enabledFor: ['main.project.ref'],
    },
]

export const right_dynamic_toolbar: IToolBarButton[] = [
    {
        id: 'spec-editor.save',
        icon: 'fa-save',
        dynamic: true,
        selected: false,
        active: false,
        permission: true,
        tooltip: 'Save',
        spinner: false,
    },
    {
        id: 'spec-editor.saveC',
        icon: 'fa-regular fa-paper-plane',
        dynamic: true,
        selected: false,
        active: false,
        permission: true,
        tooltip: 'Save and Continue',
        spinner: false,
    },
    {
        id: 'spec-editor.saveall',
        icon: 'fa-save-all',
        dynamic: true,
        selected: false,
        active: false,
        permission: false,
        tooltip: 'Save All (alt + a)',
        spinner: false,
    },
    {
        id: 'spec-editor.cancel',
        icon: 'fa-times',
        dynamic: true,
        selected: false,
        active: false,
        permission: true,
        tooltip: 'Cancel',
        spinner: false,
    },
    {
        id: 'spec-reorder.save',
        icon: 'fa-save',
        dynamic: true,
        selected: false,
        active: false,
        permission: true,
        tooltip: 'Save',
        spinner: false,
    },
    {
        id: 'spec-reorder.cancel',
        icon: 'fa-times',
        dynamic: true,
        selected: false,
        active: false,
        permission: true,
        tooltip: 'Cancel',
        spinner: false,
    },
]
