import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { loginAdmin } from "../lib/actions";

const errorMessages = {
  config: "ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.",
  invalid: "관리자 비밀번호가 올바르지 않습니다.",
} satisfies Record<string, string>;

export function AdminLoginPage({ error }: { error?: string }) {
  const errorMessage = error === "config" || error === "invalid" ? errorMessages[error] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16 text-foreground">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex text-sm font-semibold text-foreground/50 transition hover:text-foreground">
          DArchive
        </Link>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#4285f4]">Admin</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">관리자 로그인</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/55">DArchive 운영 화면에 접근하려면 관리자 비밀번호를 입력하세요.</p>

          <form action={loginAdmin} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className="h-12 rounded-lg border border-border bg-muted px-4 text-base outline-none transition focus:border-[#4285f4] focus:bg-card"
                required
              />
            </label>
            {errorMessage ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{errorMessage}</p> : null}
            <button type="submit" className="h-12 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition hover:bg-primary/90">
              Login
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
