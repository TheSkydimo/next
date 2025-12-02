"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CurrentUser {
  id: number;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/account/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 401) {
          if (!cancelled) {
            setError("未登录，请先登录");
          }
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          if (!cancelled) {
            setError(data.message ?? "获取用户信息失败");
          }
          return;
        }

        if (!cancelled) {
          setUser(data.data as CurrentUser);
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

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>首页</h1>

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

      {!loading && user && (
        <section style={{ marginTop: 24 }}>
          <h2>基本信息</h2>
          <div style={{ marginTop: 12, lineHeight: 1.8 }}>
            <div>
              <strong>邮箱：</strong>
              {user.email}
            </div>
            <div>
              <strong>姓名：</strong>
              {user.name ?? "未设置"}
            </div>
            <div>
              <strong>角色：</strong>
              {user.role === "ADMIN" ? "管理员" : "普通用户"}
            </div>
            <div>
              <strong>注册时间：</strong>
              {new Date(user.createdAt).toLocaleString()}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


