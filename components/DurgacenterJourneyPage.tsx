import { DurgacenterJourneyGallery } from "@/components/DurgacenterJourneyGallery";

const phases = [
  "🌱 Pre-Initiation — Laying the Foundation",
  "🪔 Initiation — First Durga Bari Community Puja, Warehouse Worship & Programs",
  "🔥 Phase 1 — Complete Soil Collection for Shakti & Jotirlinga Stoopa",
  "🏛️ Phase 2 — Acquiring Land & Building the Temple",
  "🌸 Phase 3 — Permanent Temple & Cultural Center",
];

export function DurgacenterJourneyPage() {
  return (
    <article className="durgacenter-journey-page">
      <h1>Our Sacred Journey: From Vision to Temple</h1>
      <div className="durgacenter-journey-intro">
        <p><strong>Together, we’re building a spiritual home for Maa Durga—step by step.</strong></p>
        <p>This page shares our phased plan so supporters can see exactly where we are, what’s next, and how to help.</p>
      </div>

      <section className="durgacenter-journey-gallery" aria-label="Community gathering photos">
        <p><em>From our first gatherings to a living sacred space, these moments reflect the unfolding of Durga Bari.</em></p>
        <p><strong>The First Gathering of the Community — Saratoga Library</strong></p>
        <DurgacenterJourneyGallery />
      </section>

      <ul className="durgacenter-phase-list">
        {phases.map((phase) => <li key={phase}>{phase}</li>)}
      </ul>

      <section className="durgacenter-phase-section">
        <h2>🌱 Pre-Initiation — Laying the Foundation (Now–2025)</h2>
        <h3>What we’re doing</h3>
        <ul>
          <li>Community listening: meetings, polls, gathering feedback</li>
          <li>Legal setup: Articles of Incorporation, 501(c)(3), bylaws, board</li>
          <li>Guiding Principles: humility, unity, sanctity; no politics/ego</li>
          <li>Digital launch: website, mailing list, WhatsApp/Telegram groups</li>
          <li>Seed fundraising & pledges for the first puja and startup costs</li>
        </ul>
        <h3>Milestones to track</h3>
        <ul>
          <li>✅ Nonprofit registration filed</li>
          <li>✅ Website launched</li>
          <li>🟡 Pledges toward first puja</li>
          <li>🟡 Volunteer sign-ups</li>
        </ul>
        <h3>How you can help</h3>
        <ul>
          <li>Join as an early volunteer</li>
          <li>Make a seed pledge (any amount helps)</li>
          <li>Share the vision with friends and family</li>
        </ul>
      </section>

      <iframe
        className="durgacenter-journey-video"
        title="Durga Bari community gathering video"
        src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F4263201827229176%2F&show_text=false&width=560&t=0"
        loading="lazy"
      />

      <section className="durgacenter-phase-section">
        <h2>🪔 Initiation — First Community Puja & Early Temple Worship (2026)</h2>
        <h3>Purpose</h3>
        <p>Demonstrate the vision in action—bring everyone together for a community Durga Puja in a rented venue.</p>
        <h3>What’s included</h3>
        <ul>
          <li>Pratima, rituals, and bhog/prasad</li>
          <li>Cultural evening (music, dance, recitation)</li>
          <li>Youth engagement (art, heritage storytelling)</li>
          <li>Community sign-ups (membership interest, volunteers, donors)</li>
        </ul>
        <h3>Milestones to track</h3>
        <ul>
          <li>🟡 Venue booked</li>
          <li>🟡 Priest &amp; ritual items confirmed</li>
          <li>🟡 Sponsorships secured</li>
          <li>🟡 Volunteer teams filled (setup, decor, cultural, logistics, food, outreach)</li>
        </ul>
        <h3>How you can help</h3>
        <ul><li>Sponsor a puja item or day</li><li>Join a volunteer team</li><li>Invite your network</li></ul>
      </section>

      <section className="durgacenter-phase-section">
        <h2>Warehouse Worship & Programs (2025–2026)</h2>
        <h3>Goal</h3>
        <p>Move to a warehouse or rented community space for regular worship and programs while we build capacity for land purchase.</p>
        <h3>What this enables</h3>
        <ul>
          <li>Festival cycle: Durga, Kali, Lakshmi, Saraswati pujas</li>
          <li>Monthly satsangs & bhajans, kids’ language/music/dance classes</li>
          <li>Senior meet-ups and cultural workshops</li>
          <li>Donation transparency and reserve building for land</li>
        </ul>
        <h3>Readiness checklist</h3>
        <ul>
          <li>🟡 Space identified and lease terms feasible</li>
          <li>🟡 Safety, insurance, permits ready</li>
          <li>🟡 Starter furnishings: shrine stage, lights, sound, storage</li>
          <li>🟡 Monthly operating budget covered by pledges/memberships</li>
        </ul>
        <h3>How you can help</h3>
        <ul>
          <li>Become a monthly sustainer ($108/month)</li>
          <li>Donate items (sound, lights, storage, rugs, seating)</li>
          <li>Offer skills (teaching, accounts, graphic design, AV, photography)</li>
        </ul>
      </section>

      <section className="durgacenter-phase-section">
        <h2>🔥 Phase 1 — Complete Soil Collection for Shakti & Jotirlinga Stoopa</h2>
        <h3>Vision</h3>
        <p>Durga Bari aspires to enshrine two sacred Stoopas within the temple:</p>
        <ul><li>Shakti Stoopa: formed with sacred soil from all 52 Shakti Peethas.</li><li>Jyotirlinga Stoopa: formed with sacred soil from all 12 Jyotirlingas.</li></ul>
        <p>Together, these Stoopas will create a sanctum sanctorum where devotees can experience the complete divine presence of Shakti and Shiva.</p>
        <h3>Spiritual Significance</h3>
        <ul><li>The Shakti Stoopa will embody the cosmic energy of Maa Durga in all her forms.</li><li>The Jyotirlinga Stoopa will embody Lord Shiva’s eternal light across the twelve jyotirlinga shrines.</li><li>Together, they will provide spiritual solace and wholeness, allowing devotees to rejoice in the united blessings of Shakti and Shiva.</li></ul>
        <h3>How it will be created</h3>
        <ul><li>Soil will be lovingly collected from each of the 52 Shakti Peethas and 12 Jyotirlingas.</li><li>Devotees and volunteers will help bring these sacred soils, to be placed in consecrated kalash (urns).</li><li>These kalash will be preserved until the permanent temple foundation ritual, where the Stoopas will be ritually installed.</li></ul>
        <h3>How you can help</h3>
        <ul><li>Volunteer to assist in collecting soil from a Shakti Peetha or Jyotirlinga when you travel or through connections.</li><li>Sponsor the cost of soil collection journeys.</li><li>Participate in the Soil Offering Ceremony during Durga Puja.</li></ul>
      </section>
    </article>
  );
}
