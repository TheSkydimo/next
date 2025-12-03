import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/utils/jwt";
import { updateUserProfile } from "@/lib/services/accountService";
import { updateProfileInputSchema } from "@/lib/utils/accountValidators";

export const runtime = "edge";

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "未登录" },
        { status: 401 },
      );
    }

    const payload = verifyAuthToken(token);

    const json = await request.json().catch(() => ({}));
    const parsed = updateProfileInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await updateUserProfile(payload.userId, parsed.data);

    return NextResponse.json(
      { code: "OK", message: "资料更新成功", data: user },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "更新资料失败，请稍后重试" },
      { status: 500 },
    );
  }
}


