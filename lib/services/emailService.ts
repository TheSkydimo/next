/**
 * 简单的邮件服务封装。
 *
 * 当前实现仅在服务端控制台输出验证码，方便本地开发调试；
 * 后续可以替换为 nodemailer / 第三方邮件服务。
 */
export async function sendVerificationEmail(to: string, code: string) {
  // TODO: 集成真实邮件服务（如 nodemailer、SendGrid 等）
  // 这里先简单输出到控制台，方便查看验证码
  // eslint-disable-next-line no-console
  console.log(
    `[EmailService] Send verification code to ${to}: ${code} (仅开发环境控制台日志)`,
  );
}


