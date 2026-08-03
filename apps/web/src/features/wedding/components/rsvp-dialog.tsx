"use client";

import type { ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import { rsvpInputSchema, type RsvpInput } from "@darchive/api/schemas";
import { cn } from "@/shared/lib/cn";
import { trpc } from "@/shared/lib/trpc";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";

type RsvpDialogProps = {
  onClose: () => void;
  onSubmitted: () => void;
};

export function RsvpDialog({ onClose, onSubmitted }: RsvpDialogProps) {
  useBodyScrollLock();

  const submitRsvp = trpc.wedding.rsvpCreate.useMutation({
    onSuccess: () => onSubmitted(),
  });

  const form = useForm<RsvpInput>({
    resolver: zodResolver(rsvpInputSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: {
      attendance: "yes",
      afterPartyAttendance: null,
      afterPartyGuestCount: null,
      name: "",
      phone: "",
      website: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await submitRsvp.mutateAsync(values).catch(() => {
      // error surfaced via submitRsvp.error
    });
  });

  const errors = form.formState.errors;
  const formMessage =
    submitRsvp.error?.message ??
    (submitRsvp.isSuccess ? "참석 의사가 전달되었습니다." : null);
  const isNameInvalid = Boolean(errors.name);
  const isPhoneInvalid = Boolean(errors.phone);
  const attendance = useWatch({
    control: form.control,
    name: "attendance",
  });
  const afterPartyAttendance = useWatch({
    control: form.control,
    name: "afterPartyAttendance",
  });

  const setWeddingAttendance = (value: RsvpInput["attendance"]) => {
    form.setValue("attendance", value, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });

    if (value === "no") {
      form.setValue("afterPartyAttendance", null, {
        shouldDirty: true,
        shouldValidate: form.formState.isSubmitted,
      });
      form.setValue("afterPartyGuestCount", null, {
        shouldDirty: true,
        shouldValidate: form.formState.isSubmitted,
      });
    }
  };

  const setAfterPartyAttendance = (
    value: NonNullable<RsvpInput["afterPartyAttendance"]>,
  ) => {
    form.setValue("afterPartyAttendance", value, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
    form.setValue(
      "afterPartyGuestCount",
      value === "yes" ? (form.getValues("afterPartyGuestCount") ?? 1) : null,
      {
        shouldDirty: true,
        shouldValidate: form.formState.isSubmitted,
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overscroll-none px-5 py-4">
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
        aria-label="참석 전달 배경 닫기"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[360px] overflow-y-auto overscroll-contain rounded-xl bg-white shadow-2xl"
      >
        <div className="space-y-5 p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">참석 의사 전달</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center text-brand-muted hover:text-brand-ink"
              aria-label="참석 전달 닫기"
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <p className="ml-1 text-xs font-bold tracking-wider text-brand-ink">
                참석 여부
              </p>
              <Controller
                control={form.control}
                name="attendance"
                render={({ field }) => (
                  <div role="radiogroup" aria-label="참석 여부" className="grid grid-cols-2 gap-2">
                    <AttendanceButton
                      isActive={field.value === "yes"}
                      onClick={() => setWeddingAttendance("yes")}
                    >
                      참석
                    </AttendanceButton>
                    <AttendanceButton
                      isActive={field.value === "no"}
                      onClick={() => setWeddingAttendance("no")}
                      activeClassName="bg-brand-ink border-brand-ink"
                    >
                      불참
                    </AttendanceButton>
                  </div>
                )}
              />
            </div>

            {attendance === "yes" ? (
              <div className="space-y-3 rounded-lg border border-brand-gold/15 bg-brand-beige/20 p-3.5">
                <div className="space-y-1">
                  <p className="text-xs font-bold tracking-wider text-brand-ink">
                    뒤풀이 참석 여부
                  </p>
                  <p className="text-[11px] leading-5 text-brand-muted">
                    결혼식 이후 뒤풀이 참석 여부를 알려주세요.
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="afterPartyAttendance"
                  render={({ field }) => (
                    <div
                      role="radiogroup"
                      aria-label="뒤풀이 참석 여부"
                      className="grid grid-cols-3 gap-2"
                    >
                      <AttendanceButton
                        isActive={field.value === "yes"}
                        onClick={() => setAfterPartyAttendance("yes")}
                      >
                        참석
                      </AttendanceButton>
                      <AttendanceButton
                        isActive={field.value === "no"}
                        onClick={() => setAfterPartyAttendance("no")}
                        activeClassName="bg-brand-ink border-brand-ink"
                      >
                        불참
                      </AttendanceButton>
                      <AttendanceButton
                        isActive={field.value === "undecided"}
                        onClick={() => setAfterPartyAttendance("undecided")}
                        activeClassName="bg-brand-muted border-brand-muted"
                      >
                        미정
                      </AttendanceButton>
                    </div>
                  )}
                />
                <FieldError
                  id="rsvp-after-party-attendance-error"
                  message={errors.afterPartyAttendance?.message}
                />

                {afterPartyAttendance === "yes" ? (
                  <label className="block space-y-1">
                    <span className="text-xs font-bold tracking-wider text-brand-ink">
                      뒤풀이 참석 인원
                    </span>
                    <select
                      {...form.register("afterPartyGuestCount", {
                        setValueAs: (value) => Number(value),
                      })}
                      aria-invalid={Boolean(errors.afterPartyGuestCount)}
                      aria-describedby={
                        errors.afterPartyGuestCount
                          ? "rsvp-after-party-guest-count-error"
                          : undefined
                      }
                      className={cn(
                        "w-full appearance-none rounded-md border bg-white px-3.5 py-2.5 text-sm focus:outline-none",
                        errors.afterPartyGuestCount
                          ? "border-brand-ink/60 focus:border-brand-ink"
                          : "border-brand-gold/20 focus:border-brand-gold",
                      )}
                    >
                      <option value={1}>본인 포함 1명</option>
                      <option value={2}>2명</option>
                      <option value={3}>3명</option>
                      <option value={4}>4명 이상</option>
                    </select>
                    <FieldError
                      id="rsvp-after-party-guest-count-error"
                      message={errors.afterPartyGuestCount?.message}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            <label className="block space-y-1">
              <span className="ml-1 text-xs font-bold tracking-wider text-brand-ink">
                성함
              </span>
              <input
                type="text"
                {...form.register("name")}
                maxLength={16}
                aria-invalid={isNameInvalid}
                aria-describedby={errors.name ? "rsvp-name-error" : undefined}
                className={cn(
                  "w-full rounded-md border bg-brand-beige/30 px-3.5 py-2.5 text-sm focus:outline-none",
                  isNameInvalid
                    ? "border-brand-ink/60 focus:border-brand-ink"
                    : "border-brand-gold/20 focus:border-brand-gold",
                )}
                placeholder="성함을 입력해주세요"
                autoComplete="name"
              />
              <FieldError id="rsvp-name-error" message={errors.name?.message} />
            </label>

            <label className="block space-y-1">
              <span className="ml-1 text-xs font-bold tracking-wider text-brand-ink">
                연락처
                {afterPartyAttendance === "yes" ? " (필수)" : " (선택)"}
              </span>
              <Controller
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <input
                    type="tel"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value.replace(/\D/g, "").slice(0, 11))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    maxLength={11}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-invalid={isPhoneInvalid}
                    aria-describedby={errors.phone ? "rsvp-phone-error" : undefined}
                    className={cn(
                      "w-full rounded-md border bg-brand-beige/30 px-3.5 py-2.5 text-sm focus:outline-none",
                      isPhoneInvalid
                        ? "border-brand-ink/60 focus:border-brand-ink"
                        : "border-brand-gold/20 focus:border-brand-gold",
                    )}
                    placeholder={
                      afterPartyAttendance === "yes"
                        ? "01012345678"
                        : "연락처 선택 입력"
                    }
                    autoComplete="tel"
                  />
                )}
              />
              <FieldError id="rsvp-phone-error" message={errors.phone?.message} />
            </label>

            <input
              type="text"
              {...form.register("website")}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-brand-gold py-3.5 text-sm font-medium text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {form.formState.isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              참석 의사 전달하기
            </button>
            {formMessage ? (
              <p
                role={submitRsvp.error ? "alert" : undefined}
                className="text-center text-xs leading-5 text-brand-muted"
              >
                {formMessage}
              </p>
            ) : null}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="ml-1 text-xs text-brand-ink/75">
      {message}
    </p>
  ) : null;
}

function AttendanceButton({
  children,
  isActive,
  activeClassName = "bg-brand-gold border-brand-gold",
  onClick,
}: {
  children: ReactNode;
  isActive: boolean;
  activeClassName?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border py-2.5 text-xs transition-all",
        isActive ? `${activeClassName} text-white` : "border-brand-gold/20 hover:bg-brand-gold/10",
      )}
    >
      {children}
    </button>
  );
}
