import { TRPCError } from "@trpc/server";
import {
  AfterPartyAttendance,
  getPrisma,
  WeddingAttendance,
} from "@darchive/db";
import { publicProcedure, router } from "../trpc";
import { isRateLimited } from "../lib/rate-limit";
import {
  createWeddingVideoUploadUrl,
  deleteWeddingVideoObject,
  getWeddingVideoPublicUrl,
  verifyWeddingVideoObject,
} from "../lib/s3-storage";
import {
  createWeddingPhotoUploadUrl,
  getWeddingPhotoPublicUrl,
} from "../lib/supabase-storage";
import {
  guestbookCreateInputSchema,
  guestbookDeleteInputSchema,
  guestbookListInputSchema,
  guestbookUpdateInputSchema,
  photoCreateInputSchema,
  photoCreateUploadInputSchema,
  photoListInputSchema,
  rsvpInputSchema,
  videoCreateInputSchema,
  videoCreateUploadInputSchema,
  videoUploadDeleteInputSchema,
} from "../schemas/wedding";

const PRISMA_UNIQUE_VIOLATION = "P2002";

function isPrismaKnownError(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === code;
}

export const weddingRouter = router({
  guestbookList: publicProcedure.input(guestbookListInputSchema).query(async ({ input }) => {
    const limit = input?.limit ?? 20;
    const search = input?.search?.trim();
    const where = {
      isVisible: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { message: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const rows = await getPrisma().weddingGuestbookEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      select: { id: true, name: true, message: true, createdAt: true },
    });

    const hasMore = rows.length > limit;
    const items = (hasMore ? rows.slice(0, limit) : rows).map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    }));

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }),

  guestbookCount: publicProcedure.query(() =>
    getPrisma().weddingGuestbookEntry.count({ where: { isVisible: true } }),
  ),

  guestbookCreate: publicProcedure
    .input(guestbookCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.website) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "잘못된 요청입니다." });
      }

      if (isRateLimited(`guestbook:${ctx.ip}`)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "잠시 후 다시 시도해주세요.",
        });
      }

      try {
        const entry = await getPrisma().weddingGuestbookEntry.create({
          data: { name: input.name, message: input.message },
          select: { id: true, name: true, message: true, createdAt: true },
        });

        return { ...entry, createdAt: entry.createdAt.toISOString() };
      } catch (error) {
        if (isPrismaKnownError(error, PRISMA_UNIQUE_VIOLATION)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "이미 같은 이름으로 남겨진 메시지가 있습니다.",
          });
        }
        throw error;
      }
    }),

  guestbookDelete: publicProcedure
    .input(guestbookDeleteInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (isRateLimited(`guestbook-delete:${ctx.ip}`, 5)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "잠시 후 다시 시도해주세요.",
        });
      }

      const existing = await getPrisma().weddingGuestbookEntry.findUnique({
        where: { id: input.id },
        select: { id: true, name: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "삭제할 메시지를 찾을 수 없습니다.",
        });
      }

      if (existing.name !== input.name) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "이름이 일치하지 않습니다.",
        });
      }

      await getPrisma().weddingGuestbookEntry.delete({
        where: { id: existing.id },
        select: { id: true },
      });

      return { ok: true as const, id: existing.id };
    }),

  guestbookUpdate: publicProcedure
    .input(guestbookUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.website) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "잘못된 요청입니다." });
      }

      if (isRateLimited(`guestbook-update:${ctx.ip}`, 10, 60_000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "잠시 후 다시 시도해주세요.",
        });
      }

      const existing = await getPrisma().weddingGuestbookEntry.findUnique({
        where: { id: input.id },
        select: { id: true, name: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "수정할 메시지를 찾을 수 없습니다.",
        });
      }

      if (existing.name !== input.name) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "작성자 성함이 일치하지 않습니다.",
        });
      }

      try {
        const entry = await getPrisma().weddingGuestbookEntry.update({
          where: { id: existing.id },
          data: { name: input.nextName, message: input.message },
          select: { id: true, name: true, message: true, createdAt: true },
        });

        return { ...entry, createdAt: entry.createdAt.toISOString() };
      } catch (error) {
        if (isPrismaKnownError(error, PRISMA_UNIQUE_VIOLATION)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "이미 같은 이름으로 남겨진 메시지가 있습니다.",
          });
        }

        throw error;
      }
    }),

  rsvpCreate: publicProcedure
    .input(rsvpInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.website) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "잘못된 요청입니다." });
      }

      if (isRateLimited(`rsvp:${ctx.ip}`, 3)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "잠시 후 다시 시도해주세요.",
        });
      }

      await getPrisma().weddingRsvp.create({
        data: {
          name: input.name,
          attendance:
            input.attendance === "yes" ? WeddingAttendance.YES : WeddingAttendance.NO,
          afterPartyAttendance:
            input.attendance === "no"
              ? AfterPartyAttendance.NO
              : input.afterPartyAttendance === "yes"
                ? AfterPartyAttendance.YES
                : input.afterPartyAttendance === "no"
                  ? AfterPartyAttendance.NO
                  : AfterPartyAttendance.UNDECIDED,
          afterPartyGuestCount:
            input.attendance === "yes" && input.afterPartyAttendance === "yes"
              ? input.afterPartyGuestCount
              : null,
          phone: input.phone,
        },
        select: { id: true },
      });

      return { ok: true as const };
    }),

  photoList: publicProcedure.input(photoListInputSchema).query(async ({ input }) => {
    const limit = input?.limit ?? 24;
    const rows = await getPrisma().weddingPhoto.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        uploaderName: true,
        publicUrl: true,
        mediaType: true,
        width: true,
        height: true,
        createdAt: true,
      },
    });

    const hasMore = rows.length > limit;
    const items = (hasMore ? rows.slice(0, limit) : rows).map((photo) => ({
      ...photo,
      mediaType: photo.mediaType === "video" ? ("video" as const) : ("image" as const),
      createdAt: photo.createdAt.toISOString(),
    }));

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }),

  photoCount: publicProcedure.query(() =>
    getPrisma().weddingPhoto.count({ where: { isVisible: true } }),
  ),

  photoCreateUpload: publicProcedure
    .input(photoCreateUploadInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (isRateLimited(`photo-upload-url:${ctx.ip}`, 30, 60_000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "잠시 후 다시 시도해주세요.",
        });
      }

      try {
        return await createWeddingPhotoUploadUrl(input.mimeType);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "업로드 준비에 실패했습니다.",
        });
      }
    }),

  photoCreate: publicProcedure.input(photoCreateInputSchema).mutation(async ({ ctx, input }) => {
    if (input.website) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "잘못된 요청입니다." });
    }

    if (isRateLimited(`photo-create:${ctx.ip}`, 40, 60_000)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "잠시 후 다시 시도해주세요.",
      });
    }

    try {
      const photo = await getPrisma().weddingPhoto.create({
        data: {
          uploaderName: input.uploaderName,
          storagePath: input.storagePath,
          publicUrl: getWeddingPhotoPublicUrl(input.storagePath),
          mimeType: input.mimeType,
          mediaType: "image",
          byteSize: input.byteSize,
          width: input.width ?? null,
          height: input.height ?? null,
        },
        select: {
          id: true,
          uploaderName: true,
          publicUrl: true,
          mediaType: true,
          width: true,
          height: true,
          createdAt: true,
        },
      });

      return {
        ...photo,
        mediaType: "image" as const,
        createdAt: photo.createdAt.toISOString(),
      };
    } catch (error) {
      if (isPrismaKnownError(error, PRISMA_UNIQUE_VIOLATION)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 등록된 사진입니다.",
        });
      }

      throw error;
    }
  }),

  videoCreateUpload: publicProcedure
    .input(videoCreateUploadInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (isRateLimited(`video-upload-url:${ctx.ip}`, 10, 60_000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "잠시 후 다시 시도해주세요.",
        });
      }

      try {
        return await createWeddingVideoUploadUrl(input.mimeType, input.byteSize);
      } catch (error) {
        const message = error instanceof Error ? error.message : "업로드 준비에 실패했습니다.";
        if (message === "Unsupported video type" || message === "Video file is too large") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "영상 파일을 확인해주세요." });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "업로드 준비에 실패했습니다.",
        });
      }
    }),

  videoCreate: publicProcedure.input(videoCreateInputSchema).mutation(async ({ ctx, input }) => {
    if (input.website) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "잘못된 요청입니다." });
    }

    if (isRateLimited(`video-create:${ctx.ip}`, 15, 60_000)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "잠시 후 다시 시도해주세요.",
      });
    }

    try {
      await verifyWeddingVideoObject(input.storagePath, input.mimeType, input.byteSize);
    } catch {
      await deleteWeddingVideoObject(input.storagePath).catch(() => {
        // Best-effort cleanup for invalid or incomplete uploads.
      });

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "영상 업로드를 확인할 수 없습니다. 다시 시도해주세요.",
      });
    }

    try {
      const video = await getPrisma().weddingPhoto.create({
        data: {
          uploaderName: input.uploaderName,
          storagePath: input.storagePath,
          publicUrl: getWeddingVideoPublicUrl(input.storagePath),
          mimeType: input.mimeType,
          mediaType: "video",
          byteSize: input.byteSize,
          width: input.width ?? null,
          height: input.height ?? null,
        },
        select: {
          id: true,
          uploaderName: true,
          publicUrl: true,
          mediaType: true,
          width: true,
          height: true,
          createdAt: true,
        },
      });

      return {
        ...video,
        mediaType: "video" as const,
        createdAt: video.createdAt.toISOString(),
      };
    } catch (error) {
      if (isPrismaKnownError(error, PRISMA_UNIQUE_VIOLATION)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 등록된 영상입니다.",
        });
      }

      await deleteWeddingVideoObject(input.storagePath).catch(() => {
        // Best-effort cleanup if DB registration fails after S3 upload.
      });

      throw error;
    }
  }),

  videoUploadDelete: publicProcedure
    .input(videoUploadDeleteInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (isRateLimited(`video-upload-delete:${ctx.ip}`, 15, 60_000)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "잠시 후 다시 시도해주세요.",
        });
      }

      const existing = await getPrisma().weddingPhoto.findUnique({
        where: { storagePath: input.storagePath },
        select: { id: true },
      });

      if (existing) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "이미 등록된 영상입니다.",
        });
      }

      await deleteWeddingVideoObject(input.storagePath).catch(() => {
        // Deleting an already-missing temporary object is harmless.
      });

      return { ok: true as const };
    }),
});
