/* eslint-disable @typescript-eslint/no-require-imports -- This Node test runner loads the TypeScript modules through CommonJS. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Load the actual TypeScript modules with isolated service boundaries. No database writes.
function load(file, stubs = {}, cache = new Map()) {
  file = path.resolve(__dirname, "..", file);
  if (cache.has(file)) return cache.get(file).exports;
  const loadedModule = { exports: {} };
  cache.set(file, loadedModule);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (name) => {
    if (name in stubs) return stubs[name];
    if (name.startsWith(".") || name.startsWith("@/")) {
      const resolved = name.startsWith("@/")
        ? name.slice(2)
        : path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(file), name));
      return load(`${resolved}.ts`, stubs, cache);
    }
    return require(name);
  };
  new Function("require", "module", "exports", source)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const hub = load("lib/events/hub.ts");
const base = {
  slug: "public-puja",
  title: "Public Puja",
  short_summary: "Join us",
  description: null,
  full_description: null,
  event_type: "ritual",
  category: "",
  all_day: false,
  recurrence: null,
  recurrence_until: null,
  location: "Durga Bari",
  cover_image_url: null,
  publish_status: "published",
  timezone: "America/Los_Angeles",
  blocks_reservations: true,
  is_rsvp_enabled: true,
  capacity: 10,
  start_time: "2026-11-10T18:00:00.000Z",
  end_time: "2026-11-10T20:00:00.000Z",
};
const fixtures = {
  events: [
    { ...base, id: "public", visibility: "public" },
    { ...base, id: "member", slug: "member-puja", title: "Member title", visibility: "members" },
    {
      ...base,
      id: "private",
      slug: "private-puja",
      title: "SECRET PRIVATE TITLE",
      visibility: "private",
    },
    {
      ...base,
      id: "draft",
      slug: "draft-puja",
      title: "SECRET DRAFT",
      publish_status: "draft",
      visibility: "public",
    },
  ],
  event_reservations: [
    {
      id: "SECRET RESERVATION ID",
      event_title: "SECRET BOOKING TITLE",
      booking_reference: "SECRET REFERENCE",
      event_date: "2026-11-11",
      start_time: "10:00:00",
      end_time: "12:00:00",
      status: "approved",
    },
  ],
  event_rsvps: [
    { id: "mine", user_id: "member-user", event_id: "public", status: "going", headcount: 2 },
    { id: "other", user_id: "other-user", event_id: "public", status: "going", headcount: 7 },
  ],
};
function service(rows = fixtures, failTable) {
  return {
    from(table) {
      let selected = "*";
      const filters = [];
      let mutation = null;
      const query = {
        select(fields) {
          selected = fields;
          return query;
        },
        eq(key, value) {
          filters.push((row) => row[key] === value);
          return query;
        },
        in(key, values) {
          filters.push((row) => values.includes(row[key]));
          return query;
        },
        not(key, op, value) {
          const values = value.slice(1, -1).split(",");
          filters.push((row) => !values.includes(row[key]));
          return query;
        },
        lte(key, value) {
          filters.push((row) => row[key] <= value);
          return query;
        },
        gte(key, value) {
          filters.push((row) => row[key] >= value);
          return query;
        },
        order() {
          return query;
        },
        limit() {
          return query;
        },
        upsert(value) {
          mutation = value;
          return query;
        },
        result(single = false) {
          if (table === failTable)
            return { data: null, error: { message: "Temporarily unavailable" } };
          let data = mutation
            ? [mutation]
            : (rows[table] ?? []).filter((row) => filters.every((filter) => filter(row)));
          if (selected !== "*")
            data = data.map((row) =>
              Object.fromEntries(
                selected
                  .split(",")
                  .map((key) => key.trim())
                  .map((key) => [key, row[key]]),
              ),
            );
          return { data: single ? (data[0] ?? null) : data, error: null };
        },
        maybeSingle() {
          return Promise.resolve(query.result(true));
        },
        single() {
          return Promise.resolve(query.result(true));
        },
        then(resolve, reject) {
          return Promise.resolve(query.result()).then(resolve, reject);
        },
      };
      return query;
    },
  };
}
function server(access, user = null, failTable) {
  return load("lib/events/hub-server.ts", {
    "server-only": {},
    "@/lib/auth/supabase": { createServiceRoleSupabaseClient: () => service(fixtures, failTable) },
    "@/lib/auth/session": { getCurrentUser: async () => user },
    "./server": { computeVisibilityForUser: async () => access },
  });
}
test("month navigation handles year boundaries and full calendar weeks", () => {
  assert.equal(hub.shiftMonth("2026-12", 1), "2027-01");
  assert.equal(hub.shiftMonth("2026-01", -1), "2025-12");
  const days = hub.monthDays("2026-11");
  assert.equal(days[0], "2026-11-01");
  assert.equal(days.at(-1), "2026-12-05");
  assert.equal(days.length % 7, 0);
  assert.equal(hub.validMonth("2026-13"), false);
});
test("Pacific dates and overnight events respect exclusive midnight boundaries", () => {
  assert.equal(hub.pacificDay("2026-11-01T06:30:00Z"), "2026-10-31");
  const event = { start: "2026-11-10T23:00:00-08:00", end: "2026-11-11T00:00:00-08:00" };
  assert.equal(hub.occursOnDay(event, "2026-11-10"), true);
  assert.equal(hub.occursOnDay(event, "2026-11-11"), false);
  assert.equal(hub.occursOnDay({ ...event, end: "2026-11-11T01:00:00-08:00" }, "2026-11-11"), true);
});
test("visitors receive public events and anonymous busy blocks only", async () => {
  const data = await server({ includePrivate: false, includeMembers: false }).getCalendarMonth(
    "2026-11",
  );
  assert.deepEqual(
    data.events.map((event) => event.eventId),
    ["public"],
  );
  assert.equal(data.reservations.length, 3);
  assert.equal(data.canRsvp, false);
  const json = JSON.stringify(data);
  for (const privateValue of ["SECRET", "Member title", "private-puja", "member-puja"])
    assert.equal(json.includes(privateValue), false);
});
test("members see member events and only their own RSVP", async () => {
  const data = await server(
    { includePrivate: false, includeMembers: true },
    { id: "member-user" },
  ).getCalendarMonth("2026-11");
  assert.deepEqual(
    data.events.map((event) => event.eventId),
    ["public", "member"],
  );
  assert.deepEqual(data.events[0].rsvp, { status: "going", headcount: 2 });
  assert.equal(data.reservations.length, 2);
  assert.equal(data.canRsvp, true);
  assert.equal(JSON.stringify(data).includes("SECRET"), false);
});
test("authorized event managers can view private events but cannot RSVP to them", async () => {
  const data = await server(
    { includePrivate: true, includeMembers: true },
    { id: "member-user" },
  ).getCalendarMonth("2026-11");
  assert.equal(data.events.length, 3);
  assert.equal(data.events.find((event) => event.eventId === "private").isRsvpEnabled, false);
});
test("calendar and personalized data failures are explicit", async () => {
  await assert.rejects(
    server({ includePrivate: false, includeMembers: false }, null, "events").getCalendarMonth(
      "2026-11",
    ),
  );
  const bookings = await server(
    { includePrivate: false, includeMembers: false },
    null,
    "event_reservations",
  ).getCalendarMonth("2026-11");
  assert.equal(bookings.availabilityUnavailable, true);
  const rsvps = await server(
    { includePrivate: false, includeMembers: true },
    { id: "member-user" },
    "event_rsvps",
  ).getCalendarMonth("2026-11");
  assert.equal(rsvps.rsvpUnavailable, true);
});
function rsvpRoute(event, user, member = true, existingRows = []) {
  return load("app/api/events/[id]/rsvp/route.ts", {
    "@/lib/auth/supabase": {
      createServiceRoleSupabaseClient: () =>
        service({ events: [event], event_rsvps: existingRows }),
    },
    "@/lib/auth/session": { getCurrentUser: async () => user },
    "@/lib/portal/server": {
      getCurrentFamilyPortalContext: async () => ({}),
      canAccessMemberContent: () => member,
    },
  });
}
const request = (body) =>
  new Request("http://localhost/api/events/public/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const context = { params: Promise.resolve({ id: "public" }) };
test("RSVP endpoint rejects anonymous, private, restricted and disabled requests", async () => {
  const event = fixtures.events[0];
  const user = { id: "member-user", email: "test@example.invalid" };
  assert.equal(
    (await rsvpRoute(event, null).POST(request({ status: "going" }), context)).status,
    401,
  );
  assert.equal(
    (
      await rsvpRoute({ ...event, visibility: "private" }, user).POST(
        request({ status: "going" }),
        context,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await rsvpRoute({ ...event, visibility: "members" }, user, false).POST(
        request({ status: "going" }),
        context,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await rsvpRoute({ ...event, is_rsvp_enabled: false }, user).POST(
        request({ status: "going" }),
        context,
      )
    ).status,
    400,
  );
});
test("RSVP capacity is enforced and a valid response is saved", async () => {
  const event = fixtures.events[0];
  const user = { id: "member-user", email: "test@example.invalid" };
  const full = [{ event_id: "public", user_id: "other", status: "going", headcount: 10 }];
  assert.equal(
    (
      await rsvpRoute(event, user, true, full).POST(
        request({ status: "going", headcount: 2 }),
        context,
      )
    ).status,
    409,
  );
  const response = await rsvpRoute(event, user).POST(
    request({ status: "going", headcount: 3 }),
    context,
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.rsvp.headcount, 3);
  assert.equal(body.rsvp.status, "going");
  assert.equal(body.rsvp.user_id, user.id);
});
