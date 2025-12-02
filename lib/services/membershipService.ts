import { prisma } from "@/lib/db";
import { BillingCycle } from "@/app/generated/prisma/client";

export async function getActivePlans() {
  return prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
}

export async function getAllPlans() {
  return prisma.membershipPlan.findMany({
    orderBy: { id: "asc" },
  });
}

export async function createMembershipPlan(params: {
  name: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  description?: string | null;
  isActive?: boolean;
}) {
  return prisma.membershipPlan.create({
    data: {
      name: params.name,
      price: params.price,
      currency: params.currency,
      billingCycle: params.billingCycle,
      description: params.description,
      isActive: params.isActive ?? true,
    },
  });
}

export async function updateMembershipPlan(
  id: number,
  data: Partial<{
    name: string;
    price: number;
    currency: string;
    billingCycle: BillingCycle;
    description: string | null;
    isActive: boolean;
  }>,
) {
  return prisma.membershipPlan.update({
    where: { id },
    data,
  });
}

export async function deleteMembershipPlan(id: number) {
  return prisma.membershipPlan.delete({
    where: { id },
  });
}

