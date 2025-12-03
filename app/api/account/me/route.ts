import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "用户不存在或已被删除" },
        { status: 401 },
      );
    }

    return NextResponse.json({ code: "OK", data: user }, { status: 200 });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "获取用户信息失败，请稍后重试" },
      { status: 500 },
    );
  }
}


