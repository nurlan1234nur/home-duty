import type { NextApiRequest, NextApiResponse } from "next";
import { getExpressApp } from "@/server/app";

const app = getExpressApp();

export const config = {
  api: {
    bodyParser: false
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  app(req as any, res as any);
}
