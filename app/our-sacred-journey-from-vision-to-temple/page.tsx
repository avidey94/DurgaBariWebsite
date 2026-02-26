import Link from "next/link";

const waysToGive = [
  "Founding Family (recurring) - $100/month (3-year pledge)",
  "One-time or cumulative gifts - choose any membership tier below",
  "Corporate matching - double your impact (ask your employer)",
  "In-kind - stage/storage, decor, AV, printing, hospitality",
];

const donorTiers = [
  {
    title: "Grand Benefactor Member",
    contribution: "$25,000+ (one-time or cumulative)",
    recognition:
      "Top placement on the Founder & Benefactor Plaque; lifetime listing on website and annual report; VIP acknowledgment at inaugurations and major festivals.",
  },
  {
    title: "Benefactor Member",
    contribution: "$15,000 to $24,999",
    recognition:
      "Benefactors section on donor wall; acknowledgment in annual communications; reserved seating at select events.",
  },
  {
    title: "Grand Patron Member",
    contribution: "$10,000 to $14,999",
    recognition:
      "Patron plaque listing; acknowledgment during annual Durga Puja; invitations to cultural appreciation events.",
  },
  {
    title: "Patron Member",
    contribution: "$5,000 to $9,999",
    recognition:
      "Patron roll at temple and website; priority invitations to programs; reserved front-row seating in major programs.",
  },
];

