export function AdminPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-8">
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/55">아직 관리 기능을 붙이지 않은 영역입니다. 통합 admin 라우트만 먼저 열어두고, 실제 앱이 생기면 여기서 확장합니다.</p>
    </div>
  );
}
