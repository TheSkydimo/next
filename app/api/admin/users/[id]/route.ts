import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { prisma } from "@/lib/db";

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

type RouteParams = {
  params: { id: string };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const auth = requireAdmin(cookieStore);

    if ("error" in auth) {
      const { error } = auth;
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { code: "INVALID_ID", message: "无效的用户 ID" },
        { status: 400 },
      );
    }

    const json = (await request.json().catch(() => ({}))) as {
      role?: "USER" | "ADMIN";
      name?: string;
    };

    const data: { role?: "USER" | "ADMIN"; name?: string } = {};

    if (json.role && (json.role === "USER" || json.role === "ADMIN")) {
      data.role = json.role;
    }

    if (typeof json.name === "string" && json.name.trim()) {
      data.name = json.name.trim();
    }

    if (!data.role && !data.name) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "没有可更新的字段" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ code: "OK", data: updated }, { status: 200 });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "更新用户信息失败" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const auth = requireAdmin(cookieStore);

    if ("error" in auth) {
      const { error } = auth;
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { code: "INVALID_ID", message: "无效的用户 ID" },
        { status: 400 },
      );
    }

    if (id === auth.userId) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "不能删除当前登录的管理员账号" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            orders: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "用户不存在" },
        { status: 404 },
      );
    }

    if (user._count.orders > 0 || user._count.subscriptions > 0) {
      return NextResponse.json(
        {
          code: "HAS_DATA",
          message: "该用户存在订单或订阅记录，暂不允许直接删除",
        },
        { status: 400 },
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ code: "OK" }, { status: 200 });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "删除用户失败" },
      { status: 500 },
    );
  }
}


