import { prisma } from "@/lib/db";
import { generateOrderNo } from "@/lib/utils/idGenerator";
import {
  OrderStatus,
  PaymentChannel,
} from "@/app/generated/prisma/client";

/**
 * 为指定用户创建订单
 */
export async function createOrderForUser(userId: number, planId: number) {
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

