import { ContentHero, ContentModule, ContentPageFrame, ContentPlaceholder } from "@/components/content-page";

export default function AboutPage() {
  return (
    <ContentPageFrame>
      <ContentHero
        title="About Durga Bari"
        subtitle="Center for Spiritual and Cultural Excellence"
        kicker="Our Foundation"
      />

      <div className="mt-4 space-y-4">
        <ContentModule title="Who We Are">
          <p>
            Durga Bari - Center for Spiritual and Cultural Excellence is a community initiative to
            establish a sacred space dedicated to Maa Durga, where devotion, culture, and
            community come together as one.
          </p>

          <p className="mt-2">
            We envision Durga Bari as more than just a temple. It will be a home for prayer,
            worship, and spiritual growth, while also serving as a vibrant hub for cultural
            programs, youth education, and community gatherings.
          </p>

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
            <p className="font-bold">Our mission is simple yet profound:</p>
            <ul className="mt-2 space-y-1">
              <li className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>To create a place of worship free from politics, ego, and division.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>To preserve and celebrate our rich traditions, festivals, and heritage.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>To unite the community as one family under the blessings of Maa Durga.</span>
              </li>
            </ul>
          </div>

          <p className="mt-2">
            Durga Bari is currently in its Pre-Initiation Phase. We are laying the foundation by
            forming the organization, building community consensus, and planning for our first
            collective puja. Together, step by step, we will move toward our ultimate goal -
            building a permanent temple and cultural center for generations to come.
          </p>
        </ContentModule>

        <div className="grid gap-4 md:grid-cols-2">
          <ContentPlaceholder label="Temple Vision" sublabel="Future sanctum and prayer hall concept" />
          <ContentPlaceholder label="Cultural Wing" sublabel="Youth, language, and heritage programming" />
        </div>

        <ContentModule title="Join the Journey" tone="red">
          <div className="border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
            <strong>We invite you to join us on this sacred journey</strong> - as volunteers,
            donors, and well-wishers. Your support today will become the cornerstone of Durga Bari
            tomorrow.
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
