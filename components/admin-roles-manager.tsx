"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { formatUsPhoneNumber } from "@/lib/phone";
import type { FamilyRole } from "@/lib/portal/types";

interface FamilyRow {
  id: string;
  family_display_name: string;
  primary_email: string;
  phone_number: string | null;
  adults_count: number;
  adult_names: string[];
  children_count: number;
  child_names: string[];
  founding_family_status: "not_founding" | "founding_active" | "founding_completed" | "founding_paused";
  pledge_status: string;
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
  phone_number: string;
  adults_count: number;
  adult_names: string[];
  children_count: number;
  child_names: string[];
  roles: FamilyRole[];
}

const allRoles: FamilyRole[] = ["super_admin", "treasurer", "event_manager", "member"];
const foundingStatuses: FamilyRow["founding_family_status"][] = [
  "not_founding",
  "founding_active",
  "founding_completed",
  "founding_paused",
];

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

export function AdminRolesManager() {
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [roleGrants, setRoleGrants] = useState<RoleGrant[]>([]);
  const [preview, setPreview] = useState<PreviewState>({ active: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [selectedFoundingStatus, setSelectedFoundingStatus] =
    useState<FamilyRow["founding_family_status"]>("not_founding");
  const [mutating, setMutating] = useState(false);
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, FamilyDraft>>({});
  const [savingByFamilyId, setSavingByFamilyId] = useState<Record<string, boolean>>({});

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
      phone_number: family.phone_number ?? "",
      adults_count: family.adults_count,
      adult_names: resizeNames(family.adult_names ?? [], family.adults_count, "Adult"),
      children_count: family.children_count,
      child_names: resizeNames(family.child_names ?? [], family.children_count, "Child"),
      roles: Array.from(rolesByFamilyId.get(family.id) ?? new Set<FamilyRole>()),
    }),
    [rolesByFamilyId],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [rolesResponse, previewResponse] = await Promise.all([
        fetch("/api/admin/roles", { cache: "no-store" }),
        fetch("/api/admin/preview", { cache: "no-store" }),
      ]);

      const rolesPayload = (await rolesResponse.json()) as RolesApiPayload;
      const previewPayload = (await previewResponse.json()) as { preview?: PreviewState; message?: string };

      if (!rolesResponse.ok) {
        throw new Error(rolesPayload.message ?? "Unable to load role data.");
      }

      if (!previewResponse.ok) {
        throw new Error(previewPayload.message ?? "Unable to load preview data.");
      }

      const familiesFromApi = rolesPayload.families ?? [];
      const grantsFromApi = rolesPayload.roleGrants ?? [];
      setFamilies(familiesFromApi);
      setRoleGrants(grantsFromApi);
      setPreview(previewPayload.preview ?? { active: false });

      if (familiesFromApi.length > 0) {
        setSelectedFamilyId((current) => current || familiesFromApi[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load role data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const selectedFamily = families.find((family) => family.id === selectedFamilyId);
    if (selectedFamily) {
      setSelectedFoundingStatus(selectedFamily.founding_family_status);
    }
  }, [families, selectedFamilyId]);

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

  const updateDraft = <K extends keyof FamilyDraft>(familyId: string, field: K, value: FamilyDraft[K]) => {
    setDrafts((current) => {
      const existing = current[familyId] ?? buildFamilyDraft(families.find((row) => row.id === familyId)!);
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
    } catch (bootstrapError) {
      setError(bootstrapError instanceof Error ? bootstrapError.message : "Unable to bootstrap families.");
    } finally {
      setMutating(false);
    }
  };

  const setFoundingStatus = async () => {
    if (!selectedFamilyId) {
      setError("Select a family first.");
      return;
    }

    setMutating(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/families/${selectedFamilyId}/founding-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedFoundingStatus }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to update founding status.");
      }

      await loadAll();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update founding status.");
    } finally {
      setMutating(false);
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

  const startPreviewAsFamily = async () => {
    if (!selectedFamilyId) {
      setError("Select a family to preview.");
      return;
    }

    setMutating(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "family", familyId: selectedFamilyId }),
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
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to stop preview.");
    } finally {
      setMutating(false);
    }
  };

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
          phoneNumber: draft.phone_number || null,
          adultsCount: draft.adults_count,
          adultNames: draft.adult_names.map((value) => value.trim()).filter(Boolean),
          childrenCount: draft.children_count,
          childNames: draft.child_names.map((value) => value.trim()).filter(Boolean),
          roles: draft.roles,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save family profile.");
      }

      await loadAll();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save family profile.");
    } finally {
      setSavingByFamilyId((current) => ({ ...current, [familyId]: false }));
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">Family & Role Management</h2>
        <p className="text-sm text-slate-700">Manage family profile details and roles from a single table.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={mutating}
            onClick={() => void bootstrapFamilies()}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Bootstrap families from auth users
          </button>
          {bootstrapMessage ? <span className="text-xs text-emerald-700">{bootstrapMessage}</span> : null}
        </div>
      </header>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-900">Preview Mode</h3>
        <p className="mt-1 text-xs text-slate-600">
          Super admins can inspect the site as logged out or as any family account.
        </p>
        <p className="mt-2 text-xs text-slate-700">
          Current: {preview.active ? `${preview.mode} ${preview.targetEmail ? `(${preview.targetEmail})` : ""}` : "off"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={mutating}
            onClick={() => void startPreviewAsLoggedOut()}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Preview as logged out
          </button>
          <button
            type="button"
            disabled={mutating || families.length === 0}
            onClick={() => void startPreviewAsFamily()}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Preview selected family
          </button>
          <button
            type="button"
            disabled={mutating}
            onClick={() => void stopPreview()}
            className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Stop preview
          </button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <select
          value={selectedFamilyId}
          onChange={(event) => setSelectedFamilyId(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          disabled={families.length === 0}
        >
          {families.length === 0 ? <option value="">No families found</option> : null}
          {families.map((family) => (
            <option key={family.id} value={family.id}>
              {family.family_display_name} ({family.primary_email})
            </option>
          ))}
        </select>

        <select
          value={selectedFoundingStatus}
          onChange={(event) => setSelectedFoundingStatus(event.target.value as FamilyRow["founding_family_status"])}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          disabled={families.length === 0}
        >
          {foundingStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={mutating || families.length === 0}
          onClick={() => void setFoundingStatus()}
          className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60"
        >
          Set founding status
        </button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading family data...</p> : null}

      {!loading ? (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Family Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Phone Number</th>
                <th className="px-3 py-2 font-semibold"># Adults</th>
                <th className="px-3 py-2 font-semibold">Adult Names</th>
                <th className="px-3 py-2 font-semibold"># Children</th>
                <th className="px-3 py-2 font-semibold">Child Names</th>
                <th className="px-3 py-2 font-semibold">Roles</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {families.map((family) => {
                const draft = drafts[family.id] ?? buildFamilyDraft(family);
                return (
                  <tr key={family.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2">
                      <input
                        value={draft.family_display_name}
                        onChange={(event) => updateDraft(family.id, "family_display_name", event.target.value)}
                        className="w-52 rounded-md border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={draft.primary_email}
                        onChange={(event) => updateDraft(family.id, "primary_email", event.target.value)}
                        className="w-60 rounded-md border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={draft.phone_number}
                        onChange={(event) => updateDraft(family.id, "phone_number", formatUsPhoneNumber(event.target.value))}
                        className="w-44 rounded-md border border-slate-300 px-2 py-1"
                        placeholder="925-555-1234"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={draft.adults_count}
                        onChange={(event) => updateAdultsCount(family.id, event.target.value)}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-64 space-y-2">
                        {draft.adult_names.map((name, index) => (
                          <input
                            key={`${family.id}-adult-${index + 1}`}
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
                            className="w-full rounded-md border border-slate-300 px-2 py-1"
                            placeholder={`Adult ${index + 1} name`}
                          />
                        ))}
                        {draft.adult_names.length === 0 ? <p className="text-xs text-slate-500">No adults listed.</p> : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={draft.children_count}
                        onChange={(event) => updateChildrenCount(family.id, event.target.value)}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-64 space-y-2">
                        {draft.child_names.map((name, index) => (
                          <input
                            key={`${family.id}-child-${index + 1}`}
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
                            className="w-full rounded-md border border-slate-300 px-2 py-1"
                            placeholder={`Child ${index + 1} name`}
                          />
                        ))}
                        {draft.child_names.length === 0 ? <p className="text-xs text-slate-500">No children listed.</p> : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {allRoles.map((role) => (
                          <label key={`${family.id}-${role}`} className="flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={draft.roles.includes(role)}
                              onChange={() => toggleRole(family.id, role)}
                            />
                            {role}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={savingByFamilyId[family.id]}
                        onClick={() => void saveFamily(family.id)}
                        className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {savingByFamilyId[family.id] ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
