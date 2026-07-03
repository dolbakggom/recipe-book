const localUploadPathPattern =
  /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$/;

const vercelBlobUrlPattern =
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/uploads\/.+\.(jpg|jpeg|png|webp|gif)$/i;

export const coverImageErrorMessage =
  "Cover image must be a saved upload URL";

export function isSavedCoverImageUrl(value: string | null | undefined) {
  if (!value) {
    return true;
  }

  return localUploadPathPattern.test(value) || vercelBlobUrlPattern.test(value);
}
