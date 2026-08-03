import { compressWeddingPhoto } from "../utils/compress-image";

type UploadTarget = {
  path: string;
  signedUrl: string;
};

type CreatedPhoto = {
  id: string;
  uploaderName: string;
  publicUrl: string;
  width: number | null;
  height: number | null;
  createdAt: string;
};

type PhotoUploadClient = {
  wedding: {
    photoCreateUpload: {
      mutate: (input: { mimeType: "image/jpeg" | "image/png" | "image/webp" }) => Promise<UploadTarget>;
    };
    photoCreate: {
      mutate: (input: {
        uploaderName: string;
        storagePath: string;
        mimeType: "image/jpeg" | "image/png" | "image/webp";
        byteSize: number;
        width: number | null;
        height: number | null;
        website: string;
      }) => Promise<CreatedPhoto>;
    };
  };
};

export async function uploadGuestPhoto(client: PhotoUploadClient, file: File, uploaderName: string) {
  const compressed = await compressWeddingPhoto(file);
  const uploadTarget = await client.wedding.photoCreateUpload.mutate({
    mimeType: compressed.mimeType,
  });

  const uploadResponse = await fetch(uploadTarget.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": compressed.mimeType,
      "x-upsert": "false",
    },
    body: compressed.file,
  });

  if (!uploadResponse.ok) {
    throw new Error("사진 업로드에 실패했습니다. 다시 시도해주세요.");
  }

  return client.wedding.photoCreate.mutate({
    uploaderName,
    storagePath: uploadTarget.path,
    mimeType: compressed.mimeType,
    byteSize: compressed.file.size,
    width: compressed.width,
    height: compressed.height,
    website: "",
  });
}
