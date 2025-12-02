import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import {
  createMembershipPlan,
  getAllPlans,
} from "@/lib/services/membershipService";
import { BillingCycle } from "@/app/generated/prisma/client";
import {
  membershipPlanCreateSchema,
  type MembershipPlanCreateInput,
} from "@/lib/utils/membershipValidators";

function requireAdmin(requestCookies: Awaited<ReturnType<typeof cookies>>) {
  const token = requestCookies.get("auth_token")?.value;

  if (!token) {
    return { error: { status: 401, body: { code: "UNAUTHORIZED", message: "未登录" } } };
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
      return NextResponse.json(auth.error.body, { status: auth.error.status });
    }

    const plans = await getAllPlans();

    return NextResponse.json({ code: "OK", data: plans }, { status: 200 });
  } catch (error) {
    console.error("Admin get membership plans error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "获取套餐列表失败" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const auth = requireAdmin(cookieStore);

    if ("error" in auth) {
      return NextResponse.json(auth.error.body, { status: auth.error.status });
    }

    const json = (await request.json().catch(() => null)) as
      | MembershipPlanCreateInput
      | null;

    const parsed = membershipPlanCreateSchema.safeParse(json);

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

    const payload = parsed.data;

    const billingCycle =
      payload.billingCycle === "YEARLY"
        ? BillingCycle.YEARLY
        : BillingCycle.MONTHLY;

    const plan = await createMembershipPlan({
      name: payload.name,
      price: payload.price,
      currency: payload.currency,
      billingCycle,
      description: payload.description ?? null,
      isActive: payload.isActive,
    });

    return NextResponse.json({ code: "OK", data: plan }, { status: 201 });
  } catch (error) {
    console.error("Admin create membership plan error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "创建套餐失败" },
      { status: 500 },
    );
  }
}


