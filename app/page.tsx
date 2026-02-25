import Link from "next/link";

const upcomingEvents = [
  { day: "15", month: "MAR 2026", title: "General Body Meeting" },
  { day: "22", month: "MAY 2026", title: "Natyotsav & Cultural Evening" },
  { day: "09", month: "SEP 2026", title: "Durga Puja Volunteer Kickoff" },
];

const quickLinks = [
  { title: "Temple", subtitle: "Hours, rituals, priest contact" },
  { title: "Rental", subtitle: "Hall and event booking details" },
  { title: "Publication", subtitle: "Community newsletters and notices" },
];

export default function Home() {
  return (
    <section className="pb-16">
      <div className="grid min-h-[520px] grid-cols-1 bg-white lg:grid-cols-[280px_1fr_330px]">
        <aside className="bg-[#c40505] px-10 py-10 text-white">
          <h2 className="text-4xl font-semibold uppercase leading-tight">Temple Hours & Contact</h2>
          <div className="mt-8 space-y-5 text-xl leading-relaxed">
            <p>
              Monday - Saturday:
              <br />
              9:00 AM - 11:00 AM
              <br />
              5:00 PM - 7:00 PM
            </p>
            <p>
              Sunday:
              <br />
              9:00 AM - 7:00 PM
            </p>
            <p>
              Sandhya Arati: 6:30 PM
              <br />
              Contact: (281) 589-7700
              <br />
              info@durgabari.org
            </p>
          </div>
        </aside>

        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#f59e0b_0%,#b91c1c_45%,#2a0000_100%)] p-10 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_45%)]" />
          <div className="relative z-10 flex h-full flex-col justify-end">
            <p className="text-sm uppercase tracking-[0.22em] text-amber-200">Serving families with devotion</p>
            <h1 className="mt-4 max-w-3xl font-serif text-6xl leading-[1.05]">
              Durga Bari Community and Cultural Center
            </h1>
            <p className="mt-5 max-w-2xl text-xl text-amber-50/95">
              Worship, education, volunteerism, and transparent donation records in one unified
              platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/portal"
                className="rounded-sm bg-white px-6 py-3 text-base font-semibold text-[#9f0505] hover:bg-amber-100"
              >
                Payments & Donation Portal
              </Link>
              <Link
                href="/login"
                className="rounded-sm border border-white px-6 py-3 text-base font-semibold text-white hover:bg-white/15"
              >
                Member Login
              </Link>
            </div>
          </div>
        </div>

        <aside className="bg-[#ececec] px-8 py-8">
          <h2 className="text-4xl font-semibold uppercase text-[#222]">Upcoming Events</h2>
          <div className="mt-6 space-y-4">
            {upcomingEvents.map((event) => (
              <article key={`${event.day}-${event.title}`} className="flex overflow-hidden rounded-md bg-white">
                <div className="flex w-24 flex-col items-center justify-center bg-[#c40505] py-3 text-white">
                  <span className="text-5xl font-bold leading-none">{event.day}</span>
                  <span className="mt-1 text-xs font-semibold tracking-wide">{event.month}</span>
                </div>
                <div className="flex items-center px-4 text-3xl font-medium leading-tight text-slate-700">
                  {event.title}
                </div>
              </article>
            ))}
          </div>
          <button className="mt-7 rounded-md bg-[#c40505] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#a90303]">
            View More
          </button>
        </aside>
      </div>

      <div className="bg-[#efefef] px-6 py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-3">
          {quickLinks.map((item) => (
            <article key={item.title} className="text-center">
              <div className="mx-auto grid h-56 w-56 place-items-center rounded-full bg-[#d80000] text-center text-white shadow-[0_18px_32px_rgba(0,0,0,0.14)]">
                <div>
                  <p className="text-4xl font-semibold">{item.title}</p>
                </div>
              </div>
              <p className="mt-6 text-xl text-slate-600">{item.subtitle}</p>
              <a href="#" className="mt-5 inline-block text-4xl text-[#1f1f1f] hover:text-[#c40505]">
                View All
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
