"use client";

import { useEffect, useState } from "react";

type BillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY";

const CURRENCY_RATES: Record<
  string,
  {
    label: string;
    /** 1 单位该货币约等于多少 CNY，用于内部换算 */
    toCNY: number;
  }
> = {
  CNY: { label: "人民币（CNY）", toCNY: 1 },
  USD: { label: "美元（USD）", toCNY: 7.2 },
  EUR: { label: "欧元（EUR）", toCNY: 7.8 },
};

interface MembershipPlan {
  id: number;
  name: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  description: string | null;
  isActive: boolean;
}

interface ApiResponse<T> {
  code: string;
  data?: T;
  message?: string;
}

function formatBillingCycle(cycle: BillingCycle) {
  switch (cycle) {
    case "MONTHLY":
      return "按月";
    case "QUARTERLY":
      return "按季度";
    case "YEARLY":
      return "按年";
    default:
      return cycle;
  }
}

function formatMoney(amount: number) {
  return amount.toFixed(2);
}

function getPricePreview(priceMajor: number, currency: string) {
  const config = CURRENCY_RATES[currency];

  if (!config || priceMajor <= 0) {
    return [];
  }

  const valueInCNY = priceMajor * config.toCNY;

  const entries: string[] = [];

  (Object.keys(CURRENCY_RATES) as Array<keyof typeof CURRENCY_RATES>).forEach(
    (code) => {
      if (code === currency) return;

      const target = CURRENCY_RATES[code];
      const targetMajor = valueInCNY / target.toCNY;
      entries.push(`${formatMoney(targetMajor)} ${code}`);
    },
  );

  return entries;
}

