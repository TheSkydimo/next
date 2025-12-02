"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SubscriptionStatus = "ACTIVE" | "CANCELED" | "EXPIRED";
type BillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY";

interface Plan {
  id: number;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  description?: string | null;
}

interface SubscriptionItem {
  id: number;
  planName: string;
  planDescription: string | null;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  startAt: string;
  endAt: string;
  autoRenew: boolean;
}

interface SubscriptionsResponse {
  code: string;
  data?: {
    current: SubscriptionItem | null;
    history: SubscriptionItem[];
  };
  message?: string;
}

function formatStatus(status: SubscriptionStatus) {
  switch (status) {
    case "ACTIVE":
      return "生效中";
    case "CANCELED":
      return "已取消";
    case "EXPIRED":
      return "已过期";
    default:
      return status;
  }
}

function formatCycle(cycle: string) {
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

export default function AccountSubscriptionPage() {
  const [current, setCurrent] = useState<SubscriptionItem | null>(null);
  const [history, setHistory] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSubscriptions() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/account/subscriptions", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 401) {
          if (!cancelled) {
            setError("未登录，请先登录");
          }
          return;
        }

        const data = (await res.json()) as SubscriptionsResponse;

        if (!res.ok || data.code !== "OK" || !data.data) {
          if (!cancelled) {
            setError(data.message ?? "获取订阅信息失败");
          }
          return;
        }

        if (!cancelled) {
          setCurrent(data.data.current);
          setHistory(data.data.history);
        }
      } catch {
        if (!cancelled) {
          setError("网络错误，请稍后重试");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSubscriptions();

    return () => {
      cancelled = true;
    };
  }, []);

  // 获取可用订阅套餐列表，方便在「我的订阅」中直接选择/切换套餐
  useEffect(() => {
    let cancelled = false;

    async function fetchPlans() {
      try {
        setPlansLoading(true);
        setPlansError(null);

        const res = await fetch("/api/membership/plans", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          if (!cancelled) {
            setPlansError("获取套餐列表失败");
          }
          return;
        }

        const data = (await res.json()) as Plan[];

        if (!cancelled) {
          setPlans(data);
        }
      } catch {
        if (!cancelled) {
          setPlansError("网络错误，获取套餐列表失败");
        }
      } finally {
        if (!cancelled) {
          setPlansLoading(false);
        }
      }
    }

    fetchPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>订阅信息</h1>

      {loading && <p>加载中...</p>}

      {!loading && error && (
        <p style={{ color: "red", marginTop: 16 }}>
          {error}
          {error.includes("未登录") && (
            <>
              {" "}
              <Link href="/login">去登录</Link>
            </>
          )}
        </p>
      )}

      {!loading && !error && (
        <>
          <section style={{ marginTop: 24 }}>
            <h2>当前订阅</h2>
            {!current && <p style={{ marginTop: 12 }}>当前没有生效中的订阅</p>}

            {current && (
              <div
                style={{
                  marginTop: 12,
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  lineHeight: 1.8,
                }}
              >
                <div>
                  <strong>{current.planName}</strong>
                  <span style={{ marginLeft: 8, color: "#666", fontSize: 14 }}>
                    ({formatCycle(current.billingCycle)} /{" "}
                    {current.price} {current.currency})
                  </span>
                </div>
                {current.planDescription && (
                  <div style={{ marginTop: 4, color: "#555" }}>
                    {current.planDescription}
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <strong>状态：</strong>
                  {formatStatus(current.status)}
                </div>
                <div>
                  <strong>生效时间：</strong>
                  {new Date(current.startAt).toLocaleString()}
                </div>
                <div>
                  <strong>到期时间：</strong>
                  {new Date(current.endAt).toLocaleString()}
                </div>
                <div>
                  <strong>自动续费：</strong>
                  {current.autoRenew ? "已开启" : "未开启"}
                </div>
              </div>
            )}
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>订阅历史</h2>
            {history.length === 0 && (
              <p style={{ marginTop: 12 }}>暂无订阅记录</p>
            )}

            {history.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid #f0f0f0",
                      fontSize: 14,
                      lineHeight: 1.7,
                    }}
                  >
                    <div>
                      <strong>{item.planName}</strong>
                      <span
                        style={{ marginLeft: 8, color: "#666", fontSize: 13 }}
                      >
                        ({formatCycle(item.billingCycle)} / {item.price}{" "}
                        {item.currency})
                      </span>
                    </div>
                    <div>
                      状态：{formatStatus(item.status)}｜自动续费：
                      {item.autoRenew ? "已开启" : "未开启"}
                    </div>
                    <div>
                      生效：{new Date(item.startAt).toLocaleString()} ｜ 到期：
                      {new Date(item.endAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>选择 / 变更订阅套餐</h2>
            <p style={{ marginTop: 8, color: "#555", fontSize: 14 }}>
              你也可以在这里直接选择需要的套餐，系统会跳转到结算页并为当前账号创建订单。
            </p>

            {plansLoading && <p style={{ marginTop: 12 }}>套餐加载中...</p>}

            {!plansLoading && plansError && (
              <p style={{ marginTop: 12, color: "red" }}>{plansError}</p>
            )}

            {!plansLoading && !plansError && plans.length === 0 && (
              <p style={{ marginTop: 12 }}>暂无可用套餐，请联系管理员配置。</p>
            )}

            {!plansLoading && !plansError && plans.length > 0 && (
              <div
                style={{
                  marginTop: 16,
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
                      fontSize: 14,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {plan.name}
                      </div>
                      <div>
                          {plan.price / 100} {plan.currency} /{" "}
                          {formatCycle(plan.billingCycle)}
                      </div>
                      {plan.description && (
                        <div
                          style={{
                            marginTop: 6,
                            color: "#555",
                            lineHeight: 1.6,
                          }}
                        >
                          {plan.description}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link
                        href={`/checkout?planId=${plan.id}`}
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: 4,
                          backgroundColor: "#000",
                          color: "#fff",
                          textDecoration: "none",
                        }}
                      >
                        订阅 / 切换到此套餐
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

