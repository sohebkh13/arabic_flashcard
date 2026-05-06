import { verifyToken } from "@clerk/backend";
import type { NextFunction, Request, Response } from "express";

export interface AuthedRequest extends Request {
  userId: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    (req as AuthedRequest).userId = payload.sub;
    next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[requireAuth] verifyToken failed:", msg);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
