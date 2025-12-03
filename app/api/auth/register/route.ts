import { NextResponse } from "next/server";
import { registerInputSchema } from "@/lib/utils/authValidators";
import { registerUser } from "@/lib/services/authService";
import { sendVerificationEmail } from "@/lib/services/emailService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = registerInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await registerUser(parsed.data);

    // 向用户发送邮箱验证码（当前实现为控制台输出）
    if (user.verificationCode) {
      await sendVerificationEmail(user.email, user.verificationCode);
    }

    return NextResponse.json(
      {
        code: "VERIFICATION_REQUIRED",
        message: "注册信息已提交，请前往邮箱查看验证码完成激活",
        data: {
          email: user.email,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "USER_ALREADY_EXISTS") {
      return NextResponse.json(
        { code: "USER_ALREADY_EXISTS", message: "该邮箱已注册" },
        { status: 409 },
      );
    }

    console.error("Register user error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "注册失败，请稍后重试" },
      { status: 500 },
    );
  }
}

