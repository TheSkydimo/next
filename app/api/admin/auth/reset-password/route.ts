import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resetPasswordInputSchema } from "@/lib/utils/authValidators";
import { resetAdminPasswordWithCode } from "@/lib/services/authService";
import { signAuthToken } from "@/lib/utils/jwt";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = resetPasswordInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    try {
      const user = await resetAdminPasswordWithCode(parsed.data);

      const token = signAuthToken({ userId: user.id, role: user.role });

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
          message: "密码已重置，已自动登录",
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
        { status: 200 },
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "VERIFICATION_NOT_FOUND") {
          return NextResponse.json(
            {
              code: "VERIFICATION_NOT_FOUND",
              message: "重置请求不存在或已失效，请重新获取激活码",
            },
            { status: 400 },
          );
        }

        if (error.message === "VERIFICATION_EXPIRED") {
          return NextResponse.json(
            {
              code: "VERIFICATION_EXPIRED",
              message: "激活码已过期，请重新获取",
            },
            { status: 400 },
          );
        }

        if (error.message === "VERIFICATION_CODE_INVALID") {
          return NextResponse.json(
            {
              code: "VERIFICATION_CODE_INVALID",
              message: "激活码错误",
            },
            { status: 400 },
          );
        }
      }

      throw error;
    }
  } catch (error) {
    console.error("Admin reset password error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "重置密码失败，请稍后重试" },
      { status: 500 },
    );
  }
}


