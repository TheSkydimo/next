"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

interface CurrentUser {
  id: number;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = unknown> {
  code?: string;
  message?: string;
  data?: T;
  errors?: unknown;
}

export default function AccountProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPasswordForPassword, setCurrentPasswordForPassword] =
    useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailStep, setEmailStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
  const [emailCode, setEmailCode] = useState("");
  const [pendingNewEmail, setPendingNewEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [processingEmail, setProcessingEmail] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        setLoadingUser(true);
        setUserError(null);

        const res = await fetch("/api/account/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 401) {
          if (!cancelled) {
            setUserError("未登录，请先登录");
          }
          return;
        }

        const data = (await res.json()) as ApiResponse<CurrentUser>;

        if (!res.ok || data.code !== "OK" || !data.data) {
          if (!cancelled) {
            setUserError(data.message ?? "获取用户信息失败");
          }
          return;
        }

        if (!cancelled) {
          setUser(data.data);
          setName(data.data.name ?? "");
        }
      } catch {
        if (!cancelled) {
          setUserError("网络错误，请稍后重试");
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    setSavingProfile(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined }),
      });

      const data = (await res.json()) as ApiResponse<CurrentUser>;

      if (!res.ok || data.code !== "OK") {
        let message = data.message;

        if (!message && data.code === "VALIDATION_ERROR" && data.errors) {
          const errors = data.errors as {
            fieldErrors?: Record<string, string[]>;
            formErrors?: string[];
          };
          message =
            errors.fieldErrors?.name?.[0] ?? errors.formErrors?.[0] ?? "";
        }

        setProfileError(message || "更新资料失败");
        return;
      }

      if (data.data) {
        setUser(data.data);
      }

      setProfileMessage("资料已更新");
    } catch (err) {
      console.error(err);
      setProfileError("网络错误，请稍后重试");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPasswordForPassword,
          newPassword,
        }),
      });

      const data = (await res.json()) as ApiResponse;

      if (!res.ok || data.code !== "OK") {
        setPasswordError(data.message ?? "修改密码失败");
        return;
      }

      setPasswordMessage("密码修改成功");
      setCurrentPasswordForPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error(err);
      setPasswordError("网络错误，请稍后重试");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleEmailRequest(e: FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailMessage(null);

    if (!newEmail.trim()) {
      setEmailError("请输入新邮箱");
      return;
    }

    setProcessingEmail(true);

    try {
      const res = await fetch("/api/account/email/request-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: newEmail.trim(),
          currentPassword: currentPasswordForEmail,
        }),
      });

      const data = (await res.json()) as ApiResponse;

      if (!res.ok || data.code !== "OK") {
        setEmailError(data.message ?? "请求修改邮箱失败");
        return;
      }

      setPendingNewEmail(newEmail.trim());
      setEmailStep("VERIFY");
      setEmailMessage("验证码已发送至新邮箱，请查收并填写验证码完成修改");
    } catch (err) {
      console.error(err);
      setEmailError("网络错误，请稍后重试");
    } finally {
      setProcessingEmail(false);
    }
  }

  async function handleEmailVerify(e: FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailMessage(null);

    if (!pendingNewEmail) {
      setEmailError("缺少待修改的新邮箱信息，请重新发起邮箱变更请求");
      return;
    }

    if (!emailCode.trim()) {
      setEmailError("请输入邮箱中的验证码");
      return;
    }

    setProcessingEmail(true);

    try {
      const res = await fetch("/api/account/email/confirm-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: pendingNewEmail,
          code: emailCode.trim(),
        }),
      });

      const data = (await res.json()) as ApiResponse<CurrentUser>;

      if (!res.ok || data.code !== "OK") {
        setEmailError(data.message ?? "邮箱修改失败");
        return;
      }

      if (data.data) {
        setUser(data.data);
      }

      setEmailMessage("邮箱修改成功");
      setEmailStep("REQUEST");
      setCurrentPasswordForEmail("");
      setNewEmail("");
      setEmailCode("");
      setPendingNewEmail("");
    } catch (err) {
      console.error(err);
      setEmailError("网络错误，请稍后重试");
    } finally {
      setProcessingEmail(false);
    }
  }

  return (
    <div>
      <h1>基本信息</h1>

      {loadingUser && <p>加载中...</p>}

      {!loadingUser && userError && (
        <p style={{ color: "red", marginTop: 16 }}>
          {userError}
          {userError.includes("未登录") && (
            <>
              {" "}
              <Link href="/login">去登录</Link>
            </>
          )}
        </p>
      )}

      {!loadingUser && user && (
        <>
          <section style={{ marginTop: 24 }}>
            <h2>账户概览</h2>
            <div style={{ marginTop: 12, lineHeight: 1.8 }}>
              <div>
                <strong>当前邮箱：</strong>
                {user.email}
              </div>
              <div>
                <strong>昵称：</strong>
                {user.name ?? "未设置"}
              </div>
              <div>
                <strong>角色：</strong>
                {user.role === "ADMIN" ? "管理员" : "普通用户"}
              </div>
            </div>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>修改昵称</h2>
            <form
              onSubmit={handleProfileSubmit}
              style={{ marginTop: 12, display: "grid", gap: 12, maxWidth: 400 }}
            >
              <label style={{ display: "grid", gap: 4 }}>
                <span>昵称</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入新的昵称"
                />
              </label>

              <button type="submit" disabled={savingProfile}>
                {savingProfile ? "保存中..." : "保存"}
              </button>

              {profileError && (
                <p style={{ color: "red" }}>{profileError}</p>
              )}
              {profileMessage && (
                <p style={{ color: "green" }}>{profileMessage}</p>
              )}
            </form>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>修改密码</h2>
            <form
              onSubmit={handlePasswordSubmit}
              style={{ marginTop: 12, display: "grid", gap: 12, maxWidth: 400 }}
            >
              <label style={{ display: "grid", gap: 4 }}>
                <span>当前密码</span>
                <input
                  type="password"
                  value={currentPasswordForPassword}
                  onChange={(e) =>
                    setCurrentPasswordForPassword(e.target.value)
                  }
                  required
                />
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                <span>新密码</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                <span>确认新密码</span>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </label>

              <button type="submit" disabled={changingPassword}>
                {changingPassword ? "修改中..." : "修改密码"}
              </button>

              {passwordError && (
                <p style={{ color: "red" }}>{passwordError}</p>
              )}
              {passwordMessage && (
                <p style={{ color: "green" }}>{passwordMessage}</p>
              )}
            </form>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>修改邮箱</h2>

            {emailStep === "REQUEST" && (
              <form
                onSubmit={handleEmailRequest}
                style={{
                  marginTop: 12,
                  display: "grid",
                  gap: 12,
                  maxWidth: 400,
                }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span>新邮箱</span>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="请输入新的登录邮箱"
                  />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span>当前密码（用于安全验证）</span>
                  <input
                    type="password"
                    value={currentPasswordForEmail}
                    onChange={(e) =>
                      setCurrentPasswordForEmail(e.target.value)
                    }
                    required
                  />
                </label>

                <button type="submit" disabled={processingEmail}>
                  {processingEmail ? "提交中..." : "发送验证码到新邮箱"}
                </button>

                {emailError && <p style={{ color: "red" }}>{emailError}</p>}
                {emailMessage && (
                  <p style={{ color: "green" }}>{emailMessage}</p>
                )}
              </form>
            )}

            {emailStep === "VERIFY" && (
              <form
                onSubmit={handleEmailVerify}
                style={{
                  marginTop: 12,
                  display: "grid",
                  gap: 12,
                  maxWidth: 400,
                }}
              >
                <p style={{ fontSize: 14, color: "#555" }}>
                  我们已向 <strong>{pendingNewEmail}</strong> 发送了验证码，请填写
                  6 位数字验证码完成邮箱修改。
                </p>

                <label style={{ display: "grid", gap: 4 }}>
                  <span>验证码</span>
                  <input
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    placeholder="请输入新邮箱中的验证码"
                    required
                  />
                </label>

                <button type="submit" disabled={processingEmail}>
                  {processingEmail ? "提交中..." : "确认修改邮箱"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmailStep("REQUEST");
                    setEmailError(null);
                    setEmailMessage(null);
                    setEmailCode("");
                    setPendingNewEmail("");
                  }}
                  style={{ fontSize: 13 }}
                >
                  返回重新填写
                </button>

                {emailError && <p style={{ color: "red" }}>{emailError}</p>}
                {emailMessage && (
                  <p style={{ color: "green" }}>{emailMessage}</p>
                )}
              </form>
            )}
          </section>
        </>
      )}
    </div>
  );
}