function Module({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-[2px] border-[var(--db-border)] bg-[#fffef9] shadow-[inset_0_1px_0_#fff,0_1px_0_#b8c5b6]">
      <div className="border-b-[2px] border-[var(--db-border)] bg-[linear-gradient(180deg,#c91d1d,#951515)] px-4 py-2">
        <h2 className="font-serif text-[30px] font-bold leading-tight text-white">{title}</h2>
      </div>
      <div className="p-4 text-[17px] leading-8 text-[#1f2a22] md:p-5">{children}</div>
    </section>
  );
}

export default function OurJourneyPage() {
  return (
    <section className="mx-auto max-w-[1120px] px-4 py-6 md:py-8">
      <article className="border-[3px] border-[var(--db-border-strong)] bg-[var(--db-panel)] p-3 shadow-[inset_0_1px_0_#fff,0_2px_0_#173522] md:p-4">
        <header className="border-[2px] border-[var(--db-border)] bg-[linear-gradient(180deg,#ffe6b5,#f5cc75)] p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center border-[2px] border-[#6b2a00] bg-[#f3b53a] text-[30px] text-[#8a1a1a]">
              ॐ
            </div>
            <div>
              <h1 className="font-serif text-5xl font-bold leading-[1.05] text-[#132a1f] md:text-6xl">
                Our Sacred Journey: From Vision to Temple
              </h1>
              <p className="mt-2 text-[20px] font-semibold text-[#223a2d]">
                Join Hands to Build Durga Bari - Center for Spiritual and Cultural Excellence
              </p>
            </div>
          </div>
        </header>

        <div className="mt-4 space-y-4">
          <Module title="Sacred Mission">
            <p>
              <em>A Sacred Abode of Divine Energy and Cultural Excellence</em>
            </p>
            <p className="mt-2">
              Durga Bari is a community-led initiative to establish a center of worship, learning,
              and Bengali cultural excellence. Your generosity today lights the path from seed
              funding to sanctum.
            </p>
            <p className="mt-2 border-l-4 border-[var(--db-brand)] bg-[#edf3ea] px-3 py-2">
              <strong>Ready to pledge now?</strong> Email <strong>info@thedurgacenter.org</strong>{" "}
              or use the contact form:
              <Link href="/contact" className="ml-1 font-semibold underline">
                Contact Page
              </Link>
            </p>
          </Module>

          <Module title="Ways to Give">
            <ul className="space-y-1">
              {waysToGive.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="font-bold text-[#9b1616]">
                    ▸
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-[2px] border-[#3d6148] bg-[#dde9de] p-3">
              <p>
                <strong>To get started:</strong> Email <strong>info@thedurgacenter.org</strong> or
                use the contact form.
              </p>
              <p className="mt-2">
                Donate through Zelle and add recipient name{" "}
                <strong>&quot;Durga Bari - Center for Spiritual and Cultural Excellence&quot;</strong>.
              </p>
              <p className="mt-1">Scan the QR code from your banking app:</p>
              <img
                src="https://thedurgacenter.org/wp-content/uploads/2026/02/QR-Code-300x295.jpg"
                alt="Durga Bari Zelle QR code"
                className="mt-3 border-[2px] border-[var(--db-border)] bg-white"
                width={300}
                height={295}
              />
            </div>
          </Module>

          <div className="grid gap-3 md:grid-cols-2">
            <section className="border-[2px] border-[var(--db-border)] bg-[#fffef9]">
              <div className="border-b-[2px] border-[var(--db-border)] bg-[linear-gradient(180deg,#1a6f44,#145535)] px-4 py-2">
                <h3 className="text-3xl font-bold text-white">Check Payments</h3>
              </div>
              <div className="space-y-2 p-4 text-[17px] leading-8">
                <p>
                  For personal checks, make payable to:
                  <br />
                  <strong>Durga Bari - Center for Spiritual and Cultural Excellence</strong>
                </p>
                <p>
                  Mail to:
                  <br />
                  Durga Bari - Center for Spiritual and Cultural Excellence
                  <br />
                  2200 Eastridge Loop #731192
                  <br />
                  San Jose, CA 95173
                </p>
              </div>
            </section>

            <section className="border-[2px] border-[var(--db-border)] bg-[#fffef9]">
              <div className="border-b-[2px] border-[var(--db-border)] bg-[linear-gradient(180deg,#1a6f44,#145535)] px-4 py-2">
                <h3 className="text-3xl font-bold text-white">Tax Information</h3>
              </div>
              <div className="space-y-2 p-4 text-[17px] leading-8">
                <p>
                  Durga Bari - Center for Spiritual and Cultural Excellence is a 501(c)(3)
                  nonprofit organization. Contributions are tax deductible.
                </p>
                <p>
                  EIN: <strong>39-4854019</strong>
                  <br />
                  Email: <strong>info@thedurgacenter.org</strong>
                </p>
              </div>
            </section>
          </div>

          <Module title="Membership & Recognition (Non-Voting Donor Categories)">
            <p>
              These are honor tiers for recognition only; governance rests with the Board per
              bylaws.
            </p>

            <div className="mt-3 space-y-3">
              {donorTiers.map((tier) => (
                <section key={tier.title} className="border-[2px] border-[var(--db-border-soft)] bg-white p-3">
                  <h3 className="text-[30px] font-bold text-[#173724]">{tier.title}</h3>
                  <p className="mt-1">
                    <strong>Contribution:</strong> {tier.contribution}
                  </p>
                  <p className="mt-1">
                    <strong>Recognition:</strong> {tier.recognition}
                  </p>
                </section>
              ))}
            </div>

            <div className="mt-4 border-l-4 border-[var(--db-danger)] bg-[#fce9e9] px-3 py-2">
              <strong>Note:</strong> Donor categories are non-voting and intended for recognition
              and gratitude. Voting and oversight privileges are defined separately in bylaws.
            </div>
          </Module>

          <Module title="Special: Founding Family Circle (First 200 Families)">
            <p>
              <strong>$100/month for 36 months</strong> (or $3,600 total). First-come,
              first-served for official <strong>Founding Family</strong> status.
            </p>
            <p className="mt-2 font-bold">Benefits:</p>
            <ul className="mt-1 space-y-1">
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>Permanent name engraving on the Founding Families Wall/Tree</li>
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>Founding Family certificate and memento at inauguration</li>
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>Recognition on website/newsletters and first Durga Puja</li>
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>Founders&apos; appreciation dinner invitation</li>
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>Priority participation in opening rituals and youth programs</li>
              <li className="flex gap-2"><span className="text-[#9b1616]">•</span>Eligibility to upgrade to Patron/Benefactor tiers with added gifts</li>
            </ul>

            <div className="mt-4 border-[2px] border-[var(--db-border)] bg-[#edf3ea] px-3 py-2">
              <strong>Join today:</strong> Email <strong>info@thedurgacenter.org</strong> or use
              the contact form.
            </div>
          </Module>
        </div>
      </article>
    </section>
  );
}
