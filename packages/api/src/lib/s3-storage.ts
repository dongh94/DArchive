import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

export const WEDDING_VIDEO_MAX_MB = 300;
export const WEDDING_VIDEO_MAX_BYTES = WEDDING_VIDEO_MAX_MB * 1024 * 1024;
export const WEDDING_VIDEO_UPLOAD_URL_EXPIRES_IN = 60 * 30;

const ALLOWED_MIME_TYPES = new Set(["video/mp4", "video/quicktime"]);

let s3Client: S3Client | null = null;

function getS3Config() {
  const region = process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");

  if (!region || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    throw new Error("S3 storage is not configured");
  }

  return { region, bucket, accessKeyId, secretAccessKey, publicBaseUrl };
}

function getS3Client() {
  if (!s3Client) {
    const { region, accessKeyId, secretAccessKey } = getS3Config();
    s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  return s3Client;
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "video/quicktime") return "mov";
  return "mp4";
}

export function isAllowedVideoMimeType(mimeType: string) {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function assertValidWeddingVideoUpload(
  storagePath: string,
  mimeType: string,
  byteSize: number,
  object: { contentType?: string; contentLength?: number },
) {
  if (!isAllowedVideoMimeType(mimeType) || !isAllowedVideoMimeType(object.contentType ?? "")) {
    throw new Error("Unsupported video type");
  }

  if (
    !Number.isInteger(byteSize) ||
    byteSize < 1 ||
    byteSize > WEDDING_VIDEO_MAX_BYTES ||
    object.contentLength !== byteSize
  ) {
    throw new Error("Video file size mismatch");
  }

  const extension = extensionForMimeType(mimeType);
  if (!storagePath.toLowerCase().endsWith(`.${extension}`)) {
    throw new Error("Video path mismatch");
  }
}

export function buildWeddingVideoPath(mimeType: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `wedding/videos/${date}/${randomUUID()}.${extensionForMimeType(mimeType)}`;
}

export function getWeddingVideoPublicUrl(storagePath: string) {
  const { publicBaseUrl } = getS3Config();
  return `${publicBaseUrl}/${storagePath}`;
}

export async function createWeddingVideoUploadUrl(mimeType: string, byteSize: number) {
  if (!isAllowedVideoMimeType(mimeType)) {
    throw new Error("Unsupported video type");
  }

  if (!Number.isInteger(byteSize) || byteSize < 1 || byteSize > WEDDING_VIDEO_MAX_BYTES) {
    throw new Error("Video file is too large");
  }

  const { bucket } = getS3Config();
  const path = buildWeddingVideoPath(mimeType);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: path,
    ContentType: mimeType,
    ContentLength: byteSize,
  });

  const signedUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: WEDDING_VIDEO_UPLOAD_URL_EXPIRES_IN,
  });

  return {
    path,
    signedUrl,
    publicUrl: getWeddingVideoPublicUrl(path),
  };
}

export async function getWeddingVideoObjectInfo(storagePath: string) {
  const { bucket } = getS3Config();
  const result = await getS3Client().send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: storagePath,
    }),
  );

  return {
    contentType: result.ContentType,
    contentLength: result.ContentLength,
  };
}

export async function verifyWeddingVideoObject(
  storagePath: string,
  mimeType: string,
  byteSize: number,
) {
  const object = await getWeddingVideoObjectInfo(storagePath);
  assertValidWeddingVideoUpload(storagePath, mimeType, byteSize, object);
}

export async function deleteWeddingVideoObject(storagePath: string) {
  const { bucket } = getS3Config();
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: storagePath,
    }),
  );
}
