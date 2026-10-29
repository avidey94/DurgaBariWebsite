import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user) && process.env.NODE_ENV !== 'production',
    update: ({ req }) => Boolean(req.user) && process.env.NODE_ENV !== 'production',
    delete: ({ req }) => Boolean(req.user) && process.env.NODE_ENV !== 'production',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
