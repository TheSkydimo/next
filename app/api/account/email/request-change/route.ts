import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { requestEmailChange } from "@/lib/services/accountService";
import { requestEmailChangeInputSchema } from "@/lib/utils/accountValidators";

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

    const payload = verifyAuthToken(token);

    const json = await request.json().catch(() => ({}));
    const parsed = requestEmailChangeInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    try {
      await requestEmailChange(payload.userId, parsed.data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "USER_NOT_FOUND") {
          return NextResponse.json(
            { code: "USER_NOT_FOUND", message: "用户不存在" },
            { status: 404 },
          );
        }

        if (error.message === "INVALID_CURRENT_PASSWORD") {
          return NextResponse.json(
            { code: "INVALID_CURRENT_PASSWORD", message: "当前密码错误" },
            { status: 400 },
          );
        }

        if (error.message === "EMAIL_ALREADY_IN_USE") {
          return NextResponse.json(
            { code: "EMAIL_ALREADY_IN_USE", message: "新邮箱已被其他账号占用" },
            { status: 409 },
          );
        }
      }

      throw error;
    }

    return NextResponse.json(
      {
        code: "OK",
        message: "验证码已发送至新邮箱，请在 10 分钟内完成验证",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Request email change error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "请求修改邮箱失败，请稍后重试" },
      { status: 500 },
    );
  }
}


