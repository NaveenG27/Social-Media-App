import { AppError } from '@/lib/errors';

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Validates an uploaded image file strictly for production limits.
 * Throws AppError upon validation failure.
 */
export function validateImage(file: File): void {
  if (!file || typeof file.size !== 'number') {
    throw new AppError("Invalid or missing file uploaded.", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new AppError("Image size must be strictly less than 2MB.", 400);
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new AppError("Only JPEG and PNG formats are allowed. WebP, GIF, and SVG are explicitly rejected.", 400);
  }
}
