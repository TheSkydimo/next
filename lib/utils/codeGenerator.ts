export function generateEmailVerificationCode() {
  // 6 位数字验证码
  return Math.floor(100000 + Math.random() * 900000).toString();
}


