import { z } from "zod";

export const registerInputSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z
    .string()
    .min(6, "密码至少 6 位")
    .max(100, "密码不能超过 100 位"),
  name: z.string().min(1, "昵称不能为空").max(50, "昵称不能超过 50 个字符").optional(),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空"),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const forgotPasswordInputSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const resetPasswordInputSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  code: z.string().min(1, "激活码不能为空"),
  newPassword: z
    .string()
    .min(6, "新密码至少 6 位")
    .max(100, "新密码不能超过 100 位"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;


