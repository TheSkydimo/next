import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signAuthToken } from "@/lib/utils/jwt";

interface VerifyEmailInput {
  email: string;
  code: string;
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = (await request.json().catch(() => ({}))) as VerifyEmailInput;

    const email = typeof json.email === "string" ? json.email.trim() : "";
    const code = typeof json.code === "string" ? json.code.trim() : "";

    if (!email || !code) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "邮箱和验证码不能为空" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.verificationCode) {
      return NextResponse.json(
        { code: "VERIFICATION_NOT_FOUND", message: "验证码无效，请重新注册或联系管理员" },
        { status: 400 },
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { code: "ALREADY_VERIFIED", message: "邮箱已激活，请直接登录" },
        { status: 400 },
      );
    }

    if (
      user.verificationExpiresAt &&
      user.verificationExpiresAt.getTime() < Date.now()
    ) {
      return NextResponse.json(
        { code: "VERIFICATION_EXPIRED", message: "验证码已过期，请重新注册获取新的验证码" },
        { status: 400 },
      );
    }

    if (user.verificationCode !== code) {
      return NextResponse.json(
        { code: "VERIFICATION_CODE_INVALID", message: "验证码错误" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        verificationCode: null,
        verificationExpiresAt: null,
      },
    });

    const token = await signAuthToken({
      userId: updated.id,
      role: updated.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json(
      {
        code: "OK",
        message: "邮箱已成功激活",
        data: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "邮箱激活失败，请稍后重试" },
      { status: 500 },
    );
  }
}


