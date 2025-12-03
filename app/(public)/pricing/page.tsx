import Link from "next/link";

export const runtime = "edge";

type Plan = {
  id: number;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  description?: string | null;
};

async function fetchPlans(): Promise<Plan[]> {
  const res = await fetch("http://localhost:3000/api/membership/plans", {
    // 简单示例，后续可改为使用相对 URL + Next.js fetch 缓存
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export default async function PricingPage() {
  const plans = await fetchPlans();

  return (
    <main style={{ maxWidth: 960, margin: "40px auto", padding: "0 16px" }}>
      <h1>套餐定价</h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        请选择合适的会员套餐，点击订阅后会进入结算并创建订单。
      </p>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 8 }}>{plan.name}</h2>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {plan.price / 100} {plan.currency} / {plan.billingCycle}
              </div>
              {plan.description && (
                <p style={{ marginTop: 8, fontSize: 14, color: "#555" }}>
                  {plan.description}
                </p>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <Link
                href={`/checkout?planId=${plan.id}`}
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  borderRadius: 4,
                  backgroundColor: "#000",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                立即订阅
              </Link>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <p style={{ marginTop: 24 }}>
          暂无套餐，请先在数据库中添加 MembershipPlan 记录。
        </p>
      )}
    </main>
  );
}



