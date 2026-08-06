import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AfterPartyAttendance, getPrisma, WeddingAttendance } from "@darchive/db";
import { deleteWeddingVideoObject } from "../lib/s3-storage";
import { deleteWeddingPhotoObject } from "../lib/supabase-storage";
import { publicProcedure, router } from "../trpc";

const normalizePhoneDigits = (value: string) => value.replace(/\D/g, "");
const ADMIN_RSVP_PAGE_SIZE = 10;
const ADMIN_GUESTBOOK_PAGE_SIZE = 8;
const ADMIN_PHOTO_PAGE_SIZE = 12;

const adminProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin session is required" });
  }

  return next({ ctx });
});

const adminWeddingRsvpInput = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(16),
    attendance: z.enum([WeddingAttendance.YES, WeddingAttendance.NO]),
    guestCount: z.number().int().min(1).max(10).nullable().optional(),
    afterPartyAttendance: z.enum([AfterPartyAttendance.YES, AfterPartyAttendance.NO, AfterPartyAttendance.UNDECIDED]).nullable().optional(),
    afterPartyGuestCount: z.number().int().min(1).max(10).nullable().optional(),
    phone: z
      .string()
      .transform(normalizePhoneDigits)
      .pipe(z.string().max(11))
      .refine((value) => !value || /^0\d{8,10}$/.test(value))
      .nullable()
      .optional(),
  })
  .transform((input) => ({
    ...input,
    guestCount: input.attendance === WeddingAttendance.YES ? input.guestCount ?? 1 : null,
    afterPartyAttendance: input.attendance === WeddingAttendance.YES ? input.afterPartyAttendance ?? AfterPartyAttendance.UNDECIDED : AfterPartyAttendance.NO,
    afterPartyGuestCount:
      input.attendance === WeddingAttendance.YES && input.afterPartyAttendance === AfterPartyAttendance.YES
        ? input.afterPartyGuestCount ?? 1
        : null,
    phone: input.phone ? input.phone : null,
  }));

const pageNumberSchema = z.coerce.number().int().min(1).catch(1).default(1);

const weddingOverviewInput = z
  .object({
    afterParty: z.enum([AfterPartyAttendance.YES, AfterPartyAttendance.NO, AfterPartyAttendance.UNDECIDED]).optional(),
    attendance: z.enum([WeddingAttendance.YES, WeddingAttendance.NO]).optional(),
    guestbookPage: pageNumberSchema,
    photoPage: pageNumberSchema,
    q: z.string().trim().max(80).optional(),
    rsvpPage: pageNumberSchema,
  })
  .optional();