const initialForm: Omit<MembershipPlan, "id" | "isActive"> & {
  isActive: boolean;
} = {
  name: "",
  price: 99,
  currency: "CNY",
  billingCycle: "MONTHLY",
  description: "",
  isActive: true,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadPlans() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/membership/plans");

      if (res.status === 401 || res.status === 403) {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          setError(parsed.message ?? "没有权限访问套餐管理");
        } catch {
          setError("没有权限访问套餐管理");
        }
        return;
      }

      const data: ApiResponse<MembershipPlan[]> = await res.json();

      if (!res.ok || data.code !== "OK" || !data.data) {
        setError(data.message ?? "获取套餐列表失败");
        return;
      }

      setPlans(data.data);
    } catch {
      setError("网络错误，获取套餐列表失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlans();
  }, []);

  function handleFormChange<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const priceYuan = Number(form.price);
      const priceInCents = Math.round(priceYuan * 100);

      const res = await fetch("/api/admin/membership/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: priceInCents,
          currency: form.currency,
          billingCycle: form.billingCycle,
          description: form.description || undefined,
          isActive: form.isActive,
        }),
      });

      const data: ApiResponse<MembershipPlan> = await res.json().catch(
        () => ({} as ApiResponse<MembershipPlan>),
      );

      if (!res.ok || data.code !== "OK" || !data.data) {
        setError(data.message ?? "创建套餐失败");
        return;
      }

      setForm(initialForm);
      await loadPlans();
    } catch {
      setError("网络错误，创建套餐失败");
    } finally {
      setSaving(false);
    }
  }

  function handleCurrencyChange(nextCurrency: string) {
    setForm((prev) => {
      const prevRate = CURRENCY_RATES[prev.currency];
      const nextRate = CURRENCY_RATES[nextCurrency];

      if (!prevRate || !nextRate || prev.price <= 0) {
        return { ...prev, currency: nextCurrency };
      }

      const priceInCNY = prev.price * prevRate.toCNY;
      const nextPriceMajorRaw = priceInCNY / nextRate.toCNY;
      const nextPriceMajor = Math.round(nextPriceMajorRaw * 100) / 100;

      return {
        ...prev,
        currency: nextCurrency,
          price: nextPriceMajor,
      };
    });
  }

  async function toggleActive(plan: MembershipPlan) {
    try {
      setUpdatingId(plan.id);
      setError(null);

      const res = await fetch(`/api/admin/membership/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });

      const data: ApiResponse<MembershipPlan> = await res.json().catch(
        () => ({} as ApiResponse<MembershipPlan>),
      );

      if (!res.ok || data.code !== "OK" || !data.data) {
        setError(data.message ?? "更新套餐状态失败");
        return;
      }

      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p)),
      );
    } catch {
      setError("网络错误，更新套餐状态失败");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deletePlan(plan: MembershipPlan) {
    if (!window.confirm(`确定要删除套餐「${plan.name}」吗？`)) return;

    try {
      setUpdatingId(plan.id);
      setError(null);

      const res = await fetch(`/api/admin/membership/plans/${plan.id}`, {
        method: "DELETE",
      });

      const data: ApiResponse<unknown> = await res.json().catch(
        () => ({} as ApiResponse<unknown>),
      );

      if (!res.ok || data.code !== "OK") {
        setError(data.message ?? "删除套餐失败");
        return;
      }

      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    } catch {
      setError("网络错误，删除套餐失败");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>
      <h2>套餐管理</h2>

      {error && (
        <p style={{ color: "red", marginTop: 12 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ marginTop: 12 }}>加载中...</p>
      ) : (
        <>
          <section style={{ marginTop: 16 }}>
            <h3>已有套餐</h3>
            {plans.length === 0 && (
              <p style={{ marginTop: 8 }}>当前没有任何套餐。</p>
            )}

            {plans.length > 0 && (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: 8,
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      ID
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      名称
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      价格
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      周期
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      状态
                    </th>
                    <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          padding: 8,
                          textAlign: "center",
                        }}
                      >
                        {plan.id}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          padding: 8,
                        }}
                      >
                        {plan.name}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          padding: 8,
                        }}
                      >
                        {plan.price / 100} {plan.currency}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          padding: 8,
                          textAlign: "center",
                        }}
                      >
                        {formatBillingCycle(plan.billingCycle)}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          padding: 8,
                          textAlign: "center",
                        }}
                      >
                        {plan.isActive ? "已启用" : "已停用"}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          padding: 8,
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => void toggleActive(plan)}
                          disabled={updatingId === plan.id}
                          style={{ marginRight: 8 }}
                        >
                          {plan.isActive ? "停用" : "启用"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deletePlan(plan)}
                          disabled={updatingId === plan.id}
                          style={{ color: "red" }}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section style={{ marginTop: 24 }}>
            <h3>新建套餐</h3>
            <form
              onSubmit={(e) => void handleCreatePlan(e)}
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                alignItems: "flex-end",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column" }}>
                <span>名称</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  required
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column" }}>
                <span>价格（元）</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    handleFormChange("price", Number(e.target.value))
                  }
                  min={0}
                  step={0.01}
                  required
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column" }}>
                <span>币种</span>
                <select
                  value={form.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  required
                >
                  <option value="CNY">人民币（CNY）</option>
                  <option value="USD">美元（USD）</option>
                  <option value="EUR">欧元（EUR）</option>
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column" }}>
                <span>计费周期</span>
                <select
                  value={form.billingCycle}
                  onChange={(e) =>
                    handleFormChange(
                      "billingCycle",
                      e.target.value as BillingCycle,
                    )
                  }
                >
                  <option value="MONTHLY">按月</option>
                  <option value="QUARTERLY">按季度</option>
                  <option value="YEARLY">按年</option>
                </select>
              </label>

              {form.price > 0 && CURRENCY_RATES[form.currency] && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    fontSize: 12,
                    color: "#666",
                  }}
                >
                  参考汇率价（约）：
                  <span>
                    {" "}
                    {formatMoney(form.price)} {form.currency}
                  </span>
                  {getPricePreview(form.price, form.currency).length > 0 && (
                    <span>
                      {" "}
                      ≈{" "}
                      {getPricePreview(form.price, form.currency).join(" / ")}
                    </span>
                  )}
                </div>
              )}

              <label style={{ display: "flex", flexDirection: "column" }}>
                <span>描述</span>
                <input
                  type="text"
                  value={form.description ?? ""}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                />
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    handleFormChange("isActive", e.target.checked)
                  }
                />
                <span>创建后立即启用</span>
              </label>

              <button
                type="submit"
                disabled={saving}
                style={{ padding: "6px 12px" }}
              >
                {saving ? "创建中..." : "创建套餐"}
              </button>
            </form>
          </section>
        </>
      )}
    </section>
  );
}

