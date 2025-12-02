import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { listSubscriptionsForUser } from "@/lib/services/subscriptionService";

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

    const subscriptions = await listSubscriptionsForUser(payload.userId);

    const items = subscriptions.map((sub) => ({
      id: sub.id,
      planName: sub.plan.name,
      planDescription: sub.plan.description,
      price: sub.plan.price,
      currency: sub.plan.currency,
      billingCycle: sub.plan.billingCycle,
      status: sub.status,
      startAt: sub.startAt,
      endAt: sub.endAt,
      autoRenew: sub.autoRenew,
    }));

    const current =
      items.find((item) => item.status === "ACTIVE") ?? null;

    return NextResponse.json(
      { code: "OK", data: { current, history: items } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get account subscriptions error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "获取订阅信息失败，请稍后重试" },
      { status: 500 },
    );
  }
}


