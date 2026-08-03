const UPLOADER_NAME_KEY = "wedding-photo-uploader-name";

export function readStoredUploaderName() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(UPLOADER_NAME_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function storeUploaderName(name: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(UPLOADER_NAME_KEY, name.trim());
  } catch {
    // Ignore storage failures (private mode, quota, etc).
  }
}
