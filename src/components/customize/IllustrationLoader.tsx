// Shown in place of the photo thumbnail while the illustration is being
// drawn (it can take up to a minute): a pen sketching a flourish, over a
// soft shimmer. Purely decorative; the status text next to it carries the
// meaning. With reduced motion it shows the finished flourish, still.
export default function IllustrationLoader() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-sage-light"
    >
      <span className="illustration-loader-shimmer absolute inset-0" />
      <svg viewBox="0 0 48 48" className="relative h-14 w-14 text-clay" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* A heart-and-loop flourish, drawn stroke by stroke. */}
        <path
          className="illustration-loader-line"
          pathLength={1}
          d="M24 38C12 30 8 23 11 17.5C13.5 13 19.5 13 24 18C28.5 13 34.5 13 37 17.5C40 23 36 30 24 38Z"
        />
        <path
          className="illustration-loader-line illustration-loader-line-late"
          pathLength={1}
          d="M6 42C14 40 18 44 24 42S36 40 42 42"
        />
      </svg>
    </span>
  );
}
