"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { AuthArrow } from "@/components/auth-fields";
import { formatUsPhoneNumber, normalizeUsPhoneNumber } from "@/lib/phone";

import "@/styles/auth-workspace.css";

interface PortalOnboardingFormProps {
  email: string;
  initialName?: string;
  initialAdultsCount?: number;
  initialChildrenCount?: number;
}

export function PortalOnboardingForm({
  email,
  initialName = "",
  initialAdultsCount = 1,
  initialChildrenCount = 0,
}: PortalOnboardingFormProps) {
  const [familyDisplayName, setFamilyDisplayName] = useState(initialName);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [adultNames, setAdultNames] = useState<string[]>(() =>
    Array.from({ length: Math.max(1, initialAdultsCount) }, (_, index) =>
      index === 0 ? initialName : "",
    ),
  );
  const [childNames, setChildNames] = useState<string[]>(() =>
    Array.from({ length: Math.max(0, initialChildrenCount) }, () => ""),
  );
  const [step, setStep] = useState<"details" | "review">("details");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    if (previousStep.current !== step) {
      headingRef.current?.focus({ preventScroll: true });
      previousStep.current = step;
    }
  }, [step]);

  const addPerson = (kind: "adult" | "child") => {
    const names = kind === "adult" ? adultNames : childNames;
    pendingFocus.current = `${kind}-${names.length}`;
    if (kind === "adult") setAdultNames((current) => [...current, ""]);
    else setChildNames((current) => [...current, ""]);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (step === "details") {
      if (
        !familyDisplayName.trim() ||
        adultNames.some((name) => !name.trim()) ||
        childNames.some((name) => !name.trim())
      ) {
        setError("Please enter your household name and a name for each family member.");
        return;
      }
      if (!normalizeUsPhoneNumber(phoneNumber)) {
        setError("Enter a US phone number with 10 digits, including the area code.");
        return;
      }
      setStep("review");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/portal/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyDisplayName,
          phoneNumber,
          adultsCount: adultNames.length,
          childrenCount: childNames.length,
          adultNames,
          childNames,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(payload.message ?? "We couldn’t save your profile. Please try again.");
      window.location.assign("/portal");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn’t save your profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-onboarding" aria-labelledby="family-setup-heading">
      <aside className="auth-onboarding-aside">
        <p className="auth-eyebrow">A place for your family</p>
        <h2>
          Community starts
          <br />
          with connection.
        </h2>
        <p>
          A few details help us welcome your household and keep your family’s membership together.
        </p>
        <ol className="auth-onboarding-progress" aria-label="Account setup progress">
          <li className="is-complete">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Account created</strong>
              <small>You have a place here.</small>
            </div>
          </li>
          <li className="is-complete">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Email confirmed</strong>
              <small>Your address is verified.</small>
            </div>
          </li>
          <li aria-current="step">
            <span aria-hidden="true">03</span>
            <div>
              <strong>Your family profile</strong>
              <small>
                {step === "review"
                  ? "Review and submit your details."
                  : "Introduce your household."}
              </small>
            </div>
          </li>
          <li>
            <span aria-hidden="true">04</span>
            <div>
              <strong>Membership review</strong>
              <small>Our team will review your access.</small>
            </div>
          </li>
        </ol>
        <div className="auth-onboarding-account">
          <span>Signed in as</span>
          <strong>{email}</strong>
        </div>
      </aside>

      <div className="auth-onboarding-main">
        <header>
          <p className="auth-eyebrow">
            Family profile · {step === "review" ? "Review" : "Your details"}
          </p>
          <h1 ref={headingRef} tabIndex={-1} id="family-setup-heading" className="auth-heading">
            {step === "review" ? "A quick check, then you’re ready." : "Let’s meet your family."}
          </h1>
          <p className="auth-intro">
            {step === "review"
              ? "Review your details before sending them to the Durga Bari team."
              : "Add your household and contact details. You’ll have a chance to review everything before submitting."}
          </p>
        </header>

        <form onSubmit={(event) => void submit(event)} aria-busy={submitting}>
          {step === "details" ? (
            <div className="auth-onboarding-fields">
              <div className="auth-field">
                <label htmlFor="household-name">Family or household name</label>
                <input
                  id="household-name"
                  name="household"
                  value={familyDisplayName}
                  onChange={(event) => setFamilyDisplayName(event.target.value)}
                  placeholder="The Banerjee family"
                  autoComplete="organization"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="household-phone">Contact phone number</label>
                <input
                  id="household-phone"
                  name="phone"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(formatUsPhoneNumber(event.target.value))}
                  placeholder="925-555-1234"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-describedby="household-phone-hint"
                  required
                />
                <p id="household-phone-hint" className="auth-field-hint">
                  US number, including the area code.
                </p>
              </div>

              <fieldset className="auth-household-group">
                <legend>
                  Adults <span>{adultNames.length}</span>
                </legend>
                <p>Include each adult in your household.</p>
                <div className="auth-person-list">
                  {adultNames.map((name, index) => (
                    <div key={`adult-${index}`} className="auth-person-row">
                      <div className="auth-field">
                        <label htmlFor={`adult-${index}`}>
                          {index === 0 ? "Your full name" : `Adult ${index + 1} full name`}
                        </label>
                        <input
                          ref={(node) => {
                            if (node && pendingFocus.current === `adult-${index}`) {
                              node.focus();
                              pendingFocus.current = null;
                            }
                          }}
                          id={`adult-${index}`}
                          name={`adult-${index}`}
                          value={name}
                          onChange={(event) =>
                            setAdultNames((current) =>
                              current.map((entry, currentIndex) =>
                                currentIndex === index ? event.target.value : entry,
                              ),
                            )
                          }
                          autoComplete={index === 0 ? "name" : "off"}
                          required
                        />
                      </div>
                      {index > 0 ? (
                        <button
                          type="button"
                          className="auth-remove-person"
                          aria-label={`Remove adult ${index + 1}`}
                          onClick={() =>
                            setAdultNames((current) =>
                              current.filter((_, currentIndex) => currentIndex !== index),
                            )
                          }
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addPerson("adult")}
                  className="auth-add-person"
                >
                  <span aria-hidden="true">+</span> Add an adult
                </button>
              </fieldset>

              <fieldset className="auth-household-group">
                <legend>
                  Children <span>{childNames.length}</span>
                  <small>Optional</small>
                </legend>
                <p>
                  {childNames.length === 0
                    ? "Have children in your household? Add them here so your family profile is complete."
                    : "Add each child’s full name."}
                </p>
                <div className="auth-person-list">
                  {childNames.map((name, index) => (
                    <div key={`child-${index}`} className="auth-person-row">
                      <div className="auth-field">
                        <label htmlFor={`child-${index}`}>Child {index + 1} full name</label>
                        <input
                          ref={(node) => {
                            if (node && pendingFocus.current === `child-${index}`) {
                              node.focus();
                              pendingFocus.current = null;
                            }
                          }}
                          id={`child-${index}`}
                          name={`child-${index}`}
                          value={name}
                          onChange={(event) =>
                            setChildNames((current) =>
                              current.map((entry, currentIndex) =>
                                currentIndex === index ? event.target.value : entry,
                              ),
                            )
                          }
                          autoComplete="off"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="auth-remove-person"
                        aria-label={`Remove child ${index + 1}`}
                        onClick={() =>
                          setChildNames((current) =>
                            current.filter((_, currentIndex) => currentIndex !== index),
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addPerson("child")}
                  className="auth-add-person"
                >
                  <span aria-hidden="true">+</span> Add a child
                </button>
              </fieldset>
            </div>
          ) : (
            <div className="auth-profile-review">
              <div className="auth-review-heading">
                <span className="auth-eyebrow">Your household</span>
                <button
                  type="button"
                  className="auth-text-button"
                  disabled={submitting}
                  onClick={() => {
                    setStep("details");
                    setError(null);
                  }}
                >
                  Edit details
                </button>
              </div>
              <h2>{familyDisplayName}</h2>
              <dl>
                <div>
                  <dt>Email</dt>
                  <dd>{email}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{phoneNumber}</dd>
                </div>
                <div>
                  <dt>
                    {adultNames.length === 1 ? "Adult" : "Adults"} · {adultNames.length}
                  </dt>
                  <dd>{adultNames.join(", ")}</dd>
                </div>
                {childNames.length > 0 ? (
                  <div>
                    <dt>
                      {childNames.length === 1 ? "Child" : "Children"} · {childNames.length}
                    </dt>
                    <dd>{childNames.join(", ")}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="auth-review-next">
                <strong>What happens next?</strong>
                <p>
                  Your details will be saved and your membership will be ready for our team to
                  review. Member features become available after approval.
                </p>
              </div>
            </div>
          )}
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="auth-onboarding-actions">
            <button type="submit" disabled={submitting} className="auth-submit">
              <span>
                {submitting
                  ? "Saving your family profile…"
                  : step === "details"
                    ? "Review family profile"
                    : "Submit for membership review"}
              </span>
              {submitting ? <span className="auth-spinner" aria-hidden="true" /> : <AuthArrow />}
            </button>
            {step === "details" ? (
              <p className="auth-small-copy">
                Your details are saved when you submit. Changes after setup can be made by an
                administrator.
              </p>
            ) : (
              <p className="auth-small-copy">
                You can return here by signing in if you leave before submitting.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
