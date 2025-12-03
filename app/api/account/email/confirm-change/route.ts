import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { confirmEmailChange } from "@/lib/services/accountService";
import { confirmEmailChangeInputSchema } from "@/lib/utils/accountValidators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "未登录" },
        { status: 401 },
      );
    }

    const payload = await verifyAuthToken(token);

    const json = await request.json().catch(() => ({}));
    const parsed = confirmEmailChangeInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    let updatedUser;

    try {
      updatedUser = await confirmEmailChange(payload.userId, parsed.data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "USER_NOT_FOUND") {
          return NextResponse.json(
            { code: "USER_NOT_FOUND", message: "用户不存在" },
            { status: 404 },
          );
        }

        if (error.message === "VERIFICATION_NOT_FOUND") {
          return NextResponse.json(
            {
              code: "VERIFICATION_NOT_FOUND",
              message: "未找到有效的验证码，请先发起邮箱变更请求",
            },
            { status: 400 },
          );
        }

        if (error.message === "VERIFICATION_EXPIRED") {
          return NextResponse.json(
            {
              code: "VERIFICATION_EXPIRED",
              message: "验证码已过期，请重新发起邮箱变更请求",
            },
            { status: 400 },
          );
        }

        if (error.message === "VERIFICATION_CODE_INVALID") {
          return NextResponse.json(
            {
              code: "VERIFICATION_CODE_INVALID",
              message: "验证码错误",
            },
            { status: 400 },
          );
        }

        if (error.message === "EMAIL_ALREADY_IN_USE") {
          return NextResponse.json(
            {
              code: "EMAIL_ALREADY_IN_USE",
              message: "新邮箱已被其他账号占用",
            },
            { status: 409 },
          );
        }
      }

      throw error;
    }

    return NextResponse.json(
      {
        code: "OK",
        message: "邮箱修改成功",
        data: updatedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Confirm email change error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "邮箱修改失败，请稍后重试" },
      { status: 500 },
    );
  }
}


