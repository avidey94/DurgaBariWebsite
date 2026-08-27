import Link from "next/link";

const qrCodeImage = "https://thedurgacenter.org/wp-content/uploads/2026/02/QR-Code-300x295.jpg";

export function DurgacenterJoinHandsPage() {
  return (
    <article className="durgacenter-join-page">
      <h1>Join Hands to Build Durga Bari</h1>
      <div className="durgacenter-join-content">
        <p><em>A Sacred Abode of Divine Energy and Cultural Excellence</em></p>
        <p>Durga Bari is a community‑led initiative to establish a center of worship, learning, and Bengali cultural excellence. Your generosity today lights the path—from seed funding to sanctum.</p>
        <p><strong>Ready to pledge now?</strong> Email <a href="mailto:info@thedurgacenter.org">info@thedurgacenter.org</a> or use the <Link href="/contact">contact form</Link>.</p>

        <h2>Ways to Give</h2>
        <ul>
          <li>Founding Family (recurring) – $100/month (3‑year pledge)</li>
          <li>One‑time or cumulative gifts – choose any membership tier below</li>
          <li>Corporate matching – double your impact (ask your employer)</li>
          <li>In‑kind – stage/storage, décor, AV, printing, hospitality</li>
        </ul>

        <p><strong>TO GET STARTED:</strong> Email <a href="mailto:info@thedurgacenter.org">info@thedurgacenter.org</a> or fill the form at <Link href="/contact">https://thedurgacenter.org/contact/</Link>.</p>
        <p>Donate through Zelle, add recipient name “Durga Bari – Center for Spiritual and Cultural Excellence,” and select “durgabari” as your Zelle business tag. Alternatively, scan the QR code below using your banking app.</p>
        <img className="durgacenter-join-qr" src={qrCodeImage} alt="Durga Bari Zelle QR code" width={300} height={295} />

        <p><a className="durgacenter-join-button" href="https://www.zeffy.com/en-US/donation-form/support-durga-bari-sustaining-spiritual-and-community-wellbeing" target="_blank" rel="noreferrer">Donate through Zeffy</a> <a className="durgacenter-join-button" href="https://www.paypal.com/ncp/payment/PBSF3LY72MJSC" target="_blank" rel="noreferrer">Donate through Paypal</a></p>

        <p>For Payment through Personal Checks, please write Check Payable to:</p>
        <p><strong>Durga Bari – Center for Spiritual and Cultural Excellence</strong><br />Mail it at:<br />Durga Bari – Center for Spiritual and Cultural Excellence<br />2200 Eastridge Loop #731192<br />San Jose, CA 95173</p>
        <p>Durga Bari – Center for Spiritual and Cultural Excellence is a 501 C(3) non profit organization. All contributions are 100% tax deductible.</p>
        <p><strong>EIN: 39-4854019.</strong><br />Email us: <a href="mailto:info@thedurgacenter.org">info@thedurgacenter.org</a>.</p>

        <h3>Membership &amp; Recognition (Non‑Voting Donor Categories)</h3>
        <p>These are honor tiers for recognition only; governance rests with the Board per bylaws.</p>
        <h3>Grand Benefactor Member</h3><ul><li>Contribution: $25,000+ (one‑time or cumulative)</li><li>Recognition: Top placement on the Founder &amp; Benefactor Plaque; lifetime listing on website &amp; annual report; VIP acknowledgment at inaugurations and major festivals; invitation to ground‑blessing/stone‑laying pujas.</li></ul>
        <h3>Benefactor Member</h3><ul><li>Contribution: $15,000 to $24,999</li><li>Recognition: Benefactors section on donor wall; acknowledgment in annual communications; reserved seating at select events; invitation to Patron &amp; Benefactor appreciation.</li></ul>
        <h3>Grand Patron Member</h3><ul><li>Contribution: $10,000–$14,999</li><li>Recognition: Patron plaque listing; acknowledgement during annual Durga Puja; invitations to cultural appreciation events.</li></ul>
        <h3>Patron Member</h3><ul><li>Contribution: $5000–$9,999</li><li>Recognition: Patron roll at temple/website; priority invitations to programs. Reserve Seat at Front Row in all programs.</li></ul>
        <p><strong>Note:</strong> Donor categories are non‑voting and intended for recognition and gratitude. Voting/oversight privileges, if any, are defined separately in bylaws.</p>

        <h3>Special: Founding Family Circle (Limited to First 200 Families)</h3>
        <p><strong>$100/month for 36 months</strong> (or $3,600 total). First‑come, first‑served for official Founding Family status.</p>
        <p><strong>Benefits:</strong></p>
        <ul><li>Permanent name engraving on the Founding Families Wall/Tree</li><li>“Founding Family of Durga Bari” certificate &amp; memento at inauguration</li><li>Recognition on website/newsletters and at the first Durga Puja</li><li>Founders’ Appreciation Dinner</li><li>Priority participation in opening rituals and children’s cultural programs</li><li>Eligibility to upgrade to Patron/Benefactor tiers with additional gifts</li></ul>
        <p><strong>Join the 200‑Family Circle today:</strong> Email <a href="mailto:info@thedurgacenter.org">info@thedurgacenter.org</a> or use the contact form.</p>
      </div>
    </article>
  );
}
