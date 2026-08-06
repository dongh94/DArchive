import { z } from "zod";

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizePhoneDigits = (value: string) => value.replace(/\D/g, "");
const WEDDING_VIDEO_MAX_MB = 300;
const WEDDING_VIDEO_MAX_BYTES = WEDDING_VIDEO_MAX_MB * 1024 * 1024;
const WEDDING_VIDEO_TOO_LARGE_MESSAGE =
  "300MB가 넘는 영상이에요. 카카오톡으로 직접 보내주시면 감사하겠습니다.";

const nameSchema = z
  .string()
  .transform(normalizeText)
  .pipe(
    z
      .string()
      .min(1, { error: "성함을 입력해주세요." })
      .max(16, { error: "성함은 16자 이내로 입력해주세요." }),
  );

const guestbookMessageSchema = z
  .string()
  .transform(normalizeText)
  .pipe(
    z
      .string()
      .min(2, { error: "축하 메시지는 2자 이상 입력해주세요." })
      .max(300, { error: "축하 메시지는 300자 이내로 입력해주세요." }),
  );

const optionalPhoneSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? normalizePhoneDigits(value) : ""))
  .pipe(z.string().max(11, { error: "연락처는 숫자 11자 이내로 입력해주세요." }))
  .refine(
    (value) => !value || /^0\d{8,10}$/.test(value),
    { error: "연락처는 숫자만 입력해주세요. 예: 01012345678" },
  )
  .transform((value) => (value ? value : null));

const honeypotSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""));

export const attendanceSchema = z.enum(["yes", "no"], {
  error: (issue) => (issue.input === undefined ? "참석 여부를 선택해주세요." : "참석 여부를 확인해주세요."),
});

export const afterPartyAttendanceSchema = z.enum(["yes", "no", "undecided"], {
  error: (issue) =>
    issue.input === undefined
      ? "뒤풀이 참석 여부를 선택해주세요."
      : "뒤풀이 참석 여부를 확인해주세요.",
});

export const guestbookEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  message: z.string(),
  createdAt: z.string(),
});

export const guestbookListInputSchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  })
  .optional();

export const guestbookCreateInputSchema = z.object({
  name: nameSchema,
  message: guestbookMessageSchema,
  website: honeypotSchema,
});

export const guestbookDeleteInputSchema = z.object({
  id: z.string({ error: "삭제할 메시지를 찾을 수 없습니다." }).min(1, { error: "삭제할 메시지를 찾을 수 없습니다." }),
  name: nameSchema,
});

export const guestbookUpdateInputSchema = z.object({
  id: z.string({ error: "수정할 메시지를 찾을 수 없습니다." }).min(1, { error: "수정할 메시지를 찾을 수 없습니다." }),
  name: nameSchema,
  nextName: nameSchema,
  message: guestbookMessageSchema,
  website: honeypotSchema,
});

export const rsvpInputSchema = z
  .object({
    name: nameSchema,
    attendance: attendanceSchema,
    afterPartyAttendance: afterPartyAttendanceSchema.nullable().optional(),
    afterPartyGuestCount: z
      .number({ error: "뒤풀이 참석 인원을 확인해주세요." })
      .int({ error: "뒤풀이 참석 인원을 확인해주세요." })
      .min(1, { error: "뒤풀이 참석 인원을 확인해주세요." })
      .max(4, { error: "뒤풀이 참석 인원을 확인해주세요." })
      .nullable()
      .optional(),
    phone: optionalPhoneSchema,
    website: honeypotSchema,
  })
  .superRefine((value, context) => {
    if (value.attendance === "yes" && !value.afterPartyAttendance) {
      context.addIssue({
        code: "custom",
        path: ["afterPartyAttendance"],
        message: "뒤풀이 참석 여부를 선택해주세요.",
      });
    }

    if (
      value.attendance === "yes" &&
      value.afterPartyAttendance === "yes" &&
      value.afterPartyGuestCount == null
    ) {
      context.addIssue({
        code: "custom",
        path: ["afterPartyGuestCount"],
        message: "뒤풀이 참석 인원을 선택해주세요.",
      });
    }

    if (
      value.attendance === "yes" &&
      value.afterPartyAttendance === "yes" &&
      !value.phone
    ) {
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: "뒤풀이 안내를 받을 연락처를 입력해주세요.",
      });
    }
  });

export const photoListInputSchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(60).default(24),
  })
  .optional();

export const photoCreateUploadInputSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    error: "지원하지 않는 이미지 형식입니다.",
  }),
});

