import { z } from 'zod';

export const PostSchema = z.object({
  content: z.string()
    .min(1, 'Post content cannot be empty')
    .max(280, 'Post content exceeds the maximum limit of 280 characters.'),
  imageUrl: z.string().url().optional().nullable(),
});

export const ProfileSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric and underscores only"),
  bio: z.string().max(160, "Bio cannot exceed 160 characters").optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal('')),
  location: z.string().max(50, "Location cannot exceed 50 characters").optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Image upload strict server validation
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function validateImage(file: File): { success: true } | { success: false, error: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "Image size must be less than 2MB." };
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: "Only .jpg, .jpeg, .png and .webp formats are supported." };
  }
  return { success: true };
}

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});
