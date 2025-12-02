"use client";

import { useEffect, useState } from "react";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "CANCELED"
  | "REFUND_REQUESTED"
  | "REFUNDED";

interface AdminOrder {
  id: number;
  orderNo: string;
  userEmail: string;
  planName: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
}

interface OrdersResponse {
  code: string;
  data?: AdminOrder[];
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
    case "REFUND_REQUESTED":
      return "退款申请中";
    case "REFUNDED":
      return "已退款（历史订单）";
    default:
      return status;
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/orders");

        if (res.status === 401 || res.status === 403) {
          const text = await res.text();
          try {
            const parsed = JSON.parse(text);
            setError(parsed.message ?? "没有权限访问订单管理");
          } catch {
            setError("没有权限访问订单管理");
          }
          return;
        }

        const data = (await res
          .json()
          .catch(() => ({ code: "UNKNOWN_ERROR" } as OrdersResponse))) as OrdersResponse;

        if (!res.ok || data.code !== "OK" || !data.data) {
          setError(data.message ?? "获取订单列表失败");
          return;
        }

        setOrders(data.data);
      } catch {
        setError("网络错误，获取订单列表失败");
      } finally {
        setLoading(false);
      }
    }

    void fetchOrders();
  }, []);

  async function handleApproveRefund(order: AdminOrder) {
    if (order.status !== "REFUND_REQUESTED") {
      return;
    }

    const ok = window.confirm(
      `确定要同意订单「${order.orderNo}」的退款申请吗？订单将标记为历史订单（已退款）。`,
    );

    if (!ok) {
      return;
    }

    try {
      setUpdatingId(order.id);
      setError(null);

      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
      });

      const data = (await res
        .json()
        .catch(() => ({ code: "UNKNOWN_ERROR" }))) as {
        code: string;
        message?: string;
      };

      if (!res.ok || data.code !== "OK") {
        setError(data.message ?? "同意退款失败");
        return;
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, status: "REFUNDED" } : item,
        ),
      );
    } catch {
      setError("网络错误，同意退款失败");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>
      <h2>订单管理</h2>

      {error && (
        <p style={{ color: "red", marginTop: 12 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ marginTop: 12 }}>加载中...</p>
      ) : orders.length === 0 ? (
        <p style={{ marginTop: 12 }}>暂无订单数据。</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 12,
            fontSize: 14,
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>ID</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>订单号</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>用户邮箱</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>套餐</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>金额</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>状态</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>时间</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>管理操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  {order.id}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                    fontFamily: "monospace",
                  }}
                >
                  {order.orderNo}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {order.userEmail}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {order.planName}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  {order.amount} {order.currency}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {formatStatus(order.status)}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  <div>创建：{new Date(order.createdAt).toLocaleString()}</div>
                  {order.paidAt && (
                    <div style={{ marginTop: 2 }}>
                      支付：{new Date(order.paidAt).toLocaleString()}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  {order.status === "REFUND_REQUESTED" ? (
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => void handleApproveRefund(order)}
                    >
                      同意退款
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: "#999" }}>无操作</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}


