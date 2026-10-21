"use client";

import { useEffect, useState } from "react";
import { getDict, type Locale } from "@/lib/i18n";
import { plain } from "./plain";
import { rv } from "./reveal";
import styles from "./rambla.module.css";

function getRemaining(target: string) {
  // "2027-09-11" alone is parsed as UTC midnight; anchor it to local time so the
  // countdown matches the guest's calendar day.
  const at = /^\d{4}-\d{2}-\d{2}$/.test(target) ? `${target}T00:00:00` : target;
  const diff = new Date(at).getTime() - Date.now();
  const clamped = Math.max(diff, 0);
  return {
    days: Math.floor(clamped / (1000 * 60 * 60 * 24)),
    hours: Math.floor((clamped / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((clamped / (1000 * 60)) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
    isPast: diff <= 0,
  };
}

// The live countdown of the Rambla "save the date": four hand-lettered numbers split by thin rules.
export default function RamblaCountdown({ date, locale }: { date: string; locale?: Locale }) {
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | null>(null);
  const dict = getDict(locale);

  useEffect(() => {
    if (!date) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first tick must run immediately, not a second after mount
    setRemaining(getRemaining(date));
    const id = setInterval(() => setRemaining(getRemaining(date)), 1000);
    return () => clearInterval(id);
  }, [date]);

  if (!date || !remaining) return null;

  if (remaining.isPast) {
    return <p className={`${styles.script} ${styles.stdLabel}`}>{plain(dict.countdown.alreadyCelebrated)}</p>;
  }

  const units: [string, string][] = [
    [String(remaining.days), dict.countdown.days],
    [String(remaining.hours).padStart(2, "0"), dict.countdown.hours],
    [String(remaining.minutes).padStart(2, "0"), dict.countdown.minutes],
    [String(remaining.seconds).padStart(2, "0"), dict.countdown.seconds],
  ];

  return (
    <div className={styles.countdown} role="timer" aria-live="off">
      {units.map(([value, label], i) => (
        <div key={label} className={styles.unit} {...rv(i)}>
          <span className={styles.unitNum}>{value}</span>
          <span className={styles.unitLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}
