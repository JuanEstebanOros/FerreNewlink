import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido." }, { status: 400 });
  }
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "La imagen supera el limite de 5MB." }, { status: 400 });
  }

  const filename = `${randomUUID()}.${extension}`;
  // Written to a directory separate from public/uploads/products (which holds the
  // git-committed MeLi backfill, baked into every build) so this one can sit on a
  // Railway Volume without any ambiguity about volume-mount seeding from image
  // content — this path is expected to start empty. See CLAUDE.md for the full
  // reasoning.
  const uploadDir = path.join(process.cwd(), "public", "uploads", "runtime");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/runtime/${filename}` });
}
