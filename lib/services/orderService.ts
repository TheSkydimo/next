import { getPrismaClient } from "@/lib/db";
import { generateOrderNo } from "@/lib/utils/idGenerator";
import {
  OrderStatus,
  PaymentChannel,
} from "@/app/generated/prisma/client";

/**
 * 为指定用户创建订单
 */
export async function createOrderForUser(userId: number, planId: number) {
  const prisma = getPrismaClient();
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId, isActive: true },
  });

  if (!plan) {
    throw new Error("PLAN_NOT_FOUND");
  }

  const orderNo = generateOrderNo();

  const order = await prisma.order.create({
    data: {
      orderNo,
      userId,
      planId: plan.id,
      amount: plan.price,
      currency: plan.currency,
      status: OrderStatus.PENDING,
      paymentChannel: PaymentChannel.STRIPE, // 先默认 Stripe，后续根据实际支付渠道调整
    },
  });

  // TODO: 集成真实支付，生成 paymentUrl
  const paymentUrl = `https://pay.example.com/${orderNo}`;

  return { order, paymentUrl };
}

/**
 * 查询指定用户的订单列表（含关联套餐信息），按创建时间倒序
 */
export async function listOrdersForUser(userId: number) {
  const prisma = getPrismaClient();
  return prisma.order.findMany({
    where: { userId },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * 取消指定用户的一笔订单
 *
 * 业务规则：
 * - 只能取消当前登录用户自己的订单
 * - 只能取消状态为 PENDING（待支付）的订单
 */
export async function cancelOrderForUser(orderId: number, userId: number) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.userId !== userId) {
    return {
      ok: false as const,
      code: "NOT_FOUND",
      message: "订单不存在",
    };
  }

  if (order.status !== OrderStatus.PENDING) {
    return {
      ok: false as const,
      code: "INVALID_STATUS",
      message: "只有待支付订单可以取消",
    };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CANCELED,
    },
  });

  return {
    ok: true as const,
    order: updated,
  };
}

/**
 * 用户发起退款申请（仅允许已支付订单）
 */
export async function requestRefundForUser(
  orderId: number,
  userId: number,
) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.userId !== userId) {
    return {
      ok: false as const,
      code: "NOT_FOUND",
      message: "订单不存在",
    };
  }

  if (order.status !== OrderStatus.PAID) {
    return {
      ok: false as const,
      code: "INVALID_STATUS",
      message: "只有已支付订单可以申请退款",
    };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.REFUND_REQUESTED,
    },
  });

  return {
    ok: true as const,
    order: updated,
  };
}

/**
 * 管理员同意退款，将订单标记为已退款
 */
export async function approveRefundForOrder(orderId: number) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return {
      ok: false as const,
      code: "NOT_FOUND",
      message: "订单不存在",
    };
  }

  if (order.status !== OrderStatus.REFUND_REQUESTED) {
    return {
      ok: false as const,
      code: "INVALID_STATUS",
      message: "只有处于退款申请中的订单可以执行退款",
    };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.REFUNDED,
    },
  });

  return {
    ok: true as const,
    order: updated,
  };
}

