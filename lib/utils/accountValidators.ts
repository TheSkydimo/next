import { z } from "zod";

export const updateProfileInputSchema = z.object({
  name: z
    .string()
    .min(1, "昵称不能为空")
    .max(50, "昵称不能超过 50 个字符")
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1, "当前密码不能为空"),
  newPassword: z
    .string()
    .min(6, "新密码至少 6 位")
    .max(100, "新密码不能超过 100 位"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const requestEmailChangeInputSchema = z.object({
  newEmail: z.string().email("新邮箱格式不正确"),
  currentPassword: z.string().min(1, "当前密码不能为空"),
});

export type RequestEmailChangeInput = z.infer<
  typeof requestEmailChangeInputSchema
>;

export const confirmEmailChangeInputSchema = z.object({
  newEmail: z.string().email("新邮箱格式不正确"),
  code: z.string().min(1, "验证码不能为空"),
});

export type ConfirmEmailChangeInput = z.infer<
  typeof confirmEmailChangeInputSchema
>;


