"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LoginResponse = {
  code: string;
  message?: string;
  data?: {
    id: number;
    email: string;
    name: string | null;
    role: "USER" | "ADMIN";
  };
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(
        () => ({ code: "UNKNOWN" }) as LoginResponse,
      )) as LoginResponse;

      if (!res.ok || data.code !== "OK" || !data.data) {
        setError(data.message ?? "登录失败");
        return;
      }

      if (data.data.role !== "ADMIN") {
        setError("该账号不是管理员账号");
        return;
      }

      router.push("/admin/plans");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "40px auto", padding: "0 16px" }}>
      <h1>管理员登录</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 12, marginTop: 16 }}
      >
        <label style={{ display: "grid", gap: 4 }}>
          <span>管理员邮箱</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span>密码</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "登录中..." : "登录后台"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        忘记密码？ <Link href="/admin/forgot-password">通过邮箱重置</Link>
      </p>
    </main>
  );
}

