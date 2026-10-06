export function Field({
  label,
  hint,
  required = false,
  requiredLabel = "Obligatorio",
  asDiv = false,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  requiredLabel?: string;
  /** Render a <div> instead of a <label>, for controls that aren't a single native input (e.g. the date picker's popover). */
  asDiv?: boolean;
  /** Shown under the control in place of the hint, e.g. when a required field is left empty. */
  error?: string;
  children: React.ReactNode;
}) {
  const Wrapper = asDiv ? "div" : "label";
  return (
    <Wrapper className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2 text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="rounded-full bg-clay/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-clay">
            {requiredLabel}
          </span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span role="alert" className="text-xs text-clay-dark">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-ink-soft">{hint}</span>
      ) : null}
    </Wrapper>
  );
}

const baseInputClass =
  "rounded-lg border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-clay aria-[invalid=true]:border-clay-dark";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${baseInputClass} ${props.className ?? ""}`} />;
}

const selectClass =
  "w-full appearance-none rounded-lg border border-line bg-paper-raised py-2.5 pl-3.5 pr-10 text-sm text-ink outline-none transition-colors focus:border-clay";

// A plain <select> renders its own dropdown arrow, and browsers don't
// reliably respect padding-right when positioning it — it can end up
// nearly flush with the edge. appearance-none drops that native arrow so
// this chevron (and its padding) is the only one, with room to breathe.
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <select {...props} className={selectClass}>
        {children}
      </select>
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
      >
        <path
          d="M5 7.5 10 12.5 15 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
