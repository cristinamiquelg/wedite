import { useState } from "react";
import type { WeddingData } from "@/lib/wedding-types";
import { blobToDataUrl, resizeImageToJpeg } from "@/lib/resize-image";
import { Field, TextArea, TextInput } from "@/components/customize/fields";
import IllustrationLoader from "@/components/customize/IllustrationLoader";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

const TITLE_MAX_LENGTH = 50;
const STORY_MAX_LENGTH = 600;
const HASHTAG_MAX_LENGTH = 30;

// A hashtag is one run of text with no spaces, always led by "#". The field
// shows the "#" from the start and it can't be deleted; an empty body is
// stored as "" so the template doesn't render a lone "#".
function sanitizeHashtag(raw: string): string {
  const body = raw.replace(/[\s#]/g, "");
  return body ? `#${body}` : "";
}

export default function StepStory({
  data,
  onChange,
}: {
  data: WeddingData;
  onChange: (patch: Partial<WeddingData>) => void;
}) {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale).wizard.stepStory;
  const [drawing, setDrawing] = useState(false);
  const [failed, setFailed] = useState(false);

  // The couple's photo is never shown as-is: it goes to the server, which
  // has OpenAI redraw it as a coral line illustration, and that drawing is
  // what the template publishes. If anything goes wrong we fall back to the
  // (resized) photo itself rather than leaving the section empty.
  async function illustrate(file: File) {
    setFailed(false);
    setDrawing(true);
    let photo: Blob | null = null;
    try {
      photo = await resizeImageToJpeg(file);
      const form = new FormData();
      form.append("image", photo, "photo.jpg");
      const res = await fetch("/api/story-illustration", { method: "POST", body: form });
      if (!res.ok) throw new Error(`illustration failed: ${res.status}`);
      const { image } = (await res.json()) as { image?: string };
      if (!image) throw new Error("no image in response");
      onChange({ storyImage: image, storyImageKind: "illustration" });
    } catch {
      setFailed(true);
      try {
        const fallback = await blobToDataUrl(photo ?? file);
        onChange({ storyImage: fallback, storyImageKind: undefined });
      } catch {
        // can't even read the file — leave the section as it was
      }
    } finally {
      setDrawing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Field label={dict.sectionTitle}>
        <TextInput
          value={data.storyTitle}
          onChange={(e) => onChange({ storyTitle: e.target.value })}
          placeholder={dict.sectionTitlePlaceholder}
          maxLength={TITLE_MAX_LENGTH}
        />
      </Field>
      <Field label={dict.yourStory}>
        <TextArea
          rows={10}
          value={data.story}
          onChange={(e) => onChange({ story: e.target.value })}
          placeholder={dict.yourStoryPlaceholder}
          maxLength={STORY_MAX_LENGTH}
        />
      </Field>
      <Field label={dict.storyImage}>
        <div className="flex items-center gap-4">
          {drawing ? (
            <IllustrationLoader />
          ) : data.storyImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.storyImage}
              alt=""
              className={`h-16 w-16 rounded-lg ${
                data.storyImageKind === "illustration" ? "bg-paper object-contain" : "object-cover"
              }`}
            />
          ) : null}
          <label
            className={`rounded-lg border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink transition-colors ${
              drawing ? "pointer-events-none opacity-50" : "cursor-pointer hover:border-clay"
            }`}
          >
            {dict.storyImageChoose}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={drawing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void illustrate(file);
              }}
            />
          </label>
          {data.storyImage && !drawing ? (
            <button
              type="button"
              onClick={() => {
                setFailed(false);
                onChange({ storyImage: undefined, storyImageKind: undefined });
              }}
              className="text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
            >
              {dict.storyImageRemove}
            </button>
          ) : null}
        </div>
        {drawing ? (
          <p role="status" className="mt-2 text-sm text-ink-soft">
            {dict.storyImageDrawing}
          </p>
        ) : null}
        {failed && !drawing ? (
          <p role="alert" className="mt-2 text-sm text-clay-dark">
            {dict.storyImageFallback}
          </p>
        ) : null}
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
