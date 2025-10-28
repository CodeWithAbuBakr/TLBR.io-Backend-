import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 char'),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 char"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 char"),
});