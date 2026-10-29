import type { CollectionConfig } from 'payload'

export const RowActivity: CollectionConfig = {
  slug: 'row-activity',
  labels: { singular: 'Section change', plural: 'Section history' },
  admin: { group: 'Page studio', useAsTitle: 'summary', defaultColumns: ['summary', 'pageSlug', 'actor', 'createdAt'] },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'pageSlug', type: 'text', label: 'Page', required: true, index: true },
    { name: 'rowId', type: 'text', required: true, index: true },
    { name: 'rowType', type: 'text', required: true },
    { name: 'action', type: 'select', required: true, options: ['added', 'edited', 'moved', 'removed'] },
    { name: 'fromPosition', type: 'number' },
    { name: 'toPosition', type: 'number' },
    { name: 'actor', type: 'text' },
    { name: 'summary', type: 'text', required: true },
    { name: 'snapshot', type: 'json' },
  ],
}
