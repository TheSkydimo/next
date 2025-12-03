import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { listOrdersForUser } from "@/lib/services/orderService";

export const runtime = "edge";

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

    const payload = verifyAuthToken(token);

    const orders = await listOrdersForUser(payload.userId);

    const data = orders.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      planName: order.plan.name,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      paymentChannel: order.paymentChannel,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    }));

    return NextResponse.json({ code: "OK", data }, { status: 200 });
  } catch (error) {
    console.error("Get account orders error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "获取订单列表失败，请稍后重试" },
      { status: 500 },
    );
  }
}


