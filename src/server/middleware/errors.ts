import type { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response) {
  return res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
