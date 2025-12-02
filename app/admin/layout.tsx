"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

async function logoutRequest(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/logout", { method: "POST" });

    if (!res.ok) {
      return false;
    }

    const data = await res.json().catch(() => null);
    return data?.code === "OK";
  } catch {
    return false;
  }
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // 管理员登录页和找回密码页不展示后台菜单，只展示表单本身
  if (pathname === "/admin/login" || pathname === "/admin/forgot-password") {
    return (
      <main
        style={{
          maxWidth: 480,
          margin: "40px auto",
          padding: "0 16px",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {children}
      </main>
    );
  }

  async function handleLogout() {
    const ok = await logoutRequest();

    if (!ok) {
      window.alert("退出失败，请稍后重试");
      return;
    }

    router.push("/admin/login");
  }

  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <aside
        style={{
          width: 220,
          borderRight: "1px solid #e5e5e5",
          padding: "24px 16px",
        }}
      >
        <h1 style={{ fontSize: 20, marginBottom: 24 }}>管理后台</h1>
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 14,
          }}
        >
          <Link href="/admin/plans">套餐管理</Link>
          <Link href="/admin/users">普通用户管理</Link>
          <Link href="/admin/admins">管理员管理</Link>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            marginTop: 24,
            fontSize: 14,
            color: "#d00",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          退出登录
        </button>
      </aside>

      <section style={{ flex: 1, padding: "24px 24px" }}>{children}</section>
    </main>
  );
}
