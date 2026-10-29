import 'dotenv/config'
import { readFileSync } from 'node:fs'
import config from './src/payload.config'
import { getPayload } from 'payload'
import type { Page } from './src/payload-types'

const payload = await getPayload({ config })
const pages = JSON.parse(readFileSync(new URL('./content-pages.json', import.meta.url), 'utf8')) as Array<{
  slug: string
  title: string
  _status: 'published'
  hero: { eyebrow: string; headline: string; lead: string; imageUrl?: string; imageAlt?: string }
  layout: Array<Record<string, unknown>>
}>

for (const page of pages) {
  const existing = await payload.find({ collection: 'pages', where: { slug: { equals: page.slug } }, limit: 1 })
  if (existing.docs.length) {
    console.log(`Preserved existing ${page.slug} page`)
    continue
  }
  await payload.create({ collection: 'pages', data: page as unknown as Omit<Page, 'id' | 'createdAt' | 'updatedAt'> })
  console.log(`Created published ${page.slug} page`)
}

process.exit(0)
