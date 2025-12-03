import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import {
  deleteMembershipPlan,
  updateMembershipPlan,
} from "@/lib/services/membershipService";
import { BillingCycle } from "@/app/generated/prisma/client";
import {
  membershipPlanUpdateSchema,
  type MembershipPlanUpdateInput,
} from "@/lib/utils/membershipValidators";

type AdminAuthSuccess = { userId: number };
type AdminAuthError = {
  error: { status: number; body: { code: string; message: string } };
};

export const runtime = "edge";

function requireAdmin(
  requestCookies: Awaited<ReturnType<typeof cookies>>,
): AdminAuthSuccess | AdminAuthError {
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

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const cookieStore = await cookies();
    const auth = requireAdmin(cookieStore);

    if ("error" in auth) {
      const { error } = auth;
      return NextResponse.json(error.body, { status: error.status });
    }

    const { id: idStr } = await params;
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { code: "INVALID_ID", message: "无效的套餐 ID" },
        { status: 400 },
      );
    }

    const json = (await request.json().catch(() => null)) as
      | MembershipPlanUpdateInput
      | null;

    const parsed = membershipPlanUpdateSchema.safeParse(json);

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

    const data: Parameters<typeof updateMembershipPlan>[1] = {};

    if (payload.name !== undefined) data.name = payload.name;
    if (payload.price !== undefined) data.price = payload.price;
    if (payload.currency !== undefined) data.currency = payload.currency;
    if (payload.description !== undefined)
      data.description = payload.description ?? null;
    if (payload.isActive !== undefined) data.isActive = payload.isActive;

    if (payload.billingCycle !== undefined) {
      switch (payload.billingCycle) {
        case "YEARLY":
          data.billingCycle = BillingCycle.YEARLY;
          break;
        case "QUARTERLY":
          data.billingCycle = BillingCycle.QUARTERLY;
          break;
        case "MONTHLY":
        default:
          data.billingCycle = BillingCycle.MONTHLY;
          break;
      }
    }

    const updated = await updateMembershipPlan(id, data);

    return NextResponse.json({ code: "OK", data: updated }, { status: 200 });
  } catch (error) {
    console.error("Admin update membership plan error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "更新套餐失败" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const auth = requireAdmin(cookieStore);

    if ("error" in auth) {
      return NextResponse.json(auth.error.body, { status: auth.error.status });
    }

    const { id: idStr } = await params;
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { code: "INVALID_ID", message: "无效的套餐 ID" },
        { status: 400 },
      );
    }

    await deleteMembershipPlan(id);

    return NextResponse.json({ code: "OK" }, { status: 200 });
  } catch (error) {
    console.error("Admin delete membership plan error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "删除套餐失败" },
      { status: 500 },
    );
  }
}


