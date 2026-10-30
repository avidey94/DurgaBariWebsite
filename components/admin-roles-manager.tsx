"use client";

import { useRouter } from "next/navigation";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  WorkspaceEmpty,
  WorkspaceIcon,
  WorkspaceNotice,
} from "@/components/workspace/workspace-ui";
import { formatUsPhoneNumber } from "@/lib/phone";
import type {
  ActiveDonorStatus,
  FamilyRole,
  PortalAccessState,
  RequestedActiveDonorStatus,
} from "@/lib/portal/types";

interface FamilyRow {
  id: string;
  family_display_name: string;
  primary_email: string;
  portal_access_state: PortalAccessState;
  phone_number: string | null;
  adults_count: number;
  adult_names: string[];
  children_count: number;
  child_names: string[];
  founding_family_status:
    | "not_founding"
    | "founding_active"
    | "founding_completed"
    | "founding_paused";
  pledge_status: string;
  active_donor_status: ActiveDonorStatus;
  requested_active_donor_status: RequestedActiveDonorStatus | null;
  requested_active_donor_at: string | null;
}

interface RoleGrant {
  id: string;
  family_id: string;
  role: FamilyRole;
  granted_by_family_id: string | null;
  granted_at: string;
}

interface PreviewState {
  active: boolean;
  mode?: "family" | "logged_out";
  actorEmail?: string;
  targetFamilyId?: string | null;
  targetEmail?: string | null;
}

interface RolesApiPayload {
  families: FamilyRow[];
  roleGrants: RoleGrant[];
  message?: string;
}

interface BootstrapPayload {
  created?: number;
  updated?: number;
  skipped?: number;
  message?: string;
}

interface FamilyDraft {
  family_display_name: string;
  primary_email: string;
  portal_access_state: PortalAccessState;
  phone_number: string;
  adults_count: number;
  adult_names: string[];
  children_count: number;
  child_names: string[];
  is_founding_family: boolean;
  active_donor_status: ActiveDonorStatus;
  roles: FamilyRole[];
}

interface AdminRolesManagerProps {
  canManageRoles: boolean;
  canUsePreview: boolean;
}

const allRoles: FamilyRole[] = [
  "super_admin",
  "treasurer",
  "event_manager",
  "site_content_manager",
  "membership_manager",
  "member",
];
const roleDescriptions: Record<FamilyRole, { label: string; description: string }> = {
  super_admin: {
    label: "Site administrator",
    description: "Full access to people, permissions, finances, events and site settings.",
  },
  treasurer: {
    label: "Treasurer",
    description: "Manage donations, expenses and project funding; view family records.",
  },
  event_manager: {
    label: "Events & seva",
    description: "Plan the temple calendar and manage volunteer opportunities.",
  },
  site_content_manager: {
    label: "Site editor",
    description: "Maintain the stories, information and pages on the public website.",
  },
  membership_manager: {
    label: "Membership manager",
    description: "Welcome families, manage portal access and maintain family profiles.",
  },
  member: {
    label: "Member",
    description: "View your family’s giving and take part in community events and service.",
  },
};
const activeDonorStatuses: ActiveDonorStatus[] = ["none", "bronze", "silver", "gold"];
const portalAccessStates: PortalAccessState[] = ["pending", "approved", "suspended"];

const resizeNames = (names: string[], targetCount: number, placeholderPrefix: string) => {
  const safeTarget = Number.isFinite(targetCount) ? Math.max(0, Math.floor(targetCount)) : 0;
  const next = [...names];

  if (safeTarget < next.length) {
    return next.slice(0, safeTarget);
  }

  while (next.length < safeTarget) {
    next.push(`${placeholderPrefix} ${next.length + 1}`);
  }

  return next;
};

