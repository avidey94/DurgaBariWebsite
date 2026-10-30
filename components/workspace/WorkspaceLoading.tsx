export function WorkspaceLoading() {
  return (
    <div className="workspace-page-loading" role="status" aria-label="Loading your workspace">
      <span className="workspace-loading-kicker" />
      <span className="workspace-loading-heading" />
      <span className="workspace-loading-description" />
      <div>
        <span />
        <span />
        <span />
      </div>
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}
