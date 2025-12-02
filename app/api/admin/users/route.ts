import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { prisma } from "@/lib/db";
import {
  SubscriptionStatus,
  UserRole,
} from "@/app/generated/prisma/client";

type AdminAuthSuccess = { userId: number };
type AdminAuthError = {
  error: { status: number; body: { code: string; message: string } };
};

function requireAdmin(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): AdminAuthSuccess | AdminAuthError {
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
    const payload = verifyAuthToken(token);

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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const auth = requireAdmin(cookieStore);

    if ("error" in auth) {
      const { error } = auth;
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            subscriptions: true,
          },
        },
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          include: {
            plan: true,
          },
          orderBy: { startAt: "desc" },
          take: 1,
        },
      },
      where: { role: UserRole.USER },
      orderBy: { id: "asc" },
    });

    const data = users.map((user) => {
      const active = user.subscriptions[0];

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        ordersCount: user._count.orders,
        subscriptionsCount: user._count.subscriptions,
        activeSubscription: active
          ? {
              planName: active.plan.name,
              status: active.status,
              startAt: active.startAt,
              endAt: active.endAt,
            }
          : null,
      };
    });

    return NextResponse.json({ code: "OK", data }, { status: 200 });
  } catch (error) {
    console.error("Admin get users error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "获取用户列表失败" },
      { status: 500 },
    );
  }
}


