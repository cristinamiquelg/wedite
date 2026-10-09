"use client";

import { useEffect, useRef, useState } from "react";

const TYPING_MS_PER_CHAR = 75;
const CARET_LINGER_MS = 1600;

/**
 * Types its text out character by character, as if being written live, the
 * first time it scrolls into view. The full text is always in the layout
 * (invisible) so nothing shifts while it types, and screen readers get the
 * whole phrase straight away. With reduced motion it simply shows the text.
 */
export default function Typewriter({
  text,
  italicFrom,
  className,
}: {
  text: string;
  /** Index where the text switches to italics (everything before it is regular). */
  italicFrom?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [typed, setTyped] = useState(0);
  const [started, setStarted] = useState(false);
  const [caretGone, setCaretGone] = useState(false);

  // Wait until the phrase is actually on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setTyped(text.length);
          setCaretGone(true);
        } else {
          setStarted(true);
        }
      },
      { threshold: 0.9 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    let caretTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= text.length) {
        clearInterval(timer);
        caretTimer = setTimeout(() => setCaretGone(true), CARET_LINGER_MS);
      }
    }, TYPING_MS_PER_CHAR);
    return () => {
      clearInterval(timer);
      if (caretTimer) clearTimeout(caretTimer);
    };
  }, [started, text]);

  // Regular + italic parts of any slice of the text.
  const parts = (slice: string) =>
    italicFrom === undefined ? (
      slice
    ) : (
      <>
        {slice.slice(0, italicFrom)}
        {slice.length > italicFrom ? <em className="italic">{slice.slice(italicFrom)}</em> : null}
      </>
    );

  return (
    <span ref={ref} className={`relative inline-block ${className ?? ""}`} aria-label={text}>
      {/* Reserves the final width and height, so the heading doesn't reflow while typing. */}
      <span aria-hidden="true" className="invisible">
        {parts(text)}
      </span>
      <span aria-hidden="true" className="absolute inset-0 text-left">
        {parts(text.slice(0, typed))}
        {!caretGone ? <span className="typewriter-caret" /> : null}
      </span>
    </span>
  );
}
