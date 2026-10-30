"use client";

import { useState } from "react";

export function AuthArrow() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  );
}

export function AuthStateIcon({ kind = "mail" }: { kind?: "mail" | "check" | "lock" }) {
  return (
    <span className={`auth-state-icon auth-state-icon-${kind}`}>
      <svg
        aria-hidden="true"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {kind === "mail" ? (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 6 9 7 9-7" />
          </>
        ) : kind === "check" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 3 3 5-6" />
          </>
        ) : (
          <>
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
          </>
        )}
      </svg>
    </span>
  );
}

export function AuthPasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  hint,
  isBn = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "new-password" | "current-password";
  minLength?: number;
  hint?: string;
  isBn?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-control">
        <input
          id={id}
          name={id}
          required
          minLength={minLength}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={
            visible
              ? isBn
                ? "পাসওয়ার্ড লুকান"
                : `Hide ${label.toLowerCase()}`
              : isBn
                ? "পাসওয়ার্ড দেখুন"
                : `Show ${label.toLowerCase()}`
          }
          aria-pressed={visible}
        >
          <svg
            aria-hidden="true"
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {visible ? (
              <>
                <path d="m3 3 18 18M9.9 9.9a3 3 0 0 0 4.2 4.2M6.5 6.5C4.4 8 3 10 2 12c2 4 5.6 7 10 7 2 0 3.8-.6 5.4-1.6M10 5.2c.7-.1 1.3-.2 2-.2 4.4 0 8 3 10 7a16 16 0 0 1-2.2 3.3" />
              </>
            ) : (
              <>
                <path d="M2 12c2-4 5.6-7 10-7s8 3 10 7c-2 4-5.6 7-10 7S4 16 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="auth-field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
