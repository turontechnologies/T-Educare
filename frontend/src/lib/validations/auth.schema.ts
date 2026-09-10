import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Enter your username")
    .max(64, "Username is too long"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
