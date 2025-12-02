"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateCaptchaCode } from "@/lib/utils/captcha";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function refreshCaptcha() {
    setCaptcha(generateCaptchaCode());
    setCaptchaInput("");
  }

  useEffect(() => {
    // 首次在客户端挂载后生成一次验证码，避免 SSR / CSR 不一致
    refreshCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (captchaInput.trim().toUpperCase() !== captcha.toUpperCase()) {
      setError("验证码错误");
      refreshCaptcha();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

        const data: {
          code?: string;
          message?: string;
          data?: {
            role?: "USER" | "ADMIN";
          };
        } = await res.json();

        if (!res.ok || data.code !== "OK") {
        setError(data.message ?? "登录失败");
          return;
        }

        if (data.data?.role === "ADMIN") {
          setError("该账号为管理员账号，请使用 /admin/login 入口登录后台");
          return;
        }

        setSuccess("登录成功");
        // 登录成功后跳转到用户信息管理页
        router.push("/account");
    } catch (e) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "40px auto", padding: "0 16px" }}>
      <h1>登录</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span>邮箱</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span>密码</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{ fontSize: 12, padding: "4px 8px", whiteSpace: "nowrap" }}
            >
              {showPassword ? "隐藏密码" : "显示密码"}
            </button>
          </div>
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span>验证码</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              placeholder="请输入右侧验证码"
              style={{ width: "100%" }}
            />
            <button
              type="button"
              onClick={refreshCaptcha}
              style={{
                padding: "4px 8px",
                fontFamily: "monospace",
                letterSpacing: 2,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              title="点击更换验证码"
            >
              {captcha}
            </button>
          </div>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
      </form>

      <p style={{ marginTop: 16 }}>
        还没有账号？ <Link href="/register">去注册</Link>
      </p>
      <p style={{ marginTop: 8, fontSize: 14 }}>
        忘记密码？ <Link href="/forgot-password">通过邮箱重置</Link>
      </p>
    </main>
  );
}


