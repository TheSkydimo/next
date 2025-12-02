import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  // 在开发环境抛出更明显的错误，生产环境请确保已配置环境变量
  console.warn("AUTH_SECRET 环境变量未配置，JWT 功能将无法正常工作");
}

export interface AuthTokenPayload {
  userId: number;
  role: "USER" | "ADMIN";
}

export function signAuthToken(payload: AuthTokenPayload): string {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET_NOT_CONFIGURED");
  }

  return jwt.sign(payload, AUTH_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET_NOT_CONFIGURED");
  }

  return jwt.verify(token, AUTH_SECRET) as AuthTokenPayload;
}


