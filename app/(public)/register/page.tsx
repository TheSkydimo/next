"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateCaptchaCode } from "@/lib/utils/captcha";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"REGISTER" | "VERIFY">("REGISTER");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

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

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captcha.toUpperCase()) {
      setError("验证码错误");
      refreshCaptcha();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        let message: string | undefined = data.message;

        // 后端 zod 校验错误时，返回 { code: 'VALIDATION_ERROR', errors: { fieldErrors, formErrors } }
        if (!message && data.code === "VALIDATION_ERROR" && data.errors) {
          const fieldErrors = data.errors.fieldErrors as Record<string, string[]> | undefined;
          const formErrors = data.errors.formErrors as string[] | undefined;

          message =
            fieldErrors?.password?.[0] ||
            fieldErrors?.email?.[0] ||
            formErrors?.[0];
        }

        setError(message ?? "注册失败");
      } else if (data.code === "VERIFICATION_REQUIRED") {
        // 后端已发送邮箱验证码，进入激活步骤
        setRegisteredEmail(email);
        setStep("VERIFY");
        setSuccess("注册信息已提交，请查看邮箱验证码并完成激活");
      } else {
        setSuccess(data.message ?? "注册成功");
      }
    } catch (e) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!registeredEmail) {
      setError("缺少待激活的邮箱信息，请重新注册。");
      return;
    }

    if (!verifyCode.trim()) {
      setError("请输入邮箱中的激活码");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, code: verifyCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "激活失败，请稍后重试");
      } else {
        setSuccess("邮箱激活成功，已自动登录，将跳转到登录页...");
        // 激活成功后 1 秒跳转回登录页
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "40px auto", padding: "0 16px" }}>
      <h1>注册</h1>

      {step === "REGISTER" && (
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
          <span>昵称（可选）</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的昵称"
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
          <span>确认密码</span>
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
              style={{ width: "100%" }}
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
          {loading ? "注册中..." : "注册"}
        </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
        </form>
      )}

      {step === "VERIFY" && (
        <form onSubmit={handleVerify} style={{ display: "grid", gap: 12, marginTop: 24 }}>
          <p style={{ fontSize: 14, color: "#555" }}>
            我们已向 <strong>{registeredEmail}</strong> 发送了激活码，请填写邮箱中的 6 位数字激活码完成注册。
          </p>

          <label style={{ display: "grid", gap: 4 }}>
            <span>激活码</span>
            <input
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="请输入邮箱中的激活码"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "激活中..." : "提交激活"}
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
        </form>
      )}

      <p style={{ marginTop: 16 }}>
        已有账号？ <Link href="/login">去登录</Link>
      </p>
    </main>
  );
}

