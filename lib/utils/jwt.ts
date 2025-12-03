import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  // 在开发环境抛出更明显的错误，生产环境请确保已配置环境变量
  console.warn("AUTH_SECRET 环境变量未配置，JWT 功能将无法正常工作");
}

// 使用 Web Crypto 兼容的对称密钥
const AUTH_SECRET_KEY = AUTH_SECRET
  ? new TextEncoder().encode(AUTH_SECRET)
  : null;

export interface AuthTokenPayload {
  userId: number;
  role: "USER" | "ADMIN";
}

export async function signAuthToken(
  payload: AuthTokenPayload,
): Promise<string> {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET_NOT_CONFIGURED");
  }

  if (!AUTH_SECRET_KEY) {
    throw new Error("AUTH_SECRET_NOT_CONFIGURED");
  }

  const jwt = await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("7d")
    .sign(AUTH_SECRET_KEY);

  return jwt;
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthTokenPayload> {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET_NOT_CONFIGURED");
  }

  if (!AUTH_SECRET_KEY) {
    throw new Error("AUTH_SECRET_NOT_CONFIGURED");
  }

  const { payload } = await jwtVerify(token, AUTH_SECRET_KEY);

  return payload as unknown as AuthTokenPayload;
}


