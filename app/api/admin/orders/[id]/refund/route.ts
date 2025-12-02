import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { approveRefundForOrder } from "@/lib/services/orderService";

type RouteParams = {
  params: { id: string };
};

function requireAdmin(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return {
      error: {
        status: 401,
        body: { code: "UNAUTHORIZED", message: "未登录" },
      },
    } as const;
  }

  try {
    const payload = verifyAuthToken(token);

    if (payload.role !== "ADMIN") {
      return {
        error: {
          status: 403,
          body: { code: "FORBIDDEN", message: "没有权限访问该接口" },
        },
      } as const;
    }

    return { userId: payload.userId } as const;
  } catch {
    return {
      error: {
        status: 401,
        body: { code: "UNAUTHORIZED", message: "登录状态无效，请重新登录" },
      },
    } as const;
  }
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const auth = requireAdmin(cookieStore);

    if ("error" in auth) {
      const { error } = auth;
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    const orderId = Number(params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        { code: "INVALID_ID", message: "无效的订单 ID" },
        { status: 400 },
      );
    }

    const result = await approveRefundForOrder(orderId);

    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "INVALID_STATUS"
            ? 400
            : 400;

      return NextResponse.json(
        { code: result.code, message: result.message },
        { status },
      );
    }

    return NextResponse.json(
      {
        code: "OK",
        data: {
          id: result.order.id,
          status: result.order.status,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin approve refund error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "同意退款失败" },
      { status: 500 },
    );
  }
}


