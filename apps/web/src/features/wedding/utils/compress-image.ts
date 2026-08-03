import imageCompression from "browser-image-compression";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export type CompressedWeddingPhoto = {
  file: File;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number | null;
  height: number | null;
};

function normalizeMimeType(type: string): CompressedWeddingPhoto["mimeType"] {
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  return "image/jpeg";
}

async function readImageSize(file: Blob): Promise<{ width: number | null; height: number | null }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

export async function compressWeddingPhoto(file: File): Promise<CompressedWeddingPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    initialQuality: 0.82,
    fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
  });

  const mimeType = normalizeMimeType(compressed.type || file.type);
  const normalizedFile =
    compressed instanceof File
      ? compressed
      : new File([compressed], file.name.replace(/\.\w+$/, mimeType === "image/png" ? ".png" : ".jpg"), {
          type: mimeType,
          lastModified: Date.now(),
        });

  if (normalizedFile.size > MAX_UPLOAD_BYTES) {
    throw new Error("파일이 너무 큽니다. 다른 사진을 선택해주세요.");
  }

  const { width, height } = await readImageSize(normalizedFile);

  return {
    file: normalizedFile,
    mimeType,
    width,
    height,
  };
}
