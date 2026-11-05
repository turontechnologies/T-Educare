import { z } from "zod";

export const studentLoginSchema = z.object({
  matricNo: z
    .string()
    .min(1, "Enter your matric number")
    .max(64, "Matric number is too long"),
  password: z.string().min(1, "Enter your password"),
});

export type StudentLoginFormValues = z.infer<typeof studentLoginSchema>;
