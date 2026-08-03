import { z } from "zod";

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizePhoneDigits = (value: string) => value.replace(/\D/g, "");

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

export type Attendance = z.infer<typeof attendanceSchema>;
export type AfterPartyAttendance = z.infer<typeof afterPartyAttendanceSchema>;
export type GuestbookEntry = z.infer<typeof guestbookEntrySchema>;
export type GuestbookCreateInput = z.input<typeof guestbookCreateInputSchema>;
export type GuestbookDeleteInput = z.input<typeof guestbookDeleteInputSchema>;
export type GuestbookListInput = z.input<typeof guestbookListInputSchema>;
export type RsvpInput = z.input<typeof rsvpInputSchema>;
