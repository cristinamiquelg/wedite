"use client";

import { useMemo, useState } from "react";
import Dropdown from "@/components/site/Dropdown";
import type { PersonRow } from "@/lib/responses-people";

export type TableCopy = {
  filters: { all: string; yes: string; no: string; bus: string; diet: string };
  sortLabel: string;
  sorts: { recent: string; oldest: string; first: string; last: string };
  cols: { guest: string; attends: string; bus: string; diet: string; contact: string; date: string };
  yes: string;
  no: string;
  kid: string;
  with: string;
  empty: string;
  noMatches: string;
};

type Filter = "all" | "yes" | "no" | "bus" | "diet";
type Sort = "recent" | "oldest" | "first" | "last";

function when(iso: string, locale: "es" | "en"): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  })
    .format(new Date(iso))
    .replace(/\./g, "");
}

function Tag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ok ? "bg-sage-light text-sage" : "bg-line text-ink-soft"}`}>
      {label}
    </span>
  );
}

export default function ResponsesTable({ rows, locale, copy }: { rows: PersonRow[]; locale: "es" | "en"; copy: TableCopy }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");

  const counts = useMemo(
    () => ({
      all: rows.length,
      yes: rows.filter((r) => r.attending).length,
      no: rows.filter((r) => !r.attending).length,
      bus: rows.filter((r) => r.bus === true).length,
      diet: rows.filter((r) => r.dietary.trim() !== "").length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const filtered = rows.filter((r) => {
      switch (filter) {
        case "yes":
          return r.attending;
        case "no":
          return !r.attending;
        case "bus":
          return r.bus === true;
        case "diet":
          return r.dietary.trim() !== "";
        default:
          return true;
      }
    });
    const byName = (a: string, b: string) => a.localeCompare(b, locale, { sensitivity: "base" });
    return [...filtered].sort((a, b) => {
      if (sort === "recent") return a.group - b.group || a.order - b.order;
      if (sort === "oldest") return b.group - a.group || a.order - b.order;
      if (sort === "first") return byName(a.firstName, b.firstName) || byName(a.lastName, b.lastName);
      return byName(a.lastName, b.lastName) || byName(a.firstName, b.firstName);
    });
  }, [rows, filter, sort, locale]);

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: copy.filters.all },
    { id: "yes", label: copy.filters.yes },
    { id: "no", label: copy.filters.no },
    { id: "bus", label: copy.filters.bus },
    { id: "diet", label: copy.filters.diet },
  ];

  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                filter === c.id ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink-soft hover:text-ink"
              }`}
            >
              {c.label} <span className={filter === c.id ? "text-paper/70" : "text-ink-soft"}>{counts[c.id]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <span>{copy.sortLabel}</span>
          <Dropdown
            value={sort}
            onChange={setSort}
            ariaLabel={copy.sortLabel}
            options={[
              { value: "recent", label: copy.sorts.recent },
              { value: "oldest", label: copy.sorts.oldest },
              { value: "first", label: copy.sorts.first },
              { value: "last", label: copy.sorts.last },
            ]}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">{copy.empty}</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">{copy.noMatches}</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-ink-soft">
              <tr>
                <th className="pb-2 pr-4 font-normal">{copy.cols.guest}</th>
                <th className="pb-2 pr-4 font-normal">{copy.cols.attends}</th>
                <th className="pb-2 pr-4 font-normal">{copy.cols.bus}</th>
                <th className="pb-2 pr-4 font-normal">{copy.cols.diet}</th>
                <th className="pb-2 pr-4 font-normal">{copy.cols.contact}</th>
                <th className="pb-2 font-normal">{copy.cols.date}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.key} className="border-t border-line align-top">
                  <td className="py-3 pr-4">
                    <p className="font-medium">
                      {r.firstName} {r.lastName}
                      {r.kid ? <span className="ml-2 rounded-full bg-line px-2 py-0.5 text-xs font-normal text-ink-soft">{copy.kid}</span> : null}
                    </p>
                    {r.withName ? (
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {copy.with} {r.withName}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    <Tag ok={r.attending} label={r.attending ? copy.yes : copy.no} />
                  </td>
                  <td className="py-3 pr-4">{r.attending && r.bus !== null ? (r.bus ? copy.yes : copy.no) : "–"}</td>
                  <td className="max-w-[16rem] py-3 pr-4 text-ink-soft">{r.dietary || "–"}</td>
                  <td className="py-3 pr-4 text-ink-soft">
                    {r.phone ? <p>{r.phone}</p> : null}
                    {r.email ? <p className="break-all">{r.email}</p> : null}
                    {!r.phone && !r.email ? "–" : null}
                  </td>
                  <td className="whitespace-nowrap py-3 text-ink-soft">{when(r.receivedAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
