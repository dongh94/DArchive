"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerCaller } from "./api";
import { requireAdmin } from "./auth";

function getNullableNumber(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getNullableString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" && value.length > 0 ? value : null;
}

function getNullableAfterPartyAttendance(formData: FormData) {
  const value = formData.get("afterPartyAttendance");

  return value === "YES" || value === "NO" || value === "UNDECIDED" ? value : null;
}

export async function deleteWeddingRsvp(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");

  if (typeof id !== "string" || id.length === 0) {
    return;
  }

  const caller = await createServerCaller();
  await caller.admin.weddingRsvpDelete({ id });

  revalidatePath("/admin/wedding");
}

export async function updateWeddingRsvp(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  const name = formData.get("name");
  const attendance = formData.get("attendance");

  if (typeof id !== "string" || typeof name !== "string" || (attendance !== "YES" && attendance !== "NO")) {
    redirect("/admin/wedding?error=rsvp-update");
  }

  try {
    const caller = await createServerCaller();
    await caller.admin.weddingRsvpUpdate({
      id,
      name,
      attendance,
      guestCount: getNullableNumber(formData, "guestCount"),
      afterPartyAttendance: getNullableAfterPartyAttendance(formData),
      afterPartyGuestCount: getNullableNumber(formData, "afterPartyGuestCount"),
      phone: getNullableString(formData, "phone"),
    });
  } catch {
    redirect("/admin/wedding?error=rsvp-update");
  }

  revalidatePath("/admin/wedding");
}

export async function setWeddingGuestbookVisibility(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  const isVisible = formData.get("isVisible");

  if (typeof id !== "string" || id.length === 0) {
    return;
  }

  const caller = await createServerCaller();
  await caller.admin.weddingGuestbookSetVisibility({
    id,
    isVisible: isVisible === "true",
  });

  revalidatePath("/admin/wedding");
}
