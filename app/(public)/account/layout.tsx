"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    try {
      setLogoutError(null);
      setLogoutLoading(true);

      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLogoutError(data.message ?? "退出登录失败，请稍后重试");
        return;
      }

      router.push("/login");
    } catch {
      setLogoutError("网络错误，退出登录失败");
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "40px auto",
        padding: "0 16px",
        display: "flex",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      <aside
        style={{
          width: 200,
          flexShrink: 0,
          borderRight: "1px solid #eee",
          paddingRight: 16,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>账户中心</h2>
        <nav style={{ display: "grid", gap: 8, fontSize: 14 }}>
          <Link href="/account">首页</Link>
          <Link href="/account/profile">基本信息</Link>
          <Link href="/account/subscription">订阅信息</Link>
          <Link href="/account/orders">订单信息</Link>
        </nav>
      </aside>
      <section style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div />
          <div style={{ textAlign: "right" }}>
            {logoutError && (
              <p
                style={{
                  color: "red",
                  fontSize: 12,
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                {logoutError}
              </p>
            )}
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? "退出中..." : "退出登录"}
            </button>
          </div>
        </div>
        <div>{children}</div>
      </section>
    </main>
  );
}

