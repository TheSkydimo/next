import { z } from "zod";

export const membershipPlanCreateSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(100, "名称过长"),
  price: z.number().int().nonnegative("价格不能为负数"),
  currency: z.string().min(1, "币种不能为空").max(10),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type MembershipPlanCreateInput = z.infer<
  typeof membershipPlanCreateSchema
>;

export const membershipPlanUpdateSchema =
  membershipPlanCreateSchema.partial();

export type MembershipPlanUpdateInput = z.infer<
  typeof membershipPlanUpdateSchema
>;