export const adminRouter = router({
  weddingRsvpDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await getPrisma().weddingRsvp.delete({
        where: { id: input.id },
        select: { id: true },
      });

      return { ok: true as const };
    }),

  weddingRsvpUpdate: adminProcedure
    .input(adminWeddingRsvpInput)
    .mutation(async ({ input }) => {
      const rsvp = await getPrisma().weddingRsvp.update({
        where: { id: input.id },
        data: {
          name: input.name,
          attendance: input.attendance,
          guestCount: input.guestCount,
          afterPartyAttendance: input.afterPartyAttendance,
          afterPartyGuestCount: input.afterPartyGuestCount,
          phone: input.phone,
        },
        select: { id: true },
      });

      return rsvp;
    }),

  weddingGuestbookSetVisibility: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        isVisible: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const entry = await getPrisma().weddingGuestbookEntry.update({
        where: { id: input.id },
        data: { isVisible: input.isVisible },
        select: { id: true, isVisible: true },
      });

      return entry;
    }),

  weddingPhotoSetVisibility: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        isVisible: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const photo = await getPrisma().weddingPhoto.update({
        where: { id: input.id },
        data: { isVisible: input.isVisible },
        select: { id: true, isVisible: true },
      });

      return photo;
    }),

  weddingPhotoDelete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const photo = await getPrisma().weddingPhoto.findUnique({
        where: { id: input.id },
        select: { id: true, storagePath: true, mediaType: true },
      });

      if (!photo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Photo not found" });
      }

      try {
        if (photo.mediaType === "video") {
          await deleteWeddingVideoObject(photo.storagePath);
        } else {
          await deleteWeddingPhotoObject(photo.storagePath);
        }
      } catch {
        // Continue deleting the DB row even if the object is already gone.
      }

      await getPrisma().weddingPhoto.delete({
        where: { id: photo.id },
        select: { id: true },
      });

      return { ok: true as const };
    }),

  weddingOverview: adminProcedure.input(weddingOverviewInput).query(async ({ input }) => {
    const prisma = getPrisma();
    const rsvpPage = input?.rsvpPage ?? 1;
    const guestbookPage = input?.guestbookPage ?? 1;
    const photoPage = input?.photoPage ?? 1;
    const query = input?.q?.trim();
    const queryDigits = query ? normalizePhoneDigits(query) : "";
    const phoneMatchedIds =
      queryDigits.length > 0
        ? (
            await prisma.$queryRaw<{ id: string }[]>`
              SELECT id
              FROM "WeddingRsvp"
              WHERE phone IS NOT NULL
                AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${`%${queryDigits}%`}
            `
          ).map((row) => row.id)
        : [];
    const rsvpWhere = {
      ...(input?.attendance ? { attendance: input.attendance } : {}),
      ...(input?.afterParty ? { afterPartyAttendance: input.afterParty } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              ...(phoneMatchedIds.length > 0 ? [{ id: { in: phoneMatchedIds } }] : []),
            ],
          }
        : {}),
    };

    const [
      rsvps,
      filteredRsvpCount,
      guestbookEntries,
      photos,
      totalRsvps,
      attendingRsvps,
      declinedRsvps,
      expectedGuests,
      afterPartyYes,
      afterPartyNo,
      afterPartyUndecided,
      expectedAfterPartyGuests,
      visibleGuestbookCount,
      hiddenGuestbookCount,
      totalGuestbookCount,
      visiblePhotoCount,
      hiddenPhotoCount,
      totalPhotoCount,
    ] = await Promise.all([
      prisma.weddingRsvp.findMany({
        where: rsvpWhere,
        orderBy: { createdAt: "desc" },
        skip: (rsvpPage - 1) * ADMIN_RSVP_PAGE_SIZE,
        take: ADMIN_RSVP_PAGE_SIZE,
        select: {
          id: true,
          name: true,
          attendance: true,
          guestCount: true,
          afterPartyAttendance: true,
          afterPartyGuestCount: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.weddingRsvp.count({ where: rsvpWhere }),
      prisma.weddingGuestbookEntry.findMany({
        orderBy: { createdAt: "desc" },
        skip: (guestbookPage - 1) * ADMIN_GUESTBOOK_PAGE_SIZE,
        take: ADMIN_GUESTBOOK_PAGE_SIZE,
        select: {
          id: true,
          name: true,
          message: true,
          isVisible: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.weddingPhoto.findMany({
        orderBy: { createdAt: "desc" },
        skip: (photoPage - 1) * ADMIN_PHOTO_PAGE_SIZE,
        take: ADMIN_PHOTO_PAGE_SIZE,
        select: {
          id: true,
          uploaderName: true,
          publicUrl: true,
          mediaType: true,
          isVisible: true,
          byteSize: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.weddingRsvp.count(),
      prisma.weddingRsvp.count({ where: { attendance: WeddingAttendance.YES } }),
      prisma.weddingRsvp.count({ where: { attendance: WeddingAttendance.NO } }),
      prisma.weddingRsvp.aggregate({
        where: { attendance: WeddingAttendance.YES },
        _sum: { guestCount: true },
      }),
      prisma.weddingRsvp.count({ where: { afterPartyAttendance: AfterPartyAttendance.YES } }),
      prisma.weddingRsvp.count({ where: { afterPartyAttendance: AfterPartyAttendance.NO } }),
      prisma.weddingRsvp.count({ where: { afterPartyAttendance: AfterPartyAttendance.UNDECIDED } }),
      prisma.weddingRsvp.aggregate({
        where: { afterPartyAttendance: AfterPartyAttendance.YES },
        _sum: { afterPartyGuestCount: true },
      }),
      prisma.weddingGuestbookEntry.count({ where: { isVisible: true } }),
      prisma.weddingGuestbookEntry.count({ where: { isVisible: false } }),
      prisma.weddingGuestbookEntry.count(),
      prisma.weddingPhoto.count({ where: { isVisible: true } }),
      prisma.weddingPhoto.count({ where: { isVisible: false } }),
      prisma.weddingPhoto.count(),
    ]);

    return {
      pagination: {
        guestbook: {
          page: guestbookPage,
          pageSize: ADMIN_GUESTBOOK_PAGE_SIZE,
          totalItems: totalGuestbookCount,
          totalPages: Math.max(1, Math.ceil(totalGuestbookCount / ADMIN_GUESTBOOK_PAGE_SIZE)),
        },
        photo: {
          page: photoPage,
          pageSize: ADMIN_PHOTO_PAGE_SIZE,
          totalItems: totalPhotoCount,
          totalPages: Math.max(1, Math.ceil(totalPhotoCount / ADMIN_PHOTO_PAGE_SIZE)),
        },
        rsvp: {
          page: rsvpPage,
          pageSize: ADMIN_RSVP_PAGE_SIZE,
          totalItems: filteredRsvpCount,
          totalPages: Math.max(1, Math.ceil(filteredRsvpCount / ADMIN_RSVP_PAGE_SIZE)),
        },
      },
      summary: {
        totalRsvps,
        attendingRsvps,
        declinedRsvps,
        expectedGuests: expectedGuests._sum.guestCount ?? attendingRsvps,
        afterPartyYes,
        afterPartyNo,
        afterPartyUndecided,
        expectedAfterPartyGuests: expectedAfterPartyGuests._sum.afterPartyGuestCount ?? afterPartyYes,
        visibleGuestbookCount,
        hiddenGuestbookCount,
        totalGuestbookCount,
        visiblePhotoCount,
        hiddenPhotoCount,
        totalPhotoCount,
      },
      rsvps: rsvps.map((rsvp) => ({
        ...rsvp,
        createdAt: rsvp.createdAt.toISOString(),
        updatedAt: rsvp.updatedAt.toISOString(),
      })),
      guestbookEntries: guestbookEntries.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      })),
      photos: photos.map((photo) => ({
        ...photo,
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
      })),
    };
  }),
});
