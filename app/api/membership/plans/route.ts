import { NextRequest, NextResponse } from "next/server";
import {
  createMembershipPlan,
  getActivePlans,
} from "@/lib/services/membershipService";
import { logger } from "@/lib/utils/logger";
import { BillingCycle } from "@/app/generated/prisma/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const plans = await getActivePlans();
    return NextResponse.json(plans);
  } catch (error) {
    logger.error("Failed to fetch membership plans", { error });
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "获取套餐失败" },
      { status: 500 },
    );
  }
}

// 开发环境辅助接口：一键创建一个测试套餐，方便本地联调
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "生产环境不允许创建测试套餐" },
        { status: 403 },
      );
    }

    const body = (await request
      .json()
      .catch(() => ({} as Record<string, unknown>))) as Record<string, unknown>;

    const name =
      (typeof body.name === "string" && body.name.trim()) ||
      "测试套餐（月付）";
    const price =
      typeof body.price === "number" && Number.isFinite(body.price)
        ? body.price
        : 9900; // 单位：分
    const currency =
      (typeof body.currency === "string" && body.currency.trim()) || "CNY";

    const billingCycleValue =
      typeof body.billingCycle === "string" ? body.billingCycle : "MONTHLY";

    let billingCycle: BillingCycle;

    switch (billingCycleValue) {
      case "YEARLY":
        billingCycle = BillingCycle.YEARLY;
        break;
      case "QUARTERLY":
        billingCycle = BillingCycle.QUARTERLY;
        break;
      case "MONTHLY":
      default:
        billingCycle = BillingCycle.MONTHLY;
        break;
    }

    const description =
      typeof body.description === "string"
        ? body.description
        : "仅用于本地开发环境联调的测试套餐";

    const plan = await createMembershipPlan({
      name,
      price,
      currency,
      billingCycle,
      description,
    });

    return NextResponse.json(
      { code: "OK", data: plan },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Failed to create test membership plan", { error });
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "创建测试套餐失败" },
      { status: 500 },
    );
  }
}

