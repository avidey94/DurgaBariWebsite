import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import config from './src/payload.config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const sharedDatabase = Boolean(process.env.PAYLOAD_POSTGRES_URL)
const accounts = sharedDatabase ? [
  { email: process.env.PAYLOAD_ADMIN_EMAIL || 'avidey94@gmail.com', password: process.env.PAYLOAD_ADMIN_PASSWORD, role: 'administrator' as const },
  { email: process.env.PAYLOAD_EDITOR_EMAIL || 'it@thedurgacenter.org', password: process.env.PAYLOAD_EDITOR_PASSWORD, role: 'editor' as const },
] : [
  { email: 'editor@durgabari.local', password: randomBytes(32).toString('hex'), role: 'administrator' as const },
]

for (const account of accounts) {
  if (!account.password) throw new Error(`Set a password for ${account.email} before seeding the shared database.`)
  const existing = await payload.find({ collection: 'users', where: { email: { equals: account.email } }, limit: 1 })
  if (!existing.docs.length) {
    await payload.create({ collection: 'users', data: { email: account.email, password: account.password, role: account.role } })
  } else if (existing.docs[0].role !== account.role) {
    await payload.update({ collection: 'users', id: existing.docs[0].id, data: { role: account.role } })
  }
}

const existingPage = await payload.find({ collection: 'pages', where: { slug: { equals: 'about' } }, limit: 1 })

if (!existingPage.docs.length) {
  const initialPage = JSON.parse(readFileSync(new URL('./about-page.json', import.meta.url), 'utf8'))
  await payload.create({
    collection: 'pages',
    data: initialPage,
  })
}

console.log('About page studio is ready. Open /about and /admin on the Payload host.')
process.exit(0)
