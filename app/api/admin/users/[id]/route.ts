import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { prisma } from "@/lib/db";
import { SubscriptionStatus } from "@/app/generated/prisma/client";

type AdminAuthSuccess = { userId: number };
type AdminAuthError = {
  error: { status: number; body: { code: string; message: string } };
};

async function requireAdmin(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<AdminAuthSuccess | AdminAuthError> {
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return {
      error: {
        status: 401,
        body: { code: "UNAUTHORIZED", message: "未登录" },
      },
    };
  }

  try {
    const payload = await verifyAuthToken(token);

    if (payload.role !== "ADMIN") {
      return {
        error: {
          status: 403,
          body: { code: "FORBIDDEN", message: "没有权限访问该接口" },
        },
      };
    }

    return { userId: payload.userId };
  } catch {
    return {
      error: {
        status: 401,
        body: { code: "UNAUTHORIZED", message: "登录状态无效，请重新登录" },
      },
    };
  }
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const auth = await requireAdmin(cookieStore);

    if ("error" in auth) {
      const { error } = auth;
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    const { id: idStr } = await params;
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { code: "INVALID_ID", message: "无效的用户 ID" },
        { status: 400 },
      );
    }

    const json = (await request.json().catch(() => ({}))) as {
      role?: "USER" | "ADMIN";
      name?: string;
    };

    const data: { role?: "USER" | "ADMIN"; name?: string } = {};

    if (json.role && (json.role === "USER" || json.role === "ADMIN")) {
      data.role = json.role;
    }

    if (typeof json.name === "string" && json.name.trim()) {
      data.name = json.name.trim();
    }

    if (!data.role && !data.name) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "没有可更新的字段" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ code: "OK", data: updated }, { status: 200 });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "更新用户信息失败" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const auth = await requireAdmin(cookieStore);

    if ("error" in auth) {
      const { error } = auth;
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    const { id: idStr } = await params;
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { code: "INVALID_ID", message: "无效的用户 ID" },
        { status: 400 },
      );
    }

    if (id === auth.userId) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "不能删除当前登录的管理员账号" },
        { status: 400 },
      );
    }

    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        subscriptions: {
          where: {
            status: SubscriptionStatus.ACTIVE,
            endAt: {
              gt: now,
            },
          },
          select: {
            id: true,
            endAt: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "用户不存在" },
        { status: 404 },
      );
    }

    const hasActiveSubscription = user.subscriptions.length > 0;

    if (hasActiveSubscription) {
      return NextResponse.json(
        {
          code: "HAS_ACTIVE_SUBSCRIPTION",
          message: "该用户当前仍在订阅期内，暂不允许删除",
        },
        { status: 400 },
      );
    }

    // 保险起见，先清理该用户的关联数据，再删除用户，避免外键约束错误
    await prisma.$transaction([
      prisma.userSubscription.deleteMany({
        where: { userId: id },
      }),
      prisma.order.deleteMany({
        where: { userId: id },
      }),
      prisma.user.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ code: "OK" }, { status: 200 });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "删除用户失败" },
      { status: 500 },
    );
  }
}


