type UploadTarget = {
  path: string;
  signedUrl: string;
};

type CreatedMedia = {
  id: string;
  uploaderName: string;
  publicUrl: string;
  mediaType: "image" | "video";
  width: number | null;
  height: number | null;
  createdAt: string;
};

type VideoUploadClient = {
  wedding: {
    videoCreateUpload: {
      mutate: (input: {
        mimeType: "video/mp4" | "video/quicktime";
        byteSize: number;
      }) => Promise<UploadTarget>;
    };
    videoCreate: {
      mutate: (input: {
        uploaderName: string;
        storagePath: string;
        mimeType: "video/mp4" | "video/quicktime";
        byteSize: number;
        width: number | null;
        height: number | null;
        website: string;
      }) => Promise<CreatedMedia>;
    };
    videoUploadDelete: {
      mutate: (input: { storagePath: string }) => Promise<{ ok: true }>;
    };
  };
};

export const MAX_GUEST_VIDEO_BYTES = 50 * 1024 * 1024;

export function resolveVideoMimeType(file: File): "video/mp4" | "video/quicktime" | null {
  if (file.type === "video/mp4" || file.type === "video/quicktime") {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".mp4")) return "video/mp4";
  if (lowerName.endsWith(".mov")) return "video/quicktime";
  return null;
}

export function validateGuestVideoFile(file: File) {
  const mimeType = resolveVideoMimeType(file);
  if (!mimeType) {
    throw new Error("mp4 또는 mov 영상만 올릴 수 있어요.");
  }

  if (file.size < 1) {
    throw new Error("파일 크기를 확인해주세요.");
  }

  if (file.size > MAX_GUEST_VIDEO_BYTES) {
    throw new Error("영상은 50MB 이하로 올려주세요.");
  }

  return mimeType;
}

function uploadVideoToSignedUrl(
  signedUrl: string,
  file: File,
  mimeType: "video/mp4" | "video/quicktime",
  onProgress?: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("PUT", signedUrl);
    request.setRequestHeader("Content-Type", mimeType);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(new Error("영상 업로드에 실패했습니다. 다시 시도해주세요."));
    };

    request.onerror = () => {
      reject(new Error("영상 업로드에 실패했습니다. 네트워크 상태를 확인해주세요."));
    };

    request.send(file);
  });
}

export async function uploadGuestVideo(
  client: VideoUploadClient,
  file: File,
  uploaderName: string,
  onProgress?: (progress: number) => void,
) {
  const mimeType = validateGuestVideoFile(file);

  const uploadTarget = await client.wedding.videoCreateUpload.mutate({
    mimeType,
    byteSize: file.size,
  });

  try {
    await uploadVideoToSignedUrl(uploadTarget.signedUrl, file, mimeType, onProgress);

    return await client.wedding.videoCreate.mutate({
      uploaderName,
      storagePath: uploadTarget.path,
      mimeType,
      byteSize: file.size,
      width: null,
      height: null,
      website: "",
    });
  } catch (error) {
    await client.wedding.videoUploadDelete.mutate({ storagePath: uploadTarget.path }).catch(() => {
      // Best-effort cleanup for objects uploaded before DB registration failed.
    });
    throw error;
  }
}
