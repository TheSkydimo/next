import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@/app/generated/prisma/client";

type AdminAuthSuccess = { userId: number };
type AdminAuthError = {
  error: { status: number; body: { code: string; message: string } };
};

export const runtime = "nodejs";

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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const auth = await requireAdmin(cookieStore);

    if ("error" in auth) {
      const { error } = auth;
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    const orders = await prisma.order.findMany({
      include: {
        plan: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    const data = orders.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      userEmail: order.user.email,
      planName: order.plan.name,
      amount: order.amount,
      currency: order.currency,
      status: order.status as OrderStatus,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    }));

    return NextResponse.json({ code: "OK", data }, { status: 200 });
  } catch (error) {
    console.error("Admin get orders error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "获取订单列表失败" },
      { status: 500 },
    );
  }
}


