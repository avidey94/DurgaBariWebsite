import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { attachDatabasePool } from '@vercel/functions'
import { readFileSync } from 'node:fs'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { RowActivity } from './collections/RowActivity'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const postgresURL = process.env.PAYLOAD_POSTGRES_URL
const postgresConnection = postgresURL ? new URL(postgresURL) : null
postgresConnection?.searchParams.delete('sslmode')
postgresConnection?.searchParams.delete('sslrootcert')
const certificate = process.env.PAYLOAD_POSTGRES_CA?.replace(/\\n/g, '\n') ||
  (process.env.PAYLOAD_POSTGRES_CA_PATH ? readFileSync(process.env.PAYLOAD_POSTGRES_CA_PATH, 'utf8') : '')

if (postgresURL && !certificate) {
  throw new Error('PAYLOAD_POSTGRES_CA or PAYLOAD_POSTGRES_CA_PATH is required for the shared Payload database.')
}
if (process.env.NODE_ENV === 'production' && !postgresURL) {
  throw new Error('PAYLOAD_POSTGRES_URL is required in production; SQLite is local-only.')
}

const database = postgresURL
  ? postgresAdapter({
      pool: {
        connectionString: postgresConnection!.toString(),
        max: 6,
        idleTimeoutMillis: 1_000,
        connectionTimeoutMillis: 5_000,
        query_timeout: 15_000,
        ssl: { ca: certificate, rejectUnauthorized: true },
      },
      schemaName: 'payload_cms',
      disableCreateDatabase: true,
      push: false,
      prodMigrations: migrations,
    })
  : sqliteAdapter({ client: { url: process.env.DATABASE_URL || 'file:./payload-about.db' } })

export default buildConfig({
  onInit: (payload) => {
    if (process.env.VERCEL_URL && process.env.VERCEL_REGION && postgresURL) {
      const pool = (payload.db as { pool?: Parameters<typeof attachDatabasePool>[0] }).pool
      if (pool) attachDatabasePool(pool)
    }
  },
  admin: {
    user: Users.slug,
    autoLogin: process.env.NODE_ENV === 'development' && !postgresURL ? { email: 'editor@durgabari.local' } : false,
    livePreview: { url: ({ data }) => `/${data.slug || 'about'}?preview=1`, collections: ['pages'] },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Pages, RowActivity],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: database,
  sharp,
  plugins: [],
})
