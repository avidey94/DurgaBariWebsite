import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceIcon, WorkspacePageHeader } from "@/components/workspace/workspace-ui";
import { getAdminAccessContext } from "@/lib/portal/admin-auth";
import { hasPortalPermission } from "@/lib/portal/rbac";

export const metadata = { title: "Website content" };

function pageStudioUrl() {
  try {
    const url = new URL("/admin/collections/pages", process.env.PAYLOAD_PUBLIC_URL?.trim());
    if (
      url.protocol === "https:" ||
      (process.env.NODE_ENV === "development" && url.hostname === "127.0.0.1")
    )
      return url.toString();
  } catch {
    /* A missing studio uses the existing inline editor. */
  }
  return null;
}

export default async function ContentWorkspacePage() {
  const access = await getAdminAccessContext();
  if (!access) redirect("/login");
  if (!hasPortalPermission(access.roles, "cms.manage")) redirect("/admin");
  const studio = pageStudioUrl();
  const pages = [
    {
      title: "Giving & the founding vision",
      description:
        "Keep the invitation to give clear and welcoming. Care for our giving options and founding-family story.",
      href: "/join-hands-to-build-durga-bari",
      icon: "heart" as const,
    },
    {
      title: "Our sacred journey",
      description: "Care for the milestones and story behind our spiritual and cultural home.",
      href: "/our-sacred-journey-from-vision-to-temple",
      icon: "folder" as const,
    },
  ];
  return (
    <section className="workspace-domain-page db-shell">
      <WorkspacePageHeader
        eyebrow="Community"
        title="Website content"
        description="Help visitors understand who we are, where we’re going, and how they can be part of Durga Bari."
        action={
          studio ? (
            <a href={studio} target="_blank" rel="noreferrer" className="db-button-primary">
              Open page studio <WorkspaceIcon name="external" size={15} />
            </a>
          ) : undefined
        }
      />
      <div className="workspace-workflow" aria-label="Content editing steps">
        <div>
          <b>1</b> Choose the page
        </div>
        <div>
          <b>2</b> Edit and preview
        </div>
        <div>
          <b>3</b> Publish with care
        </div>
      </div>
      <div className="workspace-content-guide">
        {pages.map((page) => (
          <article key={page.href}>
            <WorkspaceIcon name={page.icon} size={26} />
            <h2>{page.title}</h2>
            <p>{page.description}</p>
            <p>
              <strong>{studio ? "Choose the right editing surface" : "Edit on the page"}</strong>
              <br />
              {studio
                ? "Use the page studio for pages managed there. If the published page shows an Edit control beside a section, you can update that section directly."
                : "Open the page and choose Edit beside an editable section. Saving updates that section immediately."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={page.href} className="db-button-secondary">
                Open published page <WorkspaceIcon name="arrow" size={15} />
              </Link>
            </div>
          </article>
        ))}
        <article>
          <WorkspaceIcon name="external" size={26} />
          <h2>See the visitor experience</h2>
          <p>
            Walk through the website as a visitor would. Check the welcome, the calendar, and the
            ways to connect.
          </p>
          <Link href="/" className="db-button-secondary">
            Visit the website <WorkspaceIcon name="arrow" size={15} />
          </Link>
        </article>
        <article>
          <WorkspaceIcon name="shield" size={26} />
          <h2>A thoughtful publishing routine</h2>
          <ul>
            <li>Check dates, names, and contact details.</li>
            <li>Use clear, welcoming language.</li>
            <li>Review every link after publishing.</li>
            <li>Preview the page on a phone, too.</li>
          </ul>
          <p>
            In the studio, preview your draft before publishing. Inline section changes take effect
            when you save. The studio uses its own sign-in.
          </p>
        </article>
      </div>
    </section>
  );
}