export const photoCreateInputSchema = z.object({
  uploaderName: nameSchema,
  storagePath: z
    .string()
    .trim()
    .min(1, { error: "업로드 경로를 확인해주세요." })
    .max(255, { error: "업로드 경로를 확인해주세요." })
    .regex(/^guest\/[0-9]{4}-[0-9]{2}-[0-9]{2}\/[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/i, {
      error: "업로드 경로를 확인해주세요.",
    }),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    error: "지원하지 않는 이미지 형식입니다.",
  }),
  byteSize: z
    .number({ error: "파일 크기를 확인해주세요." })
    .int({ error: "파일 크기를 확인해주세요." })
    .min(1, { error: "파일 크기를 확인해주세요." })
    .max(12 * 1024 * 1024, { error: "파일이 너무 큽니다." }),
  width: z.number().int().positive().max(10000).nullable().optional(),
  height: z.number().int().positive().max(10000).nullable().optional(),
  website: honeypotSchema,
});

export const photoEntrySchema = z.object({
  id: z.string(),
  uploaderName: z.string(),
  publicUrl: z.string(),
  mediaType: z.enum(["image", "video"]),
  width: z.number().nullable(),
  height: z.number().nullable(),
  createdAt: z.string(),
});

export const videoCreateUploadInputSchema = z.object({
  mimeType: z.enum(["video/mp4", "video/quicktime"], {
    error: "지원하지 않는 영상 형식입니다.",
  }),
  byteSize: z
    .number({ error: "파일 크기를 확인해주세요." })
    .int({ error: "파일 크기를 확인해주세요." })
    .min(1, { error: "파일 크기를 확인해주세요." })
    .max(WEDDING_VIDEO_MAX_BYTES, { error: WEDDING_VIDEO_TOO_LARGE_MESSAGE }),
});

export const videoCreateInputSchema = z.object({
  uploaderName: nameSchema,
  storagePath: z
    .string()
    .trim()
    .min(1, { error: "업로드 경로를 확인해주세요." })
    .max(255, { error: "업로드 경로를 확인해주세요." })
    .regex(/^wedding\/videos\/[0-9]{4}-[0-9]{2}-[0-9]{2}\/[a-zA-Z0-9-]+\.(mp4|mov)$/i, {
      error: "업로드 경로를 확인해주세요.",
    }),
  mimeType: z.enum(["video/mp4", "video/quicktime"], {
    error: "지원하지 않는 영상 형식입니다.",
  }),
  byteSize: z
    .number({ error: "파일 크기를 확인해주세요." })
    .int({ error: "파일 크기를 확인해주세요." })
    .min(1, { error: "파일 크기를 확인해주세요." })
    .max(WEDDING_VIDEO_MAX_BYTES, { error: WEDDING_VIDEO_TOO_LARGE_MESSAGE }),
  width: z.number().int().positive().max(10000).nullable().optional(),
  height: z.number().int().positive().max(10000).nullable().optional(),
  website: honeypotSchema,
});

export const videoUploadDeleteInputSchema = z.object({
  storagePath: z
    .string()
    .trim()
    .min(1, { error: "업로드 경로를 확인해주세요." })
    .max(255, { error: "업로드 경로를 확인해주세요." })
    .regex(/^wedding\/videos\/[0-9]{4}-[0-9]{2}-[0-9]{2}\/[a-zA-Z0-9-]+\.(mp4|mov)$/i, {
      error: "업로드 경로를 확인해주세요.",
    }),
});

export type Attendance = z.infer<typeof attendanceSchema>;
export type AfterPartyAttendance = z.infer<typeof afterPartyAttendanceSchema>;
export type GuestbookEntry = z.infer<typeof guestbookEntrySchema>;
export type GuestbookCreateInput = z.input<typeof guestbookCreateInputSchema>;
export type GuestbookDeleteInput = z.input<typeof guestbookDeleteInputSchema>;
export type GuestbookUpdateInput = z.input<typeof guestbookUpdateInputSchema>;
export type GuestbookListInput = z.input<typeof guestbookListInputSchema>;
export type RsvpInput = z.input<typeof rsvpInputSchema>;
export type PhotoListInput = z.input<typeof photoListInputSchema>;
export type PhotoCreateUploadInput = z.input<typeof photoCreateUploadInputSchema>;
export type PhotoCreateInput = z.input<typeof photoCreateInputSchema>;
export type PhotoEntry = z.infer<typeof photoEntrySchema>;
export type VideoCreateUploadInput = z.input<typeof videoCreateUploadInputSchema>;
export type VideoCreateInput = z.input<typeof videoCreateInputSchema>;
export type VideoUploadDeleteInput = z.input<typeof videoUploadDeleteInputSchema>;
