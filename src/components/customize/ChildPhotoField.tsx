"use client";

import { useState } from "react";
import { blobToDataUrl, resizeImageToJpeg } from "@/lib/resize-image";

// One of the two photos of the Rambla cover (each partner as a child). It shows a small thumbnail, picks a file,
// shrinks it (it is shown in a frame about 150 px wide, so 640 px is plenty and keeps the draft light) and keeps
// it as a data URL on the draft.
export default function ChildPhotoField({
  label,
  value,
  onChange,
  chooseLabel,
  changeLabel,
  removeLabel,
  unreadableLabel,
}: {
  label: string;
  value?: string;
  onChange: (photo: string | undefined) => void;
  chooseLabel: string;
  changeLabel: string;
  removeLabel: string;
  unreadableLabel: string;
}) {
  const [failed, setFailed] = useState(false);

  async function choose(file: File) {
    setFailed(false);
    try {
      onChange(await blobToDataUrl(await resizeImageToJpeg(file, 640)));
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : null}
        <label className="cursor-pointer rounded-lg border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink transition-colors hover:border-clay">
          {value ? changeLabel : chooseLabel}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void choose(file);
            }}
          />
        </label>
        {value ? (
          <button type="button" onClick={() => onChange(undefined)} className="cursor-pointer text-sm text-ink-soft underline underline-offset-2 hover:text-ink">
            {removeLabel}
          </button>
        ) : null}
      </div>
      {failed ? (
        <span role="alert" className="text-xs text-clay-dark">
          {unreadableLabel}
        </span>
      ) : null}
    </div>
  );
}
