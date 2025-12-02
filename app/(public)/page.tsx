import Link from "next/link";

export default function PublicHomePage() {
  return (
    <main style={{ padding: "24px" }}>
      <h1>会员系统首页</h1>
      <p style={{ marginTop: 16 }}>
        <Link href="/login">登录</Link> | <Link href="/register">注册</Link>
      </p>
    </main>
  );
}


