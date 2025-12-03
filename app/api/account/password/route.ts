import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { changeUserPassword } from "@/lib/services/accountService";
import { changePasswordInputSchema } from "@/lib/utils/accountValidators";

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
    const parsed = changePasswordInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    try {
      await changeUserPassword(payload.userId, parsed.data);
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
      }

      throw error;
    }

    return NextResponse.json(
      { code: "OK", message: "密码修改成功" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "修改密码失败，请稍后重试" },
      { status: 500 },
    );
  }
}


