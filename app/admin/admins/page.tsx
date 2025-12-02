"use client";

import { useEffect, useState } from "react";

interface AdminInfo {
  id: number;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  code: string;
  data?: T;
  message?: string;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadAdmins() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/admins");

        if (res.status === 401 || res.status === 403) {
          const text = await res.text();
          try {
            const parsed = JSON.parse(text);
            setError(parsed.message ?? "没有权限访问管理员管理");
          } catch {
            setError("没有权限访问管理员管理");
          }
          return;
        }

        const data = (await res
          .json()
          .catch(() => ({} as ApiResponse<AdminInfo[]>))) as ApiResponse<AdminInfo[]>;

        if (!res.ok || data.code !== "OK" || !data.data) {
          setError(data.message ?? "获取管理员列表失败");
          return;
        }

        setAdmins(data.data);
      } catch {
        setError("网络错误，获取管理员列表失败");
      } finally {
        setLoading(false);
      }
    }

    void loadAdmins();
  }, []);

  async function downgradeToUser(admin: AdminInfo) {
    if (
      !window.confirm(
        `确定要将管理员「${admin.email}」改为普通用户吗？此操作会影响其后台访问权限。`,
      )
    ) {
      return;
    }

    try {
      setUpdatingId(admin.id);
      setError(null);

      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "USER" }),
      });

      const data = (await res
        .json()
        .catch(() => ({} as ApiResponse<AdminInfo>))) as ApiResponse<AdminInfo>;

      if (!res.ok || data.code !== "OK" || !data.data) {
        setError(data.message ?? "更新管理员角色失败");
        return;
      }

      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    } catch {
      setError("网络错误，更新管理员角色失败");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>
      <h2>管理员信息管理</h2>

      {error && (
        <p style={{ color: "red", marginTop: 12 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ marginTop: 12 }}>加载中...</p>
      ) : admins.length === 0 ? (
        <p style={{ marginTop: 12 }}>当前没有管理员账号。</p>
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
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                邮箱
              </th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                姓名
              </th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                注册时间
              </th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                最近更新
              </th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                管理操作
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  {admin.id}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {admin.email}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {admin.name ?? "未设置"}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {new Date(admin.createdAt).toLocaleString()}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {new Date(admin.updatedAt).toLocaleString()}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  <button
                    type="button"
                    disabled={updatingId === admin.id}
                    onClick={() => void downgradeToUser(admin)}
                  >
                    设为普通用户
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}



