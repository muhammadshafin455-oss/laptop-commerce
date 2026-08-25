/** Product photos are uploaded from the admin's machine, not linked by URL. */

// Vercel caps a serverless request body at 4.5MB, so anything larger would be
// rejected by the platform before the action ever runs. Kept under that.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const IMAGE_ACCEPT_ATTRIBUTE = ALLOWED_IMAGE_TYPES.join(",");

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Prisma's `Bytes` maps to `Uint8Array<ArrayBuffer>` specifically — a plain
// `Uint8Array` (i.e. `ArrayBufferLike`) is not assignable to it.
export type ImageUpload = { mimeType: string; data: Uint8Array<ArrayBuffer> };

export type ImageUploadResult =
  | { kind: "none" }
  | { kind: "error"; message: string }
  | { kind: "image"; image: ImageUpload };

/**
 * Reads a file field out of a Server Action's FormData. An empty file input
 * submits a zero-byte File rather than nothing, which is why size is checked
 * before anything else.
 */
export async function readImageUpload(
  value: FormDataEntryValue | null,
): Promise<ImageUploadResult> {
  if (!value || typeof value === "string") return { kind: "none" };

  const file = value as File;
  if (file.size === 0) return { kind: "none" };

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      kind: "error",
      message: "Choose a JPEG, PNG, WebP, GIF or AVIF image.",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      kind: "error",
      message: `That image is ${formatBytes(file.size)}. Keep it under ${formatBytes(MAX_IMAGE_BYTES)}.`,
    };
  }

  return {
    kind: "image",
    image: {
      mimeType: file.type,
      data: new Uint8Array(await file.arrayBuffer()),
    },
  };
}
