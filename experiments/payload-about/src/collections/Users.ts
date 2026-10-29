import type { CollectionConfig } from 'payload'

const isAdministrator = (user: unknown) => Boolean(user && typeof user === 'object' && 'role' in user && user.role === 'administrator')

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    read: ({ req }) => isAdministrator(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false,
    create: ({ req }) => isAdministrator(req.user),
    update: ({ req }) => isAdministrator(req.user),
    delete: () => false,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Administrator', value: 'administrator' },
        { label: 'Editor', value: 'editor' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
