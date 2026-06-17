import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { SECRET_KEY } from "./config";

const key = new TextEncoder().encode(SECRET_KEY);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: number) {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, key);
  const id = Number(payload.sub);
  return Number.isFinite(id) ? id : null;
}

export function bearerUserId(req: Request): Promise<number | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return Promise.resolve(null);
  return verifyToken(auth.slice(7));
}
