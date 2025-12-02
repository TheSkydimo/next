import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@/lib/utils/authValidators";
import { UserRole } from "@/app/generated/prisma/client";
import { generateEmailVerificationCode } from "@/lib/utils/codeGenerator";

const DEV_ADMIN_EMAIL = "admin@example.com";
const DEV_ADMIN_NAME = "开发管理员";

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const verificationCode = generateEmailVerificationCode();
  const verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分钟

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      isEmailVerified: false,
      verificationCode,
      verificationExpiresAt,
    },
  });

  // 不返回 passwordHash
  const { passwordHash: _ignored, ...safeUser } = user;
  return safeUser;
}

async function ensureDevAdminUser(email: string, password: string) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (email !== DEV_ADMIN_EMAIL) {
    return null;
  }

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);

    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: DEV_ADMIN_NAME,
        role: UserRole.ADMIN,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  return user;
}

export async function authenticateUser(input: LoginInput) {
  let user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    // 开发环境内置管理员帐号：admin@example.com
    user = await ensureDevAdminUser(input.email, input.password);
  }

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const { passwordHash: _ignored, ...safeUser } = user;
  return safeUser;
}

export async function issuePasswordResetCode(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    // 为避免泄露用户是否存在，静默返回
    return null;
  }

  const verificationCode = generateEmailVerificationCode();
  const verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode,
      verificationExpiresAt,
    },
  });

  return { email: user.email, code: verificationCode };
}

export async function resetPasswordWithCode(input: ResetPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.verificationCode) {
    throw new Error("VERIFICATION_NOT_FOUND");
  }

  if (
    user.verificationExpiresAt &&
    user.verificationExpiresAt.getTime() < Date.now()
  ) {
    throw new Error("VERIFICATION_EXPIRED");
  }

  if (user.verificationCode !== input.code) {
    throw new Error("VERIFICATION_CODE_INVALID");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      verificationCode: null,
      verificationExpiresAt: null,
    },
  });

  const { passwordHash: _ignored, ...safeUser } = updated;
  return safeUser;
}

// 仅允许管理员账号使用的重置流程（管理端）
export async function issueAdminPasswordResetCode(
  input: ForgotPasswordInput,
) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || user.role !== UserRole.ADMIN) {
    throw new Error("NOT_ADMIN_USER");
  }

  const verificationCode = generateEmailVerificationCode();
  const verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode,
      verificationExpiresAt,
    },
  });

  return { email: user.email, code: verificationCode };
}

export async function resetAdminPasswordWithCode(
  input: ResetPasswordInput,
) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || user.role !== UserRole.ADMIN || !user.verificationCode) {
    throw new Error("VERIFICATION_NOT_FOUND");
  }

  if (
    user.verificationExpiresAt &&
    user.verificationExpiresAt.getTime() < Date.now()
  ) {
    throw new Error("VERIFICATION_EXPIRED");
  }

  if (user.verificationCode !== input.code) {
    throw new Error("VERIFICATION_CODE_INVALID");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      verificationCode: null,
      verificationExpiresAt: null,
    },
  });

  const { passwordHash: _ignored, ...safeUser } = updated;
  return safeUser;
}


