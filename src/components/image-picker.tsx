"use client";

import { ImagePlus, Plug, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import {
  IMAGE_ACCEPT_ATTRIBUTE,
  MAX_IMAGE_BYTES,
  formatBytes,
} from "@/lib/images";

export function ImagePicker({
  currentSrc,
  error,
}: {
  currentSrc?: string | null;
  error?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);

  // Object URLs hold a reference to the file until they are revoked.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const shown = preview ?? (remove ? null : (currentSrc ?? null));

  return (
    <div>
      <span className="text-sm font-medium text-ink">Photo</span>

      <div className="mt-1.5 flex flex-wrap items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas">
          {shown ? (
            // Either a blob: preview or our own /api/charger-image route.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <Plug className="h-7 w-7 text-subtle" strokeWidth={1.5} />
          )}
        </div>

        <div className="min-w-48 flex-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">
            {shown ? (
              <Upload className="h-4 w-4" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {shown ? "Choose a different photo" : "Choose a photo"}
            <input
              type="file"
              name="imageFile"
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (preview) URL.revokeObjectURL(preview);
                setPreview(file ? URL.createObjectURL(file) : null);
                setFileName(file?.name ?? null);
                if (file) setRemove(false);
              }}
            />
          </label>

          <p className="mt-2 text-xs text-muted">
            {fileName ? (
              <span className="font-medium text-ink">{fileName}</span>
            ) : (
              `JPEG, PNG, WebP, GIF or AVIF · up to ${formatBytes(MAX_IMAGE_BYTES)}`
            )}
          </p>

          {currentSrc && !preview ? (
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-muted transition-colors hover:text-danger">
              <input
                type="checkbox"
                name="removeImage"
                checked={remove}
                onChange={(event) => setRemove(event.target.checked)}
                className="h-4 w-4 accent-[#dc2626]"
              />
              <Trash2 className="h-4 w-4" />
              Remove the current photo
            </label>
          ) : null}
        </div>
      </div>

      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span>
      ) : null}
    </div>
  );
}