export function AdminRolesManager({ canManageRoles, canUsePreview }: AdminRolesManagerProps) {
  const router = useRouter();
  const [familySearch, setFamilySearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<
    "all" | "pending" | "donor_requests" | "stewards"
  >("all");
  const [expandedFamilyId, setExpandedFamilyId] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [roleGrants, setRoleGrants] = useState<RoleGrant[]>([]);
  const [preview, setPreview] = useState<PreviewState>({ active: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [memberPreviewModalOpen, setMemberPreviewModalOpen] = useState(false);
  const previewDialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (memberPreviewModalOpen) previewDialogRef.current?.showModal();
  }, [memberPreviewModalOpen]);
  const [memberPreviewSearch, setMemberPreviewSearch] = useState("");
  const [memberPreviewFamilyId, setMemberPreviewFamilyId] = useState("");
  const [mutating, setMutating] = useState(false);
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, FamilyDraft>>({});
  const [savingByFamilyId, setSavingByFamilyId] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (loading || !window.location.hash.startsWith("#family-")) return;
    setExpandedFamilyId(window.location.hash.slice("#family-".length));
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({
      block: "center",
    });
  }, [families, loading]);

  const rolesByFamilyId = useMemo(() => {
    const map = new Map<string, Set<FamilyRole>>();
    roleGrants.forEach((grant) => {
      const current = map.get(grant.family_id) ?? new Set<FamilyRole>();
      current.add(grant.role);
      map.set(grant.family_id, current);
    });
    return map;
  }, [roleGrants]);

  const buildFamilyDraft = useCallback(
    (family: FamilyRow): FamilyDraft => ({
      family_display_name: family.family_display_name,
      primary_email: family.primary_email,
      portal_access_state: family.portal_access_state ?? "approved",
      phone_number: family.phone_number ?? "",
      adults_count: family.adults_count,
      adult_names: resizeNames(family.adult_names ?? [], family.adults_count, "Adult"),
      children_count: family.children_count,
      child_names: resizeNames(family.child_names ?? [], family.children_count, "Child"),
      is_founding_family: family.founding_family_status !== "not_founding",
      active_donor_status: family.active_donor_status ?? "none",
      roles: Array.from(rolesByFamilyId.get(family.id) ?? new Set<FamilyRole>()),
    }),
    [rolesByFamilyId],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rolesResponse = await fetch("/api/admin/roles", { cache: "no-store" });

      const rolesPayload = (await rolesResponse.json()) as RolesApiPayload;

      if (!rolesResponse.ok) {
        throw new Error(rolesPayload.message ?? "Unable to load role data.");
      }

      const familiesFromApi = rolesPayload.families ?? [];
      const grantsFromApi = rolesPayload.roleGrants ?? [];
      setFamilies(familiesFromApi);
      setRoleGrants(grantsFromApi);

      if (canUsePreview) {
        const previewResponse = await fetch("/api/admin/preview", { cache: "no-store" });
        const previewPayload = (await previewResponse.json()) as {
          preview?: PreviewState;
          message?: string;
        };

        if (!previewResponse.ok) {
          throw new Error(previewPayload.message ?? "Unable to load preview data.");
        }

        setPreview(previewPayload.preview ?? { active: false });
      } else {
        setPreview({ active: false });
      }

      if (familiesFromApi.length > 0) {
        setMemberPreviewFamilyId((current) => current || familiesFromApi[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load role data.");
    } finally {
      setLoading(false);
    }
  }, [canUsePreview]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (families.length === 0) {
      setDrafts({});
      return;
    }

    setDrafts((current) => {
      const next: Record<string, FamilyDraft> = {};
      families.forEach((family) => {
        next[family.id] = current[family.id] ?? buildFamilyDraft(family);
      });
      return next;
    });
  }, [families, buildFamilyDraft]);

  const updateDraft = <K extends keyof FamilyDraft>(
    familyId: string,
    field: K,
    value: FamilyDraft[K],
  ) => {
    setDrafts((current) => {
      const existing =
        current[familyId] ?? buildFamilyDraft(families.find((row) => row.id === familyId)!);
      return {
        ...current,
        [familyId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const toggleRole = (familyId: string, role: FamilyRole) => {
    setDrafts((current) => {
      const existing = current[familyId];
      if (!existing) {
        return current;
      }

      const hasRole = existing.roles.includes(role);
      const nextRoles = hasRole
        ? existing.roles.filter((entry) => entry !== role)
        : [...existing.roles, role];

      return {
        ...current,
        [familyId]: {
          ...existing,
          roles: nextRoles,
        },
      };
    });
  };

  const updateAdultsCount = (familyId: string, nextCountValue: string) => {
    const parsed = Number(nextCountValue);
    const nextCount = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    const draft = drafts[familyId];
    if (!draft) return;

    updateDraft(familyId, "adults_count", nextCount);
    updateDraft(familyId, "adult_names", resizeNames(draft.adult_names, nextCount, "Adult"));
  };

  const updateChildrenCount = (familyId: string, nextCountValue: string) => {
    const parsed = Number(nextCountValue);
    const nextCount = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    const draft = drafts[familyId];
    if (!draft) return;

    updateDraft(familyId, "children_count", nextCount);
    updateDraft(familyId, "child_names", resizeNames(draft.child_names, nextCount, "Child"));
  };

  const bootstrapFamilies = async () => {
    setMutating(true);
    setError(null);
    setBootstrapMessage(null);

    try {
      const response = await fetch("/api/admin/bootstrap-families", { method: "POST" });
      const payload = (await response.json()) as BootstrapPayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to bootstrap families.");
      }

      setBootstrapMessage(
        `Bootstrap complete: ${payload.created ?? 0} created, ${payload.updated ?? 0} updated, ${payload.skipped ?? 0} skipped.`,
      );
      await loadAll();
      router.refresh();
    } catch (bootstrapError) {
      setError(
        bootstrapError instanceof Error ? bootstrapError.message : "Unable to bootstrap families.",
      );
    } finally {
      setMutating(false);
    }
  };

  const saveFoundingStatus = async (familyId: string, isFoundingFamily: boolean) => {
    const response = await fetch(`/api/admin/families/${familyId}/founding-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: isFoundingFamily ? "founding_active" : "not_founding" }),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      throw new Error(payload.message ?? "Unable to update founding status.");
    }
  };

  const startPreviewAsLoggedOut = async () => {
    setMutating(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "logged_out" }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to start logged-out preview.");
      }

      window.location.href = "/";
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to start preview.");
      setMutating(false);
    }
  };

  const startPreviewAsFamily = async (familyId: string) => {
    if (!familyId) {
      setError("Select a family to preview.");
      return;
    }

    setMutating(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "family", familyId }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to start family preview.");
      }

      window.location.href = "/";
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to start preview.");
      setMutating(false);
    }
  };

  const stopPreview = async () => {
    setMutating(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/preview", { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to stop preview.");
      }

      await loadAll();
      router.refresh();
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to stop preview.");
    } finally {
      setMutating(false);
    }
  };

  const previewFamilyName = useMemo(() => {
    if (!preview.targetFamilyId) {
      return preview.targetEmail ?? "";
    }

    const matched = families.find((family) => family.id === preview.targetFamilyId);
    return matched?.family_display_name ?? preview.targetEmail ?? "member";
  }, [families, preview.targetEmail, preview.targetFamilyId]);

  const filteredPreviewFamilies = useMemo(() => {
    const query = memberPreviewSearch.trim().toLowerCase();
    if (!query) {
      return families;
    }

    return families.filter((family) =>
      `${family.family_display_name} ${family.primary_email}`.toLowerCase().includes(query),
    );
  }, [families, memberPreviewSearch]);

  const saveFamily = async (familyId: string) => {
    const draft = drafts[familyId];
    if (!draft) {
      return;
    }

    setSavingByFamilyId((current) => ({ ...current, [familyId]: true }));
    setError(null);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId,
          familyDisplayName: draft.family_display_name,
          primaryEmail: draft.primary_email,
          portalAccessState: draft.portal_access_state,
          phoneNumber: draft.phone_number || null,
          adultsCount: draft.adults_count,
          adultNames: draft.adult_names.map((value) => value.trim()).filter(Boolean),
          childrenCount: draft.children_count,
          childNames: draft.child_names.map((value) => value.trim()).filter(Boolean),
          activeDonorStatus: draft.active_donor_status,
          ...(canManageRoles ? { roles: draft.roles } : {}),
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save family profile.");
      }

      await saveFoundingStatus(familyId, draft.is_founding_family);
      setSavedMessage(`Changes saved for ${draft.family_display_name}.`);
      await loadAll();
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save family profile.");
    } finally {
      setSavingByFamilyId((current) => ({ ...current, [familyId]: false }));
    }
  };

  const visibleFamilies = families.filter((family) => {
    const query = familySearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      `${family.family_display_name} ${family.primary_email} ${family.phone_number ?? ""}`
        .toLowerCase()
        .includes(query);
    const matchesFilter =
      familyFilter === "all" ||
      (familyFilter === "pending" && family.portal_access_state === "pending") ||
      (familyFilter === "donor_requests" && family.requested_active_donor_status) ||
      (familyFilter === "stewards" &&
        [...(rolesByFamilyId.get(family.id) ?? [])].some((role) => role !== "member"));
    return matchesSearch && matchesFilter;
  });

  return (
    <section className="admin-workflow">
      <div className="workflow-context">
        <div className="workflow-context-icon">
          <WorkspaceIcon name="users" size={22} />
        </div>
        <div>
          <p className="workflow-eyebrow">People & permissions</p>
          <h2>A community, cared for</h2>
          <p>
            Welcome families, keep their details current and give each team member the access their
            work needs.
          </p>
        </div>
      </div>
      <div className="workflow-stats">
        <div>
          <span>{loading ? "—" : families.length}</span>
          <p>Family accounts</p>
        </div>
        <div>
          <span>
            {loading
              ? "—"
              : families.filter((family) => family.portal_access_state === "pending").length}
          </span>
          <p>Awaiting access</p>
        </div>
        <div>
          <span>
            {loading
              ? "—"
              : families.filter((family) => family.requested_active_donor_status).length}
          </span>
          <p>Donor tier requests</p>
        </div>
      </div>
      <div className="workflow-toolbar">
        <div className="workflow-tabs" aria-label="Family filters">
          {(
            [
              { value: "all", label: "All families" },
              { value: "pending", label: "Access requests" },
              { value: "donor_requests", label: "Donor requests" },
              { value: "stewards", label: "Team members" },
            ] as const
          ).map((filter) => (
            <button
              type="button"
              key={filter.value}
              aria-pressed={familyFilter === filter.value}
              onClick={() => setFamilyFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <label className="workflow-search">
          <WorkspaceIcon name="search" size={17} />
          <input
            value={familySearch}
            onChange={(event) => setFamilySearch(event.target.value)}
            placeholder="Find a family by name or email"
            aria-label="Search family accounts"
          />
        </label>
      </div>
      {error ? (
        <WorkspaceNotice tone="error">
          {error}{" "}
          <button type="button" onClick={() => void loadAll()}>
            Try again
          </button>
        </WorkspaceNotice>
      ) : null}
      {savedMessage ? <WorkspaceNotice tone="success">{savedMessage}</WorkspaceNotice> : null}
      {loading ? (
        <div className="workflow-loading" role="status">
          <span className="workflow-loading-dot" /> Gathering family accounts…
        </div>
      ) : null}
      {!loading && !error && !visibleFamilies.length ? (
        <WorkspaceEmpty
          icon={familyFilter === "pending" || familyFilter === "donor_requests" ? "check" : "users"}
          eyebrow={familySearch ? "Search results" : "People & permissions"}
          title={
            familySearch
              ? "No matching family accounts"
              : familyFilter === "pending"
                ? "Every access request is up to date"
                : familyFilter === "donor_requests"
                  ? "No donor requests to review"
                  : familyFilter === "stewards"
                    ? "Your stewardship team starts here"
                    : "Make room for your community"
          }
          description={
            familySearch
              ? "Try another name or email, or return to the complete family list."
              : familyFilter === "all"
                ? "Family accounts appear here when members join. Existing sign-in accounts can also be imported using the administration tools below."
                : "New requests will appear here when a family needs your attention. You can explore all family accounts in the meantime."
          }
          action={
            familySearch || familyFilter !== "all" ? (
              <button
                type="button"
                className="workflow-button"
                onClick={() => {
                  setFamilySearch("");
                  setFamilyFilter("all");
                }}
              >
                View all families
              </button>
            ) : undefined
          }
        />
      ) : null}
      {!loading &&
        visibleFamilies.map((family) => {
          const draft = drafts[family.id] ?? buildFamilyDraft(family);
          const requestedTier = family.requested_active_donor_status;
          const expanded = expandedFamilyId === family.id;
          return (
            <article
              id={`family-${family.id}`}
              key={family.id}
              className="family-card scroll-mt-28"
            >
              <button
                type="button"
                className="family-card-summary"
                onClick={() => setExpandedFamilyId(expanded ? "" : family.id)}
                aria-expanded={expanded}
                aria-controls={`family-editor-${family.id}`}
              >
                <span className="family-avatar">
                  {family.family_display_name.slice(0, 1).toUpperCase()}
                </span>
                <span className="family-card-identity">
                  <strong>{family.family_display_name}</strong>
                  <span>{family.primary_email}</span>
                </span>
                <span className="family-card-badges">
                  <span className={`workflow-badge workflow-badge-${family.portal_access_state}`}>
                    {family.portal_access_state === "pending"
                      ? "Access requested"
                      : family.portal_access_state === "approved"
                        ? "Portal active"
                        : "Suspended"}
                  </span>
                  {requestedTier ? (
                    <span className="workflow-badge workflow-badge-requested">Donor request</span>
                  ) : null}
                </span>
                <span className={`family-expand ${expanded ? "is-expanded" : ""}`}>
                  <WorkspaceIcon name="chevron" size={18} />
                </span>
              </button>
              {expanded ? (
                <div id={`family-editor-${family.id}`} className="family-card-editor">
                  <fieldset className="workflow-fieldset">
                    <legend>Family profile</legend>
                    <div className="workflow-form-grid">
                      <label className="workflow-field">
                        Family name
                        <input
                          value={draft.family_display_name}
                          onChange={(event) =>
                            updateDraft(family.id, "family_display_name", event.target.value)
                          }
                        />
                      </label>
                      <label className="workflow-field">
                        Primary email
                        <input
                          type="email"
                          value={draft.primary_email}
                          onChange={(event) =>
                            updateDraft(family.id, "primary_email", event.target.value)
                          }
                        />
                      </label>
                      <label className="workflow-field">
                        Phone number
                        <input
                          type="tel"
                          value={draft.phone_number}
                          onChange={(event) =>
                            updateDraft(
                              family.id,
                              "phone_number",
                              formatUsPhoneNumber(event.target.value),
                            )
                          }
                          placeholder="925-555-1234"
                        />
                      </label>
                      <label className="workflow-field">
                        Portal access
                        <select
                          value={draft.portal_access_state}
                          onChange={(event) =>
                            updateDraft(
                              family.id,
                              "portal_access_state",
                              event.target.value as PortalAccessState,
                            )
                          }
                        >
                          {portalAccessStates.map((state) => (
                            <option key={state} value={state}>
                              {state === "pending"
                                ? "Pending review"
                                : state === "approved"
                                  ? "Approved · portal active"
                                  : "Suspended · no portal access"}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </fieldset>
                  <fieldset className="workflow-fieldset">
                    <legend>People in this family</legend>
                    <div className="workflow-form-grid">
                      <div>
                        <label className="workflow-field">
                          Number of adults
                          <input
                            type="number"
                            min={0}
                            value={draft.adults_count}
                            onChange={(event) => updateAdultsCount(family.id, event.target.value)}
                          />
                        </label>
                        <div className="workflow-name-list">
                          {draft.adult_names.map((name, index) => (
                            <label className="workflow-field" key={`${family.id}-adult-${index}`}>
                              Adult {index + 1}
                              <input
                                value={name}
                                onChange={(event) =>
                                  updateDraft(
                                    family.id,
                                    "adult_names",
                                    draft.adult_names.map((entry, entryIndex) =>
                                      entryIndex === index ? event.target.value : entry,
                                    ),
                                  )
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="workflow-field">
                          Number of children
                          <input
                            type="number"
                            min={0}
                            value={draft.children_count}
                            onChange={(event) => updateChildrenCount(family.id, event.target.value)}
                          />
                        </label>
                        <div className="workflow-name-list">
                          {draft.child_names.map((name, index) => (
                            <label className="workflow-field" key={`${family.id}-child-${index}`}>
                              Child {index + 1}
                              <input
                                value={name}
                                onChange={(event) =>
                                  updateDraft(
                                    family.id,
                                    "child_names",
                                    draft.child_names.map((entry, entryIndex) =>
                                      entryIndex === index ? event.target.value : entry,
                                    ),
                                  )
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  <fieldset className="workflow-fieldset">
                    <legend>Giving & membership</legend>
                    <div className="workflow-form-grid">
                      <label className="workflow-checkbox">
                        <input
                          type="checkbox"
                          checked={draft.is_founding_family}
                          onChange={(event) =>
                            updateDraft(family.id, "is_founding_family", event.target.checked)
                          }
                        />
                        <span>Founding family</span>
                      </label>
                      <label className="workflow-field">
                        Active donor tier
                        <select
                          value={draft.active_donor_status}
                          onChange={(event) =>
                            updateDraft(
                              family.id,
                              "active_donor_status",
                              event.target.value as ActiveDonorStatus,
                            )
                          }
                        >
                          {activeDonorStatuses.map((tier) => (
                            <option key={tier} value={tier}>
                              {tier === "none"
                                ? "No active donor tier"
                                : tier.charAt(0).toUpperCase() + tier.slice(1)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {requestedTier ? (
                      <div className="family-tier-request">
                        <div>
                          <strong>Requested tier: {requestedTier}</strong>
                          <p>
                            {family.requested_active_donor_at
                              ? `Requested ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Los_Angeles" }).format(new Date(family.requested_active_donor_at))}. `
                              : ""}
                            Review the family’s giving before applying this tier.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="workflow-button"
                          onClick={() =>
                            updateDraft(family.id, "active_donor_status", requestedTier)
                          }
                        >
                          Apply requested tier
                        </button>
                      </div>
                    ) : null}
                  </fieldset>
                  <fieldset className="workflow-fieldset">
                    <legend>Responsibilities & access</legend>
                    <p className="workflow-helper">
                      {canManageRoles
                        ? "Choose the responsibilities this family needs. Roles can be combined; only site administrators can change them."
                        : "Role assignments are managed by a site administrator."}
                    </p>
                    <div className="family-role-grid">
                      {(canManageRoles
                        ? allRoles
                        : draft.roles.length
                          ? draft.roles
                          : ["member" as FamilyRole]
                      ).map((role) => (
                        <label
                          key={`${family.id}-${role}`}
                          className={`family-role-option ${draft.roles.includes(role) ? "is-selected" : ""}`}
                        >
                          {canManageRoles ? (
                            <input
                              type="checkbox"
                              checked={draft.roles.includes(role)}
                              onChange={() => toggleRole(family.id, role)}
                            />
                          ) : (
                            <WorkspaceIcon name="shield" size={18} />
                          )}
                          <span>
                            <strong>{roleDescriptions[role].label}</strong>
                            <span>{roleDescriptions[role].description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="family-save-bar">
                    <p>Changes apply when you save this family.</p>
                    <button
                      type="button"
                      className="workflow-button workflow-button-primary"
                      disabled={savingByFamilyId[family.id]}
                      onClick={() => void saveFamily(family.id)}
                    >
                      {savingByFamilyId[family.id] ? "Saving family…" : "Save family changes"}
                      <WorkspaceIcon name="check" size={16} />
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      {canManageRoles || canUsePreview ? (
        <details className="workflow-tools">
          <summary>
            <WorkspaceIcon name="key" size={17} />
            <span>Administration tools</span>
            <WorkspaceIcon name="chevron" size={16} />
          </summary>
          <div className="workflow-tools-content">
            {canManageRoles ? (
              <div>
                <h3>Import existing accounts</h3>
                <p>
                  Create or refresh family profiles for people who already have a sign-in account.
                </p>
                <button
                  type="button"
                  className="workflow-button"
                  disabled={mutating}
                  onClick={() => void bootstrapFamilies()}
                >
                  {mutating ? "Working…" : "Import family accounts"}
                </button>
                {bootstrapMessage ? (
                  <WorkspaceNotice tone="success">{bootstrapMessage}</WorkspaceNotice>
                ) : null}
              </div>
            ) : null}
            {canUsePreview ? (
              <div>
                <h3>Experience the site as a member</h3>
                <p>
                  {preview.active
                    ? `Preview is active: ${preview.mode === "family" ? previewFamilyName : "signed out"}.`
                    : "Check what families and signed-out visitors see before sharing the experience."}
                </p>
                <div className="workflow-actions">
                  <button
                    type="button"
                    className="workflow-button"
                    disabled={mutating}
                    onClick={() => {
                      if (preview.active && preview.mode === "logged_out") void stopPreview();
                      else void startPreviewAsLoggedOut();
                    }}
                  >
                    {preview.active && preview.mode === "logged_out"
                      ? "End signed-out preview"
                      : "Preview signed out"}
                  </button>
                  {families.length ? (
                    <button
                      type="button"
                      className="workflow-button"
                      disabled={mutating}
                      onClick={() => {
                        if (preview.active && preview.mode === "family") void stopPreview();
                        else {
                          setMemberPreviewModalOpen(true);
                          setMemberPreviewSearch("");
                          setMemberPreviewFamilyId((current) => current || families[0]?.id || "");
                        }
                      }}
                    >
                      {preview.active && preview.mode === "family"
                        ? "End member preview"
                        : "Preview a family"}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
      {canUsePreview && memberPreviewModalOpen ? (
        <dialog
          ref={previewDialogRef}
          className="workflow-native-dialog"
          aria-labelledby="member-preview-title"
          onClose={() => setMemberPreviewModalOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) previewDialogRef.current?.close();
          }}
        >
          <section className="workflow-modal">
            <div className="workflow-modal-heading">
              <h3 id="member-preview-title">See the site through their eyes</h3>
              <button
                type="button"
                className="workflow-icon-button"
                aria-label="Close family preview"
                onClick={() => previewDialogRef.current?.close()}
              >
                <WorkspaceIcon name="close" size={20} />
              </button>
            </div>
            <p>Choose the family account you’d like to preview.</p>
            <label className="workflow-search">
              <WorkspaceIcon name="search" size={17} />
              <input
                autoFocus
                value={memberPreviewSearch}
                onChange={(event) => setMemberPreviewSearch(event.target.value)}
                placeholder="Family name or email"
                aria-label="Search families to preview"
              />
            </label>
            <div className="family-preview-list">
              {filteredPreviewFamilies.length ? (
                filteredPreviewFamilies.map((family) => (
                  <label className="family-preview-option" key={family.id}>
                    <input
                      type="radio"
                      name="member-preview-family"
                      checked={memberPreviewFamilyId === family.id}
                      onChange={() => setMemberPreviewFamilyId(family.id)}
                    />
                    <span>
                      <strong>{family.family_display_name}</strong>
                      <span>{family.primary_email}</span>
                    </span>
                  </label>
                ))
              ) : (
                <WorkspaceEmpty
                  compact
                  icon="search"
                  title="No matching family"
                  description="Try another name or email address."
                />
              )}
            </div>
            <div className="workflow-actions">
              <button
                type="button"
                className="workflow-button"
                onClick={() => previewDialogRef.current?.close()}
              >
                Cancel
              </button>
              <button
                type="button"
                className="workflow-button workflow-button-primary"
                disabled={mutating || !memberPreviewFamilyId}
                onClick={() => void startPreviewAsFamily(memberPreviewFamilyId)}
              >
                Start family preview
                <WorkspaceIcon name="arrow" size={16} />
              </button>
            </div>
          </section>
        </dialog>
      ) : null}
    </section>
  );
}
