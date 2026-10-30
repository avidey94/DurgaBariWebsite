# Durga Bari community workspace

The new-site portal uses the public site's warm paper, ink, vermilion, and editorial type with a practical application structure. The member home and the team workspace are separate contexts connected by an explicit switch. The original routes and backend contracts remain in place.

## Member space

- **Your home** brings family identity, giving totals, household details, and upcoming gatherings together.
- **Giving history** shows recorded contributions and explains the finance team's recording process when a recent gift is missing.
- **Active donor circle** is the monthly Bronze/Silver/Gold program (`/portal/pledge`). A tier request requires an explicit choice and does not create a recurring payment.
- **Founding family** tracks the separate founding commitment (`/portal/foundingfamily`). This navigation item appears only for participating families.
- **Volunteer & serve** distinguishes existing family commitments from open opportunities.
- **Reimbursements** collects the project, purchase, amount, payment method, and supporting receipt, then shows review/payment status.
- The calendar and space-reservation links connect member activity with the existing public scheduling experience.

Account creation follows sign-up → email confirmation → household details → household review → membership approval. Pending and suspended accounts receive different guidance; subpages return them to the account status screen until access is available.

## Team workspace

| Responsibility     | Work areas                                      | Typical workflow                                                                                                       |
| ------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Membership manager | Review inbox; members & access                  | Review a completed household → approve access → maintain profiles and donor requests                                   |
| Treasurer          | Donations; expenses; funding projects           | Record or reconcile a contribution; review a submitted cost → approve → record payment/reimbursement                   |
| Event manager      | Shared calendar; events & service; reservations | Check space → draft/publish a gathering → plan volunteer roles; verify a private booking's payment → approve the space |
| Content manager    | Website content                                 | Open the correct editing surface → edit/preview → publish carefully                                                    |
| Site administrator | All work areas and role assignment              | Delegate responsibilities, manage access, and coordinate work across the team                                          |

Navigation follows existing permission checks. Content managers can now enter their existing authorized content area; no finance, event, or membership permissions are added. Only site administrators can assign roles.

The review inbox combines membership approvals, requested reservations, and donor-level requests. It shows only queues assigned to the signed-in team member. Inbox counts refresh after booking or membership changes. Lists have distinct loading, error, no-records, and no-filter-matches states. Payment verification remains mandatory before a reservation can be approved.

Funding campaigns and financial entries use focused, expandable records instead of wide editing tables. USD entry preserves decimal input and validates cents before sending the existing API payload. Existing audit history stays accessible.

The content hub explains the difference between the page studio and inline editing, with links to the configured studio and published pages. It does not depend on the studio being online to open the team workspace.

## Mobile and future app work

The responsive shell has persistent desktop navigation, phone bottom navigation, a modal full-navigation drawer, touch-sized primary controls, safe-area spacing, and phone input sizes that avoid iOS focus zoom. Dialogs support keyboard dismissal and native focus containment. Reduced-motion preferences are respected.

A member manifest (`/portal/manifest.webmanifest`) supplies standalone display metadata, existing brand icons, and member/calendar shortcuts. This is an app-shell foundation, not an offline member-data implementation. The new workspace does not cache authenticated data in a service worker. Existing calendar offline behavior is unchanged.

A future native implementation can reuse the existing domain/API boundaries and role map, while replacing the web shell and forms with native navigation and controls. Offline synchronization, push notifications, native authentication redirects, and app-store packaging remain separate work.

## Verification

- Production build and TypeScript checks.
- Targeted lint on changed source files.
- Role/navigation isolation and USD parsing checks, plus the existing calendar/RSVP suite.
- Browser review of member pages, all administration work areas, auth mode changes, financial input, phone navigation, empty states, and expanded record editors.
- Browser checks avoid creating accounts, sending emails, changing real membership, approving reservations, or writing financial records.
