import { prisma } from "@/lib/prisma";

/**
 * Serves an uploaded product photo. Callers append `?v=<updatedAt>` so the
 * response can be cached hard while a re-upload still busts it.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/charger-image/[id]">,
) {
  const { id } = await context.params;

  const image = await prisma.chargerImage.findUnique({
    where: { chargerId: id },
    select: { data: true, mimeType: true, updatedAt: true },
  });

  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: `"${id}-${image.updatedAt.getTime()}"`,
    },
  });
}
