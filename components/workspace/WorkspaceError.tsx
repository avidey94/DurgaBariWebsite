"use client";

import Link from "next/link";
import { WorkspaceEmpty, WorkspaceIcon } from "./workspace-ui";

export function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <WorkspaceEmpty
      icon="shield"
      eyebrow="A moment to reconnect"
      title="We couldn’t load this work area."
      description="Your saved information is safe. Try again to pick up where you left off, or return to your member home."
      action={
        <>
          <button type="button" className="workspace-button" onClick={reset}>
            Try again <WorkspaceIcon name="arrow" size={16} />
          </button>
          <Link href="/portal" className="db-button-secondary">
            Member home
          </Link>
        </>
      }
    />
  );
}
