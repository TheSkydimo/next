import nodemailer from "nodemailer";
import { appConfig } from "@/lib/config";

type SendMailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const DEFAULT_FROM =
  process.env.EMAIL_FROM || `${appConfig.appName} <noreply@skydimo.com>`;

/**
 * 创建可复用的 Nodemailer transporter（懒加载 & 单例）。
 *
 * - 开发环境且未配置 SMTP_* 时，返回 null，使用控制台日志兜底，方便本地调试。
 * - 生产环境必须配置 SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS，否则抛出错误。
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port =
    process.env.SMTP_PORT != null
      ? Number.parseInt(process.env.SMTP_PORT, 10)
      : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[EmailService] SMTP 配置缺失，已回退为控制台输出模式（仅开发环境）。",
      );
      return null;
    }

    throw new Error(
      "[EmailService] SMTP 配置缺失，请在生产环境中配置 SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS。",
    );
  }

  const secure =
    process.env.SMTP_SECURE === "true" ||
    (!Number.isNaN(port) && port === 465);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

let cachedTransporter: ReturnType<typeof createTransporter> | null | undefined;

function getTransporter() {
  if (cachedTransporter === undefined) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
}

/**
 * 通用发信函数。
 */
export async function sendMail(options: SendMailOptions) {
  const transporter = getTransporter();

  // 开发环境未配置 SMTP：仅打印日志，方便调试。
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log("[EmailService][DEV]", {
      from: DEFAULT_FROM,
      ...options,
    });
    return;
  }

  await transporter.sendMail({
    from: DEFAULT_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

/**
 * 发送邮箱验证码（注册、重置密码、修改邮箱 等共用）。
 *
 * 默认使用邮箱：noreply@skydimo.com
 * 可通过环境变量 EMAIL_FROM 覆盖，例如：
 *   EMAIL_FROM="Membership App <noreply@skydimo.com>"
 */
export async function sendVerificationEmail(to: string, code: string) {
  const subject = `【${appConfig.appName}】邮箱验证码`;
  const text = `您好！\n\n您的验证码是：${code}\n验证码有效期为 10 分钟，请勿泄露给他人。\n\n如果这不是您本人的操作，请忽略本邮件。\n\n此致\n${appConfig.appName} 团队`;
  const html = `<p>您好！</p>
<p>您的验证码是：<strong style="font-size: 20px;">${code}</strong></p>
<p>验证码有效期为 <strong>10 分钟</strong>，请勿泄露给他人。</p>
<p>如果这不是您本人的操作，请忽略本邮件。</p>
<br />
<p>此致</p>
<p>${appConfig.appName} 团队</p>`;

  await sendMail({
    to,
    subject,
    text,
    html,
  });
}

