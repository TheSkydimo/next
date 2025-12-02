import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createOrderInputSchema } from "@/lib/utils/validators";
import { createOrderForUser } from "@/lib/services/orderService";
import { logger } from "@/lib/utils/logger";
import { verifyAuthToken } from "@/lib/utils/jwt";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = createOrderInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_INPUT",
          message: "参数错误",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "未登录" },
        { status: 401 },
      );
    }

    const payload = verifyAuthToken(token);

    const { order, paymentUrl } = await createOrderForUser(
      payload.userId,
      parsed.data.planId,
    );

    return NextResponse.json(
      {
        code: "OK",
        data: {
          orderNo: order.orderNo,
          paymentUrl,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Failed to create order", { error });
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "创建订单失败" },
      { status: 500 },
    );
  }
}

