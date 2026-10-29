import type { CollectionConfig } from 'payload'

const text = (name: string, label: string, required = true) => ({
  name,
  label,
  type: 'text' as const,
  required,
})

const textarea = (name: string, label: string) => ({
  name,
  label,
  type: 'textarea' as const,
  required: true,
})

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Editorial page', plural: 'Editorial pages' },
  admin: {
    group: 'Page studio',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    livePreview: { url: ({ data }) => `/${data.slug || 'about'}?preview=1` },
    preview: (data) => `/${data.slug || 'about'}?preview=1`,
  },
  access: {
    read: ({ req }) => req.user ? true : { _status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
    readVersions: ({ req }) => Boolean(req.user),
  },
  versions: { drafts: true, maxPerDoc: 0 },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar', description: 'Matches the public page path. Use home for the homepage.' } },
    { name: 'title', type: 'text', required: true },
    {
      name: 'hero',
      type: 'group',
      label: 'Page introduction',
      fields: [
        text('eyebrow', 'Eyebrow'),
        text('headline', 'Headline'),
        textarea('lead', 'Introduction'),
        text('imageUrl', 'Image path', false),
        text('imageAlt', 'Image description', false),
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Content sections',
      labels: { singular: 'section', plural: 'sections' },
      admin: {
        initCollapsed: true,
        description: 'Hover over a section to locate it in the preview. Add sections between existing sections, then drag to set their order. Saved changes appear in Versions and Section history.',
        components: { Field: '/components/SectionPreviewField#SectionPreviewField' },
      },
      blocks: [
        {
          slug: 'story',
          labels: { singular: 'Story', plural: 'Stories' },
          admin: { disableBlockName: true },
          fields: [
            text('eyebrow', 'Eyebrow'),
            text('headline', 'Headline'),
            textarea('body', 'Body'),
          ],
        },
        {
          slug: 'principles',
          labels: { singular: 'Principles', plural: 'Principles' },
          admin: { disableBlockName: true },
          fields: [
            text('eyebrow', 'Eyebrow'),
            text('headline', 'Section heading', false),
            {
              name: 'items',
              type: 'array',
              label: 'Principles',
              minRows: 1,
              maxRows: 5,
              fields: [text('title', 'Title'), textarea('body', 'Description')],
            },
          ],
        },
        {
          slug: 'imageStory',
          labels: { singular: 'Image and story', plural: 'Image and stories' },
          admin: { disableBlockName: true },
          fields: [
            text('eyebrow', 'Eyebrow'),
            text('headline', 'Headline'),
            textarea('body', 'Body'),
            text('imageUrl', 'Image path'),
            text('imageAlt', 'Image description'),
          ],
        },
        {
          slug: 'storyCarousel',
          labels: { singular: 'Story carousel', plural: 'Story carousels' },
          admin: { disableBlockName: true },
          fields: [
            text('eyebrow', 'Eyebrow', false),
            text('headline', 'Section heading'),
            { name: 'introduction', label: 'Introduction', type: 'textarea' },
            {
              name: 'cards',
              type: 'array',
              label: 'Slides',
              minRows: 2,
              maxRows: 6,
              admin: { initCollapsed: true, description: 'Each slide is a large editorial card. Drag slides to change their order.' },
              fields: [
                text('label', 'Small label', false),
                text('headline', 'Headline'),
                { name: 'body', label: 'Description', type: 'textarea' },
                text('imageUrl', 'Image path or HTTPS URL'),
                text('imageAlt', 'Image description'),
                text('linkLabel', 'Link text', false),
                text('linkUrl', 'Link path or HTTPS URL', false),
              ],
            },
          ],
        },
        {
          slug: 'quote',
          labels: { singular: 'Pull quote', plural: 'Pull quotes' },
          admin: { disableBlockName: true },
          fields: [textarea('quote', 'Quote'), text('attribution', 'Attribution', false)],
        },
        {
          slug: 'callToAction',
          labels: { singular: 'Invitation', plural: 'Invitations' },
          admin: { disableBlockName: true },
          fields: [
            text('headline', 'Headline'),
            textarea('body', 'Body'),
            text('linkLabel', 'Link label'),
            text('linkUrl', 'Link URL'),
          ],
        },
        {
          slug: 'featureSlot',
          labels: { singular: 'Site feature', plural: 'Site features' },
          admin: { disableBlockName: true },
          fields: [
            {
              name: 'feature',
              type: 'select',
              required: true,
              admin: { description: 'Place an existing site feature among editorial sections. Its live data and service links stay connected.' },
              options: [
                { label: 'Upcoming events', value: 'upcomingEvents' },
                { label: 'Visit and directions', value: 'visit' },
                { label: 'Member portal', value: 'memberPortal' },
                { label: 'Livestream', value: 'livestream' },
                { label: 'Contact form', value: 'contactForm' },
                { label: 'Giving methods', value: 'donationMethods' },
              ],
            },
            text('eyebrow', 'Eyebrow', false),
            text('headline', 'Heading', false),
            { name: 'body', label: 'Introduction', type: 'textarea' },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [async ({ doc, previousDoc, req }) => {
      const before = Array.isArray(previousDoc?.layout) ? previousDoc.layout : []
      const after = Array.isArray(doc.layout) ? doc.layout : []
      const beforeById = new Map<string, { row: Record<string, unknown>; index: number }>(before.map((row: Record<string, unknown>, index: number) => [String(row.id), { row, index }]))
      const afterIds = new Set(after.map((row: { id?: string }) => row.id))
      const beforeOrder = before.map((row: { id?: string }) => String(row.id)).filter((id: string) => afterIds.has(id))
      const afterOrder = after.map((row: { id?: string }) => String(row.id)).filter((id: string) => beforeById.has(id))
      const lengths = Array.from({ length: beforeOrder.length + 1 }, () => Array<number>(afterOrder.length + 1).fill(0))
      for (let i = beforeOrder.length - 1; i >= 0; i--) {
        for (let j = afterOrder.length - 1; j >= 0; j--) {
          lengths[i][j] = beforeOrder[i] === afterOrder[j] ? 1 + lengths[i + 1][j + 1] : Math.max(lengths[i + 1][j], lengths[i][j + 1])
        }
      }
      const unchangedOrder = new Set<string>()
      let i = 0
      let j = 0
      while (i < beforeOrder.length && j < afterOrder.length) {
        if (beforeOrder[i] === afterOrder[j]) { unchangedOrder.add(beforeOrder[i]); i++; j++ }
        else if (lengths[i + 1][j] >= lengths[i][j + 1]) i++
        else j++
      }
      const changes: Array<{ action: 'added' | 'edited' | 'moved' | 'removed'; row: Record<string, unknown>; from?: number; to?: number }> = []

      after.forEach((row: Record<string, unknown>, index: number) => {
        const old = beforeById.get(String(row.id))
        if (!old) changes.push({ action: 'added', row, to: index + 1 })
        else {
          if (JSON.stringify(old.row) !== JSON.stringify(row)) changes.push({ action: 'edited', row, from: old.index + 1, to: index + 1 })
          if (!unchangedOrder.has(String(row.id))) changes.push({ action: 'moved', row, from: old.index + 1, to: index + 1 })
        }
      })
      before.forEach((row: Record<string, unknown>, index: number) => {
        if (!afterIds.has(row.id)) changes.push({ action: 'removed', row, from: index + 1 })
      })

      for (const change of changes) {
        await req.payload.create({
          collection: 'row-activity',
          data: {
            pageSlug: doc.slug,
            rowId: String(change.row.id ?? ''),
            rowType: String(change.row.blockType ?? ''),
            action: change.action,
            fromPosition: change.from,
            toPosition: change.to,
            actor: req.user?.email ?? 'Local editor',
            summary: `${String(change.row.blockType ?? 'Section')} ${change.action}`,
            snapshot: change.row,
          },
          req,
        })
      }
    }],
  },
}
