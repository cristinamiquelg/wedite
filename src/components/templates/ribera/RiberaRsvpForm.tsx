"use client";

import { useId, useRef, useState } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import styles from "./ribera.module.css";

type YesNo = "si" | "no" | null;

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.segIco} aria-hidden="true">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.segIco} aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 13.6L15.6 17 12 13.4 8.4 17 7 15.6 10.6 12 7 8.4 8.4 7 12 10.6 15.6 7 17 8.4 13.4 12z" />
    </svg>
  );
}

// Yes/no question rendered as a segmented control. Semantically it's a
// radio group with a visible question, so screen readers announce the
// question and the selected state, and arrow keys move between options.
function YesNoQuestion({
  question,
  value,
  onChange,
  yesLabel,
  noLabel,
  error,
  errorText,
}: {
  question: string;
  value: YesNo;
  onChange: (v: "si" | "no") => void;
  yesLabel: string;
  noLabel: string;
  error?: boolean;
  errorText?: string;
}) {
  const id = useId();
  const options: { v: "si" | "no"; label: string; cls: string }[] = [
    { v: "si", label: yesLabel, cls: styles.segOptFirst },
    { v: "no", label: noLabel, cls: styles.segOptLast },
  ];

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const next = value === "si" ? "no" : "si";
      onChange(next);
      const group = e.currentTarget.parentElement;
      group?.querySelector<HTMLButtonElement>(`[data-v="${next}"]`)?.focus();
    }
  }

  return (
    <div className={styles.question}>
      <p id={`${id}-q`} className={styles.questionLabel}>
        {question}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-q`}
        aria-invalid={error || undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`${styles.seg} ${error ? styles.segError : ""}`}
        data-invalid={error ? "true" : undefined}
      >
        {options.map((o) => {
          const checked = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked || (value === null && o.v === "si") ? 0 : -1}
              data-v={o.v}
              onClick={() => onChange(o.v)}
              onKeyDown={onKeyDown}
              className={`${o.cls} ${checked ? styles.segOptActive : ""}`}
            >
              {o.v === "si" ? checked ? <CheckIcon /> : null : <CrossIcon />}
              {o.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={`${id}-err`} className={styles.fieldError}>
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
  optionalText,
  error,
  invalid,
  describedBy,
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  optionalText?: string;
  error?: string;
  /** Marks the field invalid when the message lives elsewhere (shared error). */
  invalid?: boolean;
  describedBy?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
        {optionalText ? <span className={styles.fieldOptional}> ({optionalText})</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        aria-invalid={error || invalid ? true : undefined}
        aria-describedby={error ? `${id}-err` : describedBy}
        data-invalid={error || invalid ? "true" : undefined}
      />
      {error ? (
        <p id={`${id}-err`} className={styles.fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type Companion = { id: number; firstName: string; lastName: string; kid: boolean; bus: YesNo; dietary: string };
type Errors = Record<string, string>;

// The form is a full-page, one-question-per-screen flow. Steps are derived
// from the current answers every render (not stored), so branching — e.g.
// skipping the bus/companion steps when the guest isn't attending — falls
// out naturally instead of needing manual step-list bookkeeping.
type Step =
  | { kind: "attendance" }
  | { kind: "info" }
  | { kind: "companionQuestion" }
  | { kind: "companionCount" }
  | { kind: "companionDetail"; companion: Companion; index: number };

// The flow reads as 3 named sections rather than a flat "step X of Y":
// 1. attendance (name and whether they come), 2. their information
// (intolerances, bus, contact — all on one screen), 3. their guests. A step
// belongs to exactly one section, in the same order the sections are
// shown, so the current step's section index also tells us which
// sections are already done vs. still upcoming.
function stepSection(step: Step): 0 | 1 | 2 {
  switch (step.kind) {
    case "attendance":
      return 0;
    case "info":
      return 1;
    default:
      return 2;
  }
}

function stepErrorKeys(step: Step): string[] {
  switch (step.kind) {
    case "attendance":
      return ["firstName", "lastName", "asiste"];
    case "info":
      return ["contact", "phone", "email"];
    case "companionDetail":
      return [`c${step.companion.id}-firstName`];
    default:
      return [];
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Phone numbers: digits only, optionally starting with "+" (spaces are just for readability).
const PHONE_RE = /^\+?\d{7,15}$/;
const phoneOnly = (v: string) => v.replace(/(?!^)\+/g, "").replace(/[^\d+\s]/g, "");

export default function RiberaRsvpForm({
  locale,
  showBus = true,
  askContact = true,
  showKidsMenu = true,
  siteSlug,
}: {
  locale?: Locale;
  /** Ask each guest whether they need the bus (the couple can turn this off). */
  showBus?: boolean;
  /** Ask for a phone and/or e-mail (the couple can turn this off). */
  askContact?: boolean;
  /** Offer the kids' menu for companions (the couple can turn this off). */
  showKidsMenu?: boolean;
  /** Set on a couple's published site: the answers are sent to the server. Previews just show the thanks screen. */
  siteSlug?: string;
}) {
  const dict = getDict(locale).ribera.form;
  const formRef = useRef<HTMLFormElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [asiste, setAsiste] = useState<YesNo>(null);
  const [bus, setBus] = useState<YesNo>(null);
  const [dietary, setDietary] = useState("");
  const [acompanante, setAcompanante] = useState<YesNo>(null);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [nextId, setNextId] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  // Resubmitting from this tab updates the same answer instead of adding another.
  const [clientRef] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2),
  );
  const [stepIndex, setStepIndex] = useState(0);
  // Errors for the current step only show after that step's first failed
  // "Siguiente" attempt, then recompute live so the message disappears as
  // soon as the guest fixes the field.
  const [stepTried, setStepTried] = useState(false);

  const attending = asiste === "si";

  function newCompanion(id: number): Companion {
    return { id, firstName: "", lastName: "", kid: false, bus: null, dietary: "" };
  }

  function setBringsCompanions(v: "si" | "no") {
    setAcompanante(v);
    if (v === "no") {
      setCompanions([]);
      return;
    }
    if (companions.length === 0) {
      setCompanions([newCompanion(nextId)]);
      setNextId(nextId + 1);
    }
  }

  function setCompanionCount(n: number) {
    if (n <= companions.length) {
      setCompanions(companions.slice(0, n));
      return;
    }
    const extra: Companion[] = [];
    let id = nextId;
    for (let i = companions.length; i < n; i++) extra.push(newCompanion(id++));
    setNextId(id);
    setCompanions([...companions, ...extra]);
  }

  function updateCompanion(id: number, patch: Partial<Companion>) {
    setCompanions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCompanion(id: number) {
    const next = companions.filter((c) => c.id !== id);
    setCompanions(next);
    if (next.length === 0) setAcompanante("no");
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!firstName.trim()) e.firstName = dict.errRequired;
    if (!lastName.trim()) e.lastName = dict.errRequired;
    if (!asiste) e.asiste = dict.errRequired;
    if (attending) {
      if (askContact) {
        if (!phone.trim() && !email.trim()) e.contact = dict.errContact;
        if (phone.trim() && !PHONE_RE.test(phone.replace(/\s/g, ""))) e.phone = dict.errPhone;
        if (email.trim() && !EMAIL_RE.test(email.trim())) e.email = dict.errEmail;
      }
      companions.forEach((c) => {
        if (!c.firstName.trim()) e[`c${c.id}-firstName`] = dict.errRequired;
      });
    }
    return e;
  }

  if (submitted) {
    const total = 1 + companions.length;
    return (
      <div className={styles.formThanks} role="status">
        <p className={styles.formThanksText}>{dict.thanks}</p>
        <p className={styles.formThanksSummary}>
          {attending ? dict.summaryAttending.replace("{n}", String(total)) : dict.summaryNotAttending}
        </p>
        <button type="button" className={styles.btnOutline} onClick={() => setSubmitted(false)}>
          {dict.edit}
        </button>
      </div>
    );
  }

  const steps: Step[] = [{ kind: "attendance" }];
  if (attending) {
    steps.push({ kind: "info" });
    steps.push({ kind: "companionQuestion" });
    if (acompanante === "si") {
      steps.push({ kind: "companionCount" });
      companions.forEach((c, i) => steps.push({ kind: "companionDetail", companion: c, index: i }));
    }
  }
  const stepIdx = Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[stepIdx];
  const isFirstStep = stepIdx === 0;
  // Until the guest has answered whether they come, the first screen is not the last one.
  const isLastStep = stepIdx === steps.length - 1 && asiste !== null;

  const sectionLabels = [dict.sectionAttendance, dict.legend, dict.sectionCompanions];
  // All three sections show up front; a "no" to attending drops the last two.
  const presentSections = asiste === "no" ? [0] : [0, 1, 2];
  const currentSection = stepSection(currentStep);

  const errors: Errors = stepTried ? validate() : {};
  const hasStepErrors = stepErrorKeys(currentStep).some((k) => errors[k]);

  function goBack() {
    setStepIndex(Math.max(0, stepIdx - 1));
    setStepTried(false);
  }

  async function sendAnswers() {
    setSending(true);
    setSendFailed(false);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: siteSlug,
          clientRef,
          locale,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: askContact ? phone.replace(/\s+/g, " ").trim() : "",
          email: askContact ? email.trim() : "",
          attending,
          bus: attending && showBus ? bus === "si" : null,
          dietary: dietary.trim(),
          companions: companions.map((c) => ({
            firstName: c.firstName.trim(),
            lastName: c.lastName.trim(),
            kid: showKidsMenu && c.kid,
            bus: showBus ? c.bus === "si" : null,
            dietary: c.dietary.trim(),
          })),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSubmitted(true);
    } catch {
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const e = validate();
    const stepHasError = stepErrorKeys(currentStep).some((k) => e[k]);
    if (stepHasError) {
      setStepTried(true);
      // Move focus to the invalid control so keyboard and screen-reader
      // users land right where the problem is.
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[data-invalid="true"]')?.focus();
      });
      return;
    }
    if (isLastStep) {
      if (!siteSlug) {
        // Preview or demo: nothing is stored.
        setSubmitted(true);
        return;
      }
      void sendAnswers();
      return;
    }
    setStepIndex(stepIdx + 1);
    setStepTried(false);
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.stepSections} role="list">
        {presentSections.map((section, i) => {
          const done = section < currentSection;
          const active = section === currentSection;
          return (
            <div
              key={section}
              role="listitem"
              aria-current={active ? "step" : undefined}
              className={`${styles.stepSection} ${done ? styles.stepSection_done : ""} ${active ? styles.stepSection_active : ""}`}
            >
              <div className={styles.stepSectionRow} aria-hidden="true">
                <span className={styles.stepSectionDot}>{done ? <CheckIcon /> : i + 1}</span>
              </div>
              <span className={styles.stepSectionLabel}>{sectionLabels[section]}</span>
            </div>
          );
        })}
      </div>

      {hasStepErrors ? (
        <p className={styles.formErrorSummary} role="alert">
          {dict.errSummary}
        </p>
      ) : null}
      {sendFailed ? (
        <p className={styles.formErrorSummary} role="alert">
          {dict.sendError}
        </p>
      ) : null}

      <div className={styles.stepBody}>
        {currentStep.kind === "attendance" ? (
          <fieldset className={styles.fieldset}>
            <legend className={styles.srOnly}>{dict.sectionAttendance}</legend>
            <div className={styles.formRow}>
              <TextField
                label={dict.firstName}
                name="firstName"
                value={firstName}
                onChange={setFirstName}
                autoComplete="given-name"
                required
                error={errors.firstName}
              />
              <TextField
                label={dict.lastName}
                name="lastName"
                value={lastName}
                onChange={setLastName}
                autoComplete="family-name"
                required
                error={errors.lastName}
              />
            </div>
            <YesNoQuestion
              question={dict.attendingQ}
              value={asiste}
              onChange={setAsiste}
              yesLabel={dict.attendingYes}
              noLabel={dict.attendingNo}
              error={Boolean(errors.asiste)}
              errorText={errors.asiste}
            />
          </fieldset>
        ) : null}

        {currentStep.kind === "info" ? (
          <fieldset className={styles.fieldset}>
            <legend className={styles.srOnly}>{dict.legend}</legend>
            <TextField
              label={dict.dietary}
              name="dietary"
              value={dietary}
              onChange={setDietary}
              optionalText={dict.optional}
            />
            {showBus ? (
              <YesNoQuestion
                question={dict.busQ}
                value={bus}
                onChange={setBus}
                yesLabel={dict.busYes}
                noLabel={dict.busNo}
              />
            ) : null}
            {askContact ? (
              <>
                <p id="ribera-contact-hint" className={errors.contact ? styles.fieldError : styles.fieldHint}>
                  {errors.contact ?? dict.contactHint}
                </p>
                <div className={styles.formRow}>
                  <TextField
                    label={dict.phone}
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(v) => setPhone(phoneOnly(v))}
                    autoComplete="tel"
                    error={errors.phone}
                    invalid={Boolean(errors.contact)}
                    describedBy="ribera-contact-hint"
                  />
                  <TextField
                    label={dict.email}
                    name="email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    error={errors.email}
                    invalid={Boolean(errors.contact)}
                    describedBy="ribera-contact-hint"
                  />
                </div>
              </>
            ) : null}
          </fieldset>
        ) : null}

        {currentStep.kind === "companionQuestion" ? (
          <YesNoQuestion
            question={dict.companionQ}
            value={acompanante}
            onChange={setBringsCompanions}
            yesLabel={dict.companionYes}
            noLabel={dict.companionNo}
          />
        ) : null}

        {currentStep.kind === "companionCount" ? (
          <div className={styles.companionsControl}>
            <p id="ribera-companions-count-label" className={styles.questionLabel}>
              {dict.howManyCompanions}
            </p>
            <div className={styles.stepper} role="group" aria-labelledby="ribera-companions-count-label">
              <button
                type="button"
                onClick={() => setCompanionCount(companions.length - 1)}
                disabled={companions.length <= 1}
                aria-label={dict.decreaseCompanions}
                className={styles.stepperBtn}
              >
                −
              </button>
              <span className={styles.stepperValue} aria-live="polite">
                {companions.length}
              </span>
              <button
                type="button"
                onClick={() => setCompanionCount(companions.length + 1)}
                disabled={companions.length >= 6}
                aria-label={dict.increaseCompanions}
                className={styles.stepperBtn}
              >
                +
              </button>
            </div>
          </div>
        ) : null}

        {currentStep.kind === "companionDetail" ? (
          <div
            role="group"
            aria-labelledby={`ribera-companion-${currentStep.companion.id}`}
            className={styles.companion}
          >
            <div className={styles.companionHead}>
              <p id={`ribera-companion-${currentStep.companion.id}`} className={styles.formLegend}>
                {dict.companionInfo} {currentStep.index + 1}
              </p>
              <button
                type="button"
                onClick={() => removeCompanion(currentStep.companion.id)}
                aria-label={`${dict.removeCompanion} ${currentStep.index + 1}`}
                className={styles.companionRemove}
              >
                <CrossIcon />
              </button>
            </div>
            <div className={styles.formRow}>
              <TextField
                label={dict.firstName}
                name={`companion-${currentStep.index}-firstName`}
                value={currentStep.companion.firstName}
                onChange={(v) => updateCompanion(currentStep.companion.id, { firstName: v })}
                required
                error={errors[`c${currentStep.companion.id}-firstName`]}
              />
              <TextField
                label={dict.lastName}
                name={`companion-${currentStep.index}-lastName`}
                value={currentStep.companion.lastName}
                onChange={(v) => updateCompanion(currentStep.companion.id, { lastName: v })}
              />
            </div>
            {showKidsMenu ? (
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={currentStep.companion.kid}
                  onChange={(e) => updateCompanion(currentStep.companion.id, { kid: e.target.checked })}
                />
                <span>{dict.kidsMenu}</span>
              </label>
            ) : null}
            {showBus ? (
              <YesNoQuestion
                question={dict.busQ}
                value={currentStep.companion.bus}
                onChange={(v) => updateCompanion(currentStep.companion.id, { bus: v })}
                yesLabel={dict.busYes}
                noLabel={dict.busNo}
              />
            ) : null}
            <TextField
              label={dict.dietary}
              name={`companion-${currentStep.index}-dietary`}
              value={currentStep.companion.dietary}
              onChange={(v) => updateCompanion(currentStep.companion.id, { dietary: v })}
              optionalText={dict.optional}
            />
          </div>
        ) : null}
      </div>

      <div className={styles.stepNav}>
        <button
          type="button"
          onClick={goBack}
          disabled={isFirstStep}
          tabIndex={isFirstStep ? -1 : 0}
          className={`${styles.btnOutline} ${isFirstStep ? styles.stepNavBackHidden : ""}`}
        >
          {dict.back}
        </button>
        <button type="submit" className={styles.formSubmit} disabled={sending}>
          {sending ? dict.sending : isLastStep ? dict.submit : dict.next}
        </button>
      </div>
    </form>
  );
}
