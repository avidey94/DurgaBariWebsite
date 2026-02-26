import { ContentHero, ContentModule, ContentPageFrame, ContentPlaceholder } from "@/components/content-page";

const helpNowItems = [
  {
    title: "Awareness Ambassadors",
    body: "Share the vision of Durga Mandir with your friends, family, and networks. Help us reach more people who may wish to be part of this noble mission.",
  },
  {
    title: "Fundraising Volunteers",
    body: "Assist in organizing fundraising events, campaigns, and donor outreach. Every effort counts in making this dream a reality.",
  },
  {
    title: "Patron & Sponsor Outreach",
    body: "Help us connect with patrons and well-wishers who can provide long-term support for the Mandir.",
  },
];

const futureItems = [
  "Supporting temple rituals and daily operations",
  "Assisting in cultural and educational programs",
  "Organizing festivals and community events",
  "Maintaining the sanctity and beauty of the temple",
];

export default function GetInvolvedPage() {
  return (
    <ContentPageFrame>
      <ContentHero
        title="Get Involved"
        subtitle="Be Part of Something Sacred and Lasting"
        kicker="Community Action"
      />

      <div className="mt-4 space-y-4">
        <ContentModule title="Join the Mission">
          <p>
            Durga Mandir is more than a temple - it is a living center of spirituality, culture,
            and community. Your participation helps bring this vision to life. Together, we can
            create a sacred space where faith, culture, and unity flourish.
          </p>

          <div className="mt-3 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
            <h3 className="font-serif text-[28px] font-bold text-[#12271d]">How You Can Help Now</h3>
            <ol className="mt-2 space-y-3">
              {helpNowItems.map((item, index) => (
                <li key={item.title} className="border-l-4 border-[#9b1616] bg-[#eef4ec] px-3 py-2">
                  <p className="font-bold text-[#1f2a22]">
                    {index + 1}. {item.title}
                  </p>
                  <p>{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </ContentModule>

        <div className="grid gap-4 md:grid-cols-2">
          <ContentPlaceholder label="Volunteer Desk" sublabel="Festival and program coordination hub" />
          <ContentPlaceholder label="Youth Seva" sublabel="Future volunteer pathway for younger members" />
        </div>

        <ContentModule title="Looking Ahead" tone="red">
          <p>
            As the Mandir grows, volunteer opportunities will expand into:
          </p>
          <ul className="mt-2 space-y-1">
            {futureItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#9b1616]">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
            <strong>Contact Us:</strong> If you are interested in getting involved, please email us
            at <strong>info@thedurgacenter.org</strong>.
          </div>
        </ContentModule>
      </div>
    </ContentPageFrame>
  );
}
