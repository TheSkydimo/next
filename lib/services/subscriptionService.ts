import { prisma } from "@/lib/db";

/**
 * 查询指定用户的订阅列表（含关联套餐信息），按开始时间倒序
 */
export async function listSubscriptionsForUser(userId: number) {
  return prisma.userSubscription.findMany({
    where: { userId },
    include: {
      plan: true,
    },
    orderBy: {
      startAt: "desc",
    },
  });
}


