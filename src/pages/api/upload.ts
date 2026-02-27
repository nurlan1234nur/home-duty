import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { requireUser } from "@/server/auth";
import path from "path";
import { put } from "@vercel/blob";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB
    const { files } = await new Promise<{ files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, _fields, parsedFiles) => {
        if (err) return reject(err);
        resolve({ files: parsedFiles });
      });
    });

    const f = files.file;
    const file = Array.isArray(f) ? f[0] : f;
    if (!file) return res.status(400).json({ error: "No file" });

    const mime = (file.mimetype || "application/octet-stream") as string;
    const ext = (file.originalFilename || "upload").split(".").pop() || "bin";
    const filename = `${user.id}-${Date.now()}.${ext}`;

    const data = await fs.promises.readFile(file.filepath);

    // Prefer Vercel Blob on Vercel (serverless has no writable filesystem)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const key = `uploads/${filename}`;
      const blob = await put(key, data, {
        access: "public",
        contentType: mime
      });
      return res.json({ ok: true, url: blob.url, contentType: mime });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const destPath = path.join(uploadDir, filename);
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(destPath, data);

    return res.json({ ok: true, url: `/uploads/${filename}`, contentType: mime });
  } catch (e: any) {
    console.error("Upload failed", e);
    return res.status(500).json({ error: "Upload failed" });
  }
}
