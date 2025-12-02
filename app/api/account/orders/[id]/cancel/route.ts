import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { cancelOrderForUser } from "@/lib/services/orderService";

type RouteParams = {
  params: { id: string };
};

export async function POST(_request: NextRequest, { params }: RouteParams) {
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

    const orderId = Number(params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        { code: "INVALID_ID", message: "无效的订单 ID" },
        { status: 400 },
      );
    }

    const result = await cancelOrderForUser(orderId, payload.userId);

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
    console.error("Cancel account order error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "取消订单失败，请稍后重试" },
      { status: 500 },
    );
  }
}


