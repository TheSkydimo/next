"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

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
      </aside>

      <section style={{ flex: 1, padding: "24px 24px" }}>{children}</section>
    </main>
  );
}
