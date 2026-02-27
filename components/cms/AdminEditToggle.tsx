"use client";

interface AdminEditToggleProps {
  editing: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function AdminEditToggle({ editing, onToggle, disabled = false }: AdminEditToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="rounded border border-[var(--db-border)] bg-white px-2 py-1 text-xs font-bold uppercase text-[#173724] hover:bg-[#eef4ec] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {editing ? "Done" : "Edit"}
    </button>
  );
}
