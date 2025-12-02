"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "REQUEST" | "RESET";

interface ApiResponse<T = unknown> {
  code?: string;
  message?: string;
  data?: T;
}

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("REQUEST");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("请输入管理员邮箱");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data: ApiResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message ?? "发送重置邮件失败");
        return;
      }

      setSuccess(
        data.message ??
          "如果该管理员邮箱已注册，我们会发送一封包含激活码的邮件，请按邮件提示操作。",
      );
      setStep("RESET");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!code.trim()) {
      setError("请输入激活码");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim(), newPassword }),
      });

      const data: ApiResponse = await res.json().catch(() => ({}));

      if (!res.ok || data.code !== "OK") {
        setError(data.message ?? "重置密码失败");
        return;
      }

      setSuccess("密码重置成功，已自动登录，正在跳转到管理员登录页...");

      setTimeout(() => {
        router.push("/admin/login");
      }, 1000);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "40px auto", padding: "0 16px" }}>
      <h1>管理员找回密码</h1>

      {step === "REQUEST" && (
        <form
          onSubmit={handleRequest}
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

          <button type="submit" disabled={loading}>
            {loading ? "发送中..." : "发送激活码到邮箱"}
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
        </form>
      )}

      {step === "RESET" && (
        <form
          onSubmit={handleReset}
          style={{ display: "grid", gap: 12, marginTop: 24 }}
        >
          <p style={{ fontSize: 14, color: "#555" }}>
            我们已向 <strong>{email}</strong> 发送了激活码。请填写激活码并设置新的登录密码。
          </p>

          <label style={{ display: "grid", gap: 4 }}>
            <span>激活码</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>新密码</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
                alignItems: "center",
              }}
            >
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                style={{ fontSize: 12, padding: "4px 8px", whiteSpace: "nowrap" }}
              >
                {showNewPassword ? "隐藏密码" : "显示密码"}
              </button>
            </div>
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span>确认新密码</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
                alignItems: "center",
              }}
            >
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                style={{ fontSize: 12, padding: "4px 8px", whiteSpace: "nowrap" }}
              >
                {showConfirmPassword ? "隐藏密码" : "显示密码"}
              </button>
            </div>
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "重置中..." : "提交重置"}
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
        </form>
      )}

      <p style={{ marginTop: 16 }}>
        已记起密码？ <Link href="/admin/login">返回管理员登录</Link>
      </p>
    </main>
  );
}


