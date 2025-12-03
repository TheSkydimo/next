import { NextResponse } from "next/server";
import { forgotPasswordInputSchema } from "@/lib/utils/authValidators";
import { issueAdminPasswordResetCode } from "@/lib/services/authService";
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

    try {
      const result = await issueAdminPasswordResetCode(parsed.data);

      await sendVerificationEmail(result.email, result.code);

      return NextResponse.json(
        {
          code: "OK",
          message:
            "如果该邮箱为管理员账号，我们会发送一封包含激活码的邮件，请按邮件提示重置密码。",
        },
        { status: 200 },
      );
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_ADMIN_USER") {
        return NextResponse.json(
          {
            code: "NOT_ADMIN_USER",
            message: "该邮箱不是管理员账号或不存在，无法通过管理端找回密码",
          },
          { status: 400 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Admin forgot password error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "发送重置邮件失败，请稍后重试" },
      { status: 500 },
    );
  }
}


