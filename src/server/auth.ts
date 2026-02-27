import jwt from "jsonwebtoken";
import { UserModel } from "@/server/models/User";
import { dbConnect } from "./db/mongoose";
import { env } from "./config";

function parseCookie(header?: string) {
  const out: Record<string, string> = {};
  if (!header) return out;
  const parts = header.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    const rawVal = rest.join("=");
    if (!rawVal) continue;
    out[rawKey] = decodeURIComponent(rawVal);
  }
  return out;
}

export async function requireUser(req: any) {
  const auth = req.headers.authorization || "";
  let token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    const cookieName = env.JWT_COOKIE_NAME || "token";
    const cookieBag = req.cookies ?? parseCookie(req.headers.cookie);
    token = cookieBag?.[cookieName] || null;
  }
  if (!token) return null;

  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = payload.sub;
    if (!userId) return null;

    await dbConnect();
    const user = await UserModel.findById(userId).lean();
    if (!user) return null;

    return { id: String(user._id), name: user.name, role: user.role };
  } catch {
    return null;
  }
}
