import TranslationReview from "@/components/customize/TranslationReview";
import { MAX_LENGTH } from "@/lib/translatable";
import { useEffect, useState } from "react";
import { emptyWeddingData, type WeddingData } from "@/lib/wedding-types";
import { blobToDataUrl, resizeImageToJpeg } from "@/lib/resize-image";
import { Field, TextArea, TextInput } from "@/components/customize/fields";
import IllustrationLoader from "@/components/customize/IllustrationLoader";
import { useReportBusy } from "@/components/customize/busy";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

const HASHTAG_MAX_LENGTH = 30;

// A hashtag is one run of text with no spaces, always led by "#". The field
// shows the "#" from the start and it can't be deleted; an empty body is
// stored as "" so the template doesn't render a lone "#".
function sanitizeHashtag(raw: string): string {
  const body = raw.replace(/[\s#]/g, "");
  return body ? `#${body}` : "";
}

// Drawing an illustration costs real money, so it is deliberate and capped: the photo is chosen first,
// the drawing starts only when asked, the result is shown before it is added, and each web has a few tries.
const MAX_ATTEMPTS = 3;
const ATTEMPTS_KEY = "wedite:illustration-uses";
// The same photo again gives the same drawing back at no cost (and uses no attempt).
const cache = new Map<string, string>();

function readUses(): number {
  try {
    return Math.min(MAX_ATTEMPTS, Number(window.sessionStorage.getItem(ATTEMPTS_KEY)) || 0);
  } catch {
    return 0;
  }
}

async function fingerprint(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

type Phase =
  | { kind: "idle" }
  /** A photo is chosen and waits for the "create" click. */
  | { kind: "picked"; photo: Blob; thumb: string }
  | { kind: "drawing"; photo: Blob; thumb: string }
  /** The drawing is made and shown; nothing is added to the site until the couple accepts it. */
  | { kind: "review"; photo: Blob; thumb: string; image: string }
  | { kind: "failed"; photo: Blob; thumb: string; reason: "error" | "busy" };

export default function StepStory({
  data,
  onChange,
}: {
  data: WeddingData;
  onChange: (patch: Partial<WeddingData>) => void;
}) {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale).wizard.stepStory;
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [uses, setUses] = useState(0);
  const [pickFailed, setPickFailed] = useState(false);
  const left = MAX_ATTEMPTS - uses;

  // The wizard can't move on while the drawing is being made.
  useReportBusy("illustration", phase.kind === "drawing");

  useEffect(() => {
    // sessionStorage is only readable after mount (reading it while rendering would desync the server markup)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUses(readUses());
  }, []);

  async function choose(file: File) {
    setPickFailed(false);
    try {
      const photo = await resizeImageToJpeg(file);
      setPhase({ kind: "picked", photo, thumb: await blobToDataUrl(photo) });
    } catch {
      setPickFailed(true);
    }
  }

  async function draw(photo: Blob, thumb: string) {
    setPhase({ kind: "drawing", photo, thumb });
    let key = "";
    try {
      key = await fingerprint(photo);
      const known = cache.get(key);
      if (known) {
        setPhase({ kind: "review", photo, thumb, image: known });
        return;
      }
      const form = new FormData();
      form.append("image", photo, "photo.jpg");
      const res = await fetch("/api/story-illustration", { method: "POST", body: form });
      if (res.status === 429) {
        setPhase({ kind: "failed", photo, thumb, reason: "busy" });
        return;
      }
      if (!res.ok) throw new Error(`illustration failed: ${res.status}`);
      const { image } = (await res.json()) as { image?: string };
      if (!image) throw new Error("no image in response");
      cache.set(key, image);
      // Only a drawing that was really made uses an attempt.
      const next = Math.min(MAX_ATTEMPTS, readUses() + 1);
      try {
        window.sessionStorage.setItem(ATTEMPTS_KEY, String(next));
      } catch {
        // storage unavailable: the cap just doesn't persist
      }
      setUses(next);
      setPhase({ kind: "review", photo, thumb, image });
    } catch {
      setPhase({ kind: "failed", photo, thumb, reason: "error" });
    }
  }

  const accept = (image: string) => {
    onChange({ storyImage: image, storyImageKind: "illustration" });
    setPhase({ kind: "idle" });
  };
  const keepOriginalPhoto = (thumb: string) => {
    onChange({ storyImage: thumb, storyImageKind: undefined });
    setPhase({ kind: "idle" });
  };

  const btn = "cursor-pointer rounded-lg border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink transition-colors hover:border-clay disabled:pointer-events-none disabled:opacity-50";
  const btnPrimary = "cursor-pointer rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40";
  const link = "cursor-pointer text-sm text-ink-soft underline underline-offset-2 hover:text-ink disabled:pointer-events-none disabled:opacity-50";

  return (
    <div className="flex flex-col gap-5">
      <Field label={dict.sectionTitle}>
        <TextInput
          value={data.storyTitle}
          onChange={(e) => onChange({ storyTitle: e.target.value })}
          placeholder={dict.sectionTitlePlaceholder}
          maxLength={MAX_LENGTH.storyTitle}
        />
      </Field>
      <TranslationReview
        fields={[
          {
            label: dict.sectionTitle,
            // Untouched, the title is each language's own default and needs no translation.
            text: data.storyTitle === emptyWeddingData.storyTitle ? "" : data.storyTitle,
            maxLength: MAX_LENGTH.storyTitle,
          },
        ]}
      />
      <Field label={dict.yourStory}>
        <TextArea
          rows={10}
          value={data.story}
          onChange={(e) => onChange({ story: e.target.value })}
          placeholder={dict.yourStoryPlaceholder}
          maxLength={MAX_LENGTH.story}
        />
      </Field>
      <TranslationReview
        fields={[{ label: dict.yourStory, text: data.story, maxLength: MAX_LENGTH.story, multiline: true }]}
      />

      <Field label={dict.storyImage} asDiv>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-ink-soft">{dict.storyImageHelp}</p>

          {phase.kind === "idle" ? (
            <div className="flex items-center gap-4">
              {data.storyImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.storyImage}
                  alt=""
                  className={`h-16 w-16 rounded-lg ${
                    data.storyImageKind === "illustration" ? "bg-paper object-contain" : "object-cover"
                  }`}
                />
              ) : null}
              <label className={btn}>
                {data.storyImage ? dict.storyImageChange : dict.storyImageChoose}
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
              {data.storyImage ? (
                <button type="button" onClick={() => onChange({ storyImage: undefined, storyImageKind: undefined })} className={link}>
                  {dict.storyImageRemove}
                </button>
              ) : null}
            </div>
          ) : null}
          {pickFailed ? (
            <p role="alert" className="text-sm text-clay-dark">
              {dict.storyImageUnreadable}
            </p>
          ) : null}

          {phase.kind === "picked" || phase.kind === "failed" ? (
            <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={phase.thumb} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                <div className="flex flex-col gap-2">
                  {phase.kind === "picked" ? (
                    <>
                      <button type="button" disabled={left <= 0} onClick={() => void draw(phase.photo, phase.thumb)} className={btnPrimary}>
                        {dict.storyImageCreate}
                      </button>
                      <span className="text-xs text-ink-soft">{left > 0 ? dict.storyImageAttempts(left, MAX_ATTEMPTS) : dict.storyImageNoAttempts}</span>
                    </>
                  ) : (
                    <p role="alert" className="text-sm text-clay-dark">
                      {phase.reason === "busy" ? dict.storyImageBusy : dict.storyImageFailed}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {phase.kind === "failed" && left > 0 && phase.reason === "error" ? (
                  <button type="button" onClick={() => void draw(phase.photo, phase.thumb)} className={btnPrimary}>
                    {dict.storyImageRetry}
                  </button>
                ) : null}
                <button type="button" onClick={() => keepOriginalPhoto(phase.thumb)} className={link}>
                  {dict.storyImageUseOriginal}
                </button>
                <label className={`${link} inline-block`}>
                  {dict.storyImageChooseOther}
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
                <button type="button" onClick={() => setPhase({ kind: "idle" })} className={link}>
                  {dict.storyImageCancel}
                </button>
              </div>
            </div>
          ) : null}

          {phase.kind === "drawing" ? (
            <div className="flex items-center gap-4 rounded-lg border border-line p-4">
              <IllustrationLoader />
              <p role="status" className="text-sm text-ink-soft">
                {dict.storyImageDrawing}
              </p>
            </div>
          ) : null}

          {phase.kind === "review" ? (
            <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
              <p className="text-sm font-medium text-ink">{dict.storyImagePreviewTitle}</p>
              {/* On the cream of the template, which is where it will be shown. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={phase.image} alt="" className="mx-auto w-full max-w-xs rounded-lg" style={{ background: "#efece3" }} />
              <p className="text-xs text-ink-soft">{dict.storyImagePreviewHint}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button type="button" onClick={() => accept(phase.image)} className={btnPrimary}>
                  {dict.storyImageAccept}
                </button>
                <button type="button" disabled={left <= 0} onClick={() => void draw(phase.photo, phase.thumb)} className={link}>
                  {left > 0 ? `${dict.storyImageAnother} · ${dict.storyImageAttempts(left, MAX_ATTEMPTS)}` : dict.storyImageNoAttempts}
                </button>
                <button type="button" onClick={() => setPhase({ kind: "idle" })} className={link}>
                  {dict.storyImageDiscard}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Field>

      <Field label={dict.hashtag}>
        <TextInput
          value={data.hashtag || "#"}
          onChange={(e) => onChange({ hashtag: sanitizeHashtag(e.target.value) })}
          maxLength={HASHTAG_MAX_LENGTH}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </Field>
    </div>
  );
}
