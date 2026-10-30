/* eslint-disable @typescript-eslint/no-require-imports -- Run domain authorization checks without a browser or live account. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const modules = new Map();
const boundaries = {
  "@/lib/auth/session": { getCurrentUser: async () => null },
  "@/lib/portal/server": { getCurrentFamilyPortalContext: async () => null },
};
function load(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const exports = {};
  modules.set(relative, exports);
  const file = path.join(__dirname, "..", relative);
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (name) =>
    boundaries[name] ?? (name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : require(name));
  new Function("require", "exports", compiled)(localRequire, exports);
  return exports;
}
const { getAdminNavigation } = load("lib/portal/navigation.ts");
const { canAccessAdminHome } = load("lib/portal/admin-auth.ts");
const { getPermissionsForRoles } = load("lib/portal/rbac.ts");
const hasAccess = (roles) =>
  canAccessAdminHome({
    userEmail: "member@example.com",
    familyId: null,
    roles,
    permissions: getPermissionsForRoles(roles),
  });
const areas = (roles) =>
  getAdminNavigation(roles)
    .map((item) => item.href)
    .filter((href) => href !== "/admin" && href !== "/admin/notifications");

test("every team role can reach its own workspace; a member cannot enter administration", () => {
  for (const role of [
    "super_admin",
    "treasurer",
    "event_manager",
    "membership_manager",
    "site_content_manager",
  ])
    assert.equal(hasAccess([role]), true, role);
  assert.equal(hasAccess(["member"]), false);
  assert.equal(hasAccess([]), false);
});
test("content editors have a usable entry without finance, event or membership administration", () => {
  assert.deepEqual(areas(["site_content_manager"]), ["/admin/content"]);
});
test("treasurers see financial work areas without membership or role-assignment controls", () => {
  assert.deepEqual(areas(["treasurer"]), [
    "/admin/donations",
    "/admin/expenses",
    "/admin/projects",
  ]);
});
test("event managers and membership managers keep distinct responsibilities", () => {
  assert.deepEqual(areas(["event_manager"]), [
    "/admin/calendar",
    "/admin/events",
    "/admin/reservations",
  ]);
  assert.deepEqual(areas(["membership_manager"]), ["/admin/roles"]);
});
test("combined responsibilities expose the union of authorized work areas", () => {
  const combined = areas(["event_manager", "membership_manager", "site_content_manager"]);
  assert.deepEqual(combined, [
    "/admin/calendar",
    "/admin/events",
    "/admin/reservations",
    "/admin/roles",
    "/admin/content",
  ]);
  assert.equal(new Set(areas(["super_admin"])).size, 8);
});
const { parseDollarAmount } = load("lib/portal/currency.ts");
test("financial inputs preserve cents and reject accidental precision or invalid amounts", () => {
  assert.equal(parseDollarAmount("1000"), 100000);
  assert.equal(parseDollarAmount("50.25"), 5025);
  assert.equal(parseDollarAmount(" 0.01 "), 1);
  for (const value of ["", "0", "-10", "1.234", "1e3", "NaN", "1,000", "9007199254740991"])
    assert.equal(parseDollarAmount(value), null, value);
});
