import { NextResponse } from "next/server";
import { loginInputSchema } from "@/lib/utils/authValidators";
import { authenticateUser } from "@/lib/services/authService";
import { signAuthToken } from "@/lib/utils/jwt";
import { cookies } from "next/headers";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = loginInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await authenticateUser(parsed.data);
    const token = signAuthToken({ userId: user.id, role: user.role });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json(
      {
        code: "OK",
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
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return NextResponse.json(
        { code: "INVALID_CREDENTIALS", message: "邮箱或密码错误" },
        { status: 401 },
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "登录失败，请稍后重试" },
      { status: 500 },
    );
  }
}


