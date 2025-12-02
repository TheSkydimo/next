"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderStatus = "PENDING" | "PAID" | "CANCELED" | "REFUNDED";
type PaymentChannel = "ALIPAY" | "WECHAT" | "STRIPE" | "PAYPAL";

interface OrderItem {
  id: number;
  orderNo: string;
  planName: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentChannel: PaymentChannel;
  createdAt: string;
  paidAt: string | null;
}

interface OrdersResponse {
  code: string;
  data?: OrderItem[];
  message?: string;
}

function formatStatus(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "待支付";
    case "PAID":
      return "已支付";
    case "CANCELED":
      return "已取消";
    case "REFUNDED":
      return "已退款";
    default:
      return status;
  }
}

function formatChannel(channel: PaymentChannel) {
  switch (channel) {
    case "ALIPAY":
      return "支付宝";
    case "WECHAT":
      return "微信支付";
    case "STRIPE":
      return "Stripe";
    case "PAYPAL":
      return "PayPal";
    default:
      return channel;
  }
}

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/account/orders", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 401) {
          if (!cancelled) {
            setError("未登录，请先登录");
          }
          return;
        }

        const data: OrdersResponse = await res.json();

        if (!res.ok || data.code !== "OK" || !data.data) {
          if (!cancelled) {
            setError(data.message ?? "获取订单列表失败");
          }
          return;
        }

        if (!cancelled) {
          setOrders(data.data);
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

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>订单信息</h1>

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

      {!loading && !error && orders.length === 0 && (
        <p style={{ marginTop: 24 }}>暂无订单</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
              fontWeight: 600,
              padding: "8px 0",
              borderBottom: "1px solid #ddd",
              fontSize: 14,
            }}
          >
            <span>订单信息</span>
            <span>金额</span>
            <span>状态</span>
            <span>时间</span>
          </div>

          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
                padding: "10px 0",
                borderBottom: "1px solid #f0f0f0",
                fontSize: 14,
              }}
            >
              <div>
                <div>
                  <strong>{order.planName}</strong>
                </div>
                <div style={{ color: "#555", marginTop: 4 }}>
                  订单号：{order.orderNo}
                </div>
                <div style={{ color: "#555", marginTop: 2 }}>
                  支付渠道：{formatChannel(order.paymentChannel)}
                </div>
              </div>

              <div>
                {order.amount} {order.currency}
              </div>

              <div>{formatStatus(order.status)}</div>

              <div style={{ color: "#555" }}>
                <div>
                  创建：{new Date(order.createdAt).toLocaleString()}
                </div>
                {order.paidAt && (
                  <div style={{ marginTop: 2 }}>
                    支付：{new Date(order.paidAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

