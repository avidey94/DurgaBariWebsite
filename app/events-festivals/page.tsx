import { ContentHero, ContentModule, ContentPageFrame, ContentPlaceholder } from "@/components/content-page";

const festivalSections = [
  "Major Hindu Festivals - Durga Puja, Kali Puja, Saraswati Puja, Diwali, Holi, and more.",
  "Special Observances - Monthly pujas, sacred rituals, spiritual discourses, and collective prayers.",
  "Cultural Celebrations - Music, dance, language, and traditions that reflect our Bengali and broader Hindu heritage.",
  "Community Events - Family gatherings, youth activities, educational workshops, and social service programs.",
];

export default function EventsFestivalsPage() {
  return (
    <ContentPageFrame>
      <ContentHero
        title="Events & Festivals"
        subtitle="Devotion, Celebration, and Community Togetherness"
        kicker="Seasonal Calendar"
      />

      <div className="mt-4 space-y-4">
        <ContentModule title="Our Vision for Celebrations">
          <p>
            Durga Bari will one day be a vibrant center where we come together as one family to
            celebrate our traditions, honor our deities, and rejoice in our cultural heritage.
          </p>

          <p className="mt-2">
            At this early stage, we are establishing the temple and laying the foundation for a
            sacred space of devotion and community gathering. Once Durga Bari is built, this page
            will share details of:
          </p>

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
            <ul className="space-y-2">
              {festivalSections.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#9b1616]">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </ContentModule>

        <div className="grid gap-4 md:grid-cols-2">
          <ContentPlaceholder label="Festival Stage" sublabel="Future puja and cultural performance area" />
          <ContentPlaceholder label="Community Hall" sublabel="Shared prayer and celebration space" />
        </div>

        <ContentModule title="Stay Connected" tone="red">
          <p>
            Until then, we warmly invite you to join hands in helping us realize this dream. With
            your support, Durga Bari will become the place where these festivals are celebrated
            with devotion, joy, and togetherness.
          </p>
          <div className="mt-3 border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
            <strong>Stay connected:</strong> Please contact us to receive updates and to be part of
            our founding family.
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
