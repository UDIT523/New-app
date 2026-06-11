import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    username: z
      .string()
      .min(3, "At least 3 characters")
      .regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, . _ - only"),
    password: z.string().min(4, "Use at least 4 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export const groupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required"),
});

export const itemSchema = z.object({
  groupId: z.string().min(1, "Group is required"),
  name: z.string().trim().min(1, "Item name is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  reorder: z.coerce.number().min(0, "Cannot be negative"),
});
