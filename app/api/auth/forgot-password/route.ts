import { NextResponse } from "next/server";
import { forgotPasswordInputSchema } from "@/lib/utils/authValidators";
import { issuePasswordResetCode } from "@/lib/services/authService";
import { sendVerificationEmail } from "@/lib/services/emailService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = forgotPasswordInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await issuePasswordResetCode(parsed.data);

    if (result) {
      // 发送重置密码验证码（当前实现为控制台输出）
      await sendVerificationEmail(result.email, result.code);
    }

    // 为避免泄露用户是否存在，即使邮箱不存在也返回成功
    return NextResponse.json(
      {
        code: "OK",
        message: "如果该邮箱已注册，我们会发送一封包含激活码的邮件，请按邮件提示重置密码。",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "发送重置邮件失败，请稍后重试" },
      { status: 500 },
    );
  }
}


