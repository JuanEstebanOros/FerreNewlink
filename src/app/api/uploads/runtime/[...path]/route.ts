import { NextResponse, type NextRequest } from "next/server";
import { stat, readFile } from "fs/promises";
import path from "path";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "runtime");
  const filePath = path.join(uploadDir, ...segments);

  if (!filePath.startsWith(uploadDir + path.sep)) {
    return NextResponse.json({ error: "Ruta invalida." }, { status: 400 });
  }

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
  if (!fileStat.isFile()) {
    return new NextResponse(null, { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
