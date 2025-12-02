"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  subscriptionsCount: number;
  activeSubscription: {
    planName: string;
    status: "ACTIVE" | "CANCELED" | "EXPIRED";
    startAt: string;
    endAt: string;
  } | null;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  code: string;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

function canDeleteUser(user: AdminUser) {
  if (!user.activeSubscription) {
    return true;
  }

  if (user.activeSubscription.status !== "ACTIVE") {
    return true;
  }

  const now = new Date();
  const endAt = new Date(user.activeSubscription.endAt);

  return endAt <= now;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadUsers(targetPage: number) {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/users?page=${targetPage}`);

        if (res.status === 401 || res.status === 403) {
          const text = await res.text();
          try {
            const parsed = JSON.parse(text);
            setError(parsed.message ?? "没有权限访问用户管理");
          } catch {
            setError("没有权限访问用户管理");
          }
          return;
        }

        const data = (await res
          .json()
          .catch(() => ({} as ApiResponse<AdminUser[]>))) as ApiResponse<AdminUser[]>;

        if (!res.ok || data.code !== "OK" || !data.data) {
          setError(data.message ?? "获取用户列表失败");
          return;
        }

        setUsers(data.data);
        setPage(data.meta?.page ?? targetPage);
        setTotalPages(data.meta?.totalPages ?? 1);
      } catch {
        setError("网络错误，获取用户列表失败");
      } finally {
        setLoading(false);
      }
    }

    void loadUsers(1);
  }, []);

  async function toggleRole(user: AdminUser) {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";

    if (
      !window.confirm(
        `确定要将用户「${user.email}」的角色切换为「${
          nextRole === "ADMIN" ? "管理员" : "普通用户"
        }」吗？`,
      )
    ) {
      return;
    }

    try {
      setUpdatingId(user.id);
      setError(null);

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = (await res
        .json()
        .catch(() => ({} as ApiResponse<AdminUser>))) as ApiResponse<AdminUser>;

      if (!res.ok || data.code !== "OK" || !data.data) {
        setError(data.message ?? "更新用户角色失败");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)),
      );
    } catch {
      setError("网络错误，更新用户角色失败");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!canDeleteUser(user)) {
      setError("该用户当前仍在订阅期内，暂不允许删除");
      return;
    }

    if (!window.confirm(`确定要删除用户「${user.email}」吗？此操作不可恢复。`)) {
      return;
    }

    try {
      setUpdatingId(user.id);
      setError(null);

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      const data = (await res
        .json()
        .catch(() => ({} as ApiResponse<unknown>))) as ApiResponse<unknown>;

      if (!res.ok || data.code !== "OK") {
        setError(data.message ?? "删除用户失败");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      setError("网络错误，删除用户失败");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>
      <h2>用户信息管理</h2>

      {error && (
        <p style={{ color: "red", marginTop: 12 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ marginTop: 12 }}>加载中...</p>
      ) : users.length === 0 ? (
        <p style={{ marginTop: 12 }}>暂无用户数据。</p>
      ) : (
        <>
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
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>序号</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                邮箱
              </th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                姓名
              </th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                角色
              </th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                订阅数
              </th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                当前订阅
              </th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                订单数
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
            {users.map((user, index) => (
              <tr key={user.id}>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {user.email}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {user.name ?? "未设置"}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  {user.role === "ADMIN" ? "管理员" : "普通用户"}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  {user.subscriptionsCount}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {user.activeSubscription ? (
                    <div style={{ lineHeight: 1.6 }}>
                      <div>{user.activeSubscription.planName}</div>
                      <div style={{ fontSize: 12, color: "#555" }}>
                        状态：
                        {user.activeSubscription.status === "ACTIVE"
                          ? "生效中"
                          : user.activeSubscription.status === "CANCELED"
                            ? "已取消"
                            : "已过期"}
                      </div>
                      <div style={{ fontSize: 12, color: "#555" }}>
                        到期：
                        {new Date(
                          user.activeSubscription.endAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "#999" }}>
                      暂无生效订阅
                    </span>
                  )}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                    textAlign: "center",
                  }}
                >
                  {user.ordersCount}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {new Date(user.createdAt).toLocaleString()}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  {new Date(user.updatedAt).toLocaleString()}
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
                    disabled={updatingId === user.id}
                    onClick={() => void toggleRole(user)}
                  >
                    {user.role === "ADMIN" ? "设为普通用户" : "设为管理员"}
                  </button>
                  <button
                    type="button"
                    style={{ marginLeft: 8, color: "red" }}
                    disabled={
                      updatingId === user.id || !canDeleteUser(user)
                    }
                    onClick={() => void handleDelete(user)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
              fontSize: 14,
            }}
          >
            <span>
              第 {page} / {totalPages} 页
            </span>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => {
                if (page > 1 && !loading) {
                  void (async () => {
                    try {
                      setLoading(true);
                      setError(null);
                      const res = await fetch(
                        `/api/admin/users?page=${page - 1}`,
                      );
                      const data = (await res
                        .json()
                        .catch(
                          () => ({ code: "UNKNOWN_ERROR" } as ApiResponse<AdminUser[]>),
                        )) as ApiResponse<AdminUser[]>;

                      if (!res.ok || data.code !== "OK" || !data.data) {
                        setError(data.message ?? "获取用户列表失败");
                        return;
                      }

                      setUsers(data.data);
                      setPage(data.meta?.page ?? page - 1);
                      setTotalPages(data.meta?.totalPages ?? 1);
                    } catch {
                      setError("网络错误，获取用户列表失败");
                    } finally {
                      setLoading(false);
                    }
                  })();
                }
              }}
            >
              上一页
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => {
                if (page < totalPages && !loading) {
                  void (async () => {
                    try {
                      setLoading(true);
                      setError(null);
                      const res = await fetch(
                        `/api/admin/users?page=${page + 1}`,
                      );
                      const data = (await res
                        .json()
                        .catch(
                          () => ({ code: "UNKNOWN_ERROR" } as ApiResponse<AdminUser[]>),
                        )) as ApiResponse<AdminUser[]>;

                      if (!res.ok || data.code !== "OK" || !data.data) {
                        setError(data.message ?? "获取用户列表失败");
                        return;
                      }

                      setUsers(data.data);
                      setPage(data.meta?.page ?? page + 1);
                      setTotalPages(data.meta?.totalPages ?? 1);
                    } catch {
                      setError("网络错误，获取用户列表失败");
                    } finally {
                      setLoading(false);
                    }
                  })();
                }
              }}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </section>
  );
}

