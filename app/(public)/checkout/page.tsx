"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

interface CreateOrderResponse {
  code: string;
  data?: {
    orderNo: string;
    paymentUrl: string;
  };
  message?: string;
}

function CheckoutPageContent(): ReactElement {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? undefined;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  async function handleCreateOrder() {
    if (!planId) return;

    const parsedPlanId = Number(planId);
    if (!Number.isInteger(parsedPlanId) || parsedPlanId <= 0) {
      setError("无效的套餐 ID");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setOrderNo(null);
      setPaymentUrl(null);

      const res = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: parsedPlanId }),
      });

      if (res.status === 401) {
        setError("未登录，请先登录");
        return;
      }

      const data: CreateOrderResponse = await res.json();

      if (!res.ok || data.code !== "OK" || !data.data) {
        setError(data.message ?? "创建订单失败，请稍后重试");
        return;
      }

      setOrderNo(data.data.orderNo);
      setPaymentUrl(data.data.paymentUrl);
    } catch {
      setError("网络错误，创建订单失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
      <h1>结算页</h1>

      {!planId && <p>请先在定价页选择一个套餐。</p>}

      {planId && (
        <section style={{ marginTop: 16 }}>
          <div>
            当前选择的套餐 ID：
            <strong>{planId}</strong>
          </div>

          <button
            type="button"
            style={{
              marginTop: 16,
              padding: "8px 16px",
              borderRadius: 4,
              border: "none",
              backgroundColor: "#000",
              color: "#fff",
              cursor: "pointer",
            }}
            onClick={handleCreateOrder}
            disabled={submitting}
          >
            {submitting ? "创建订单中..." : "确认下单"}
          </button>

          {error && (
            <p style={{ marginTop: 12, color: "red" }}>
              {error}
              {error.includes("未登录") && (
                <>
                  {" "}
                  <Link href="/login">去登录</Link>
                </>
              )}
            </p>
          )}

          {orderNo && (
            <div style={{ marginTop: 16, lineHeight: 1.8 }}>
              <div>
                订单已创建，订单号：<strong>{orderNo}</strong>
              </div>
              <div>
                支付链接：
                {paymentUrl ? (
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "blue" }}
                  >
                    点击前往支付
                  </a>
                ) : (
                  "暂未生成支付链接"
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                你可以在{" "}
                <Link href="/account/orders" style={{ color: "blue" }}>
                  我的订单
                </Link>{" "}
                中查看订单记录。
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default function CheckoutPage(): ReactElement {
  return (
    <Suspense
      fallback={
        <main style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
          <h1>结算页</h1>
          <p>加载中...</p>
        </main>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
