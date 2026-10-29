import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import config from './src/payload.config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const editorEmail = 'editor@durgabari.local'
const existingEditor = await payload.find({ collection: 'users', where: { email: { equals: editorEmail } }, limit: 1 })

if (!existingEditor.docs.length) {
  await payload.create({ collection: 'users', data: { email: editorEmail, password: randomBytes(32).toString('hex') } })
}

const existingPage = await payload.find({ collection: 'pages', where: { slug: { equals: 'about' } }, limit: 1 })

if (!existingPage.docs.length) {
  await payload.create({
    collection: 'pages',
    data: {
      slug: 'about',
      title: 'About Durga Bari',
      _status: 'published',
      hero: {
        eyebrow: 'About Durga Bari',
        headline: 'A sacred home, shaped by community.',
        lead: 'Durga Bari brings worship, cultural heritage, and community life together in one welcoming place.',
        imageUrl: '/durgacenter/maa-durga-inauguration.jpg',
        imageAlt: 'Worship at Durga Bari’s inaugural gathering',
      },
      layout: [
        {
          blockType: 'story',
          eyebrow: 'Our purpose',
          headline: 'A living place for worship and connection.',
          body: 'We envision a home for prayer and spiritual growth that also makes room for cultural programs, youth education, and community gatherings. The people who take part give Durga Bari its meaning.',
        },
        {
          blockType: 'principles',
          eyebrow: 'What guides us',
          items: [
            { title: 'Devotion', body: 'A place to worship with humility and care.' },
            { title: 'Heritage', body: 'A place to practice and share our festivals, arts, and traditions.' },
            { title: 'Belonging', body: 'A place where generations and neighbors can come together.' },
          ],
        },
        {
          blockType: 'imageStory',
          eyebrow: 'Our beginning',
          headline: 'The community is the beginning.',
          body: 'Before any building, there are people who choose to gather, listen, and offer their time. These early moments are part of Durga Bari’s foundation.',
          imageUrl: '/durgacenter/gathering-1.jpeg',
          imageAlt: 'Durga Bari community members at a gathering',
        },
        {
          blockType: 'callToAction',
          headline: 'There is room for you here.',
          body: 'Join us in building a spiritual and cultural home for generations to come.',
          linkLabel: 'Get involved',
          linkUrl: 'http://localhost:3100/get-involved',
        },
      ],
    },
  })
}

console.log('About prototype is ready. Open http://localhost:3200/about and http://localhost:3200/admin.')
process.exit(0)
