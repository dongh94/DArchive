import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title?: ReactNode;
  description?: ReactNode;
};

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-12 text-center">
      <h2 className="mb-4 text-sm uppercase tracking-[0.4em] text-brand-gold">{eyebrow}</h2>
      {title ? <h3 className="mb-2 font-serif text-xl">{title}</h3> : null}
      {description ? <p className="text-xs text-brand-muted">{description}</p> : null}
    </div>
  );
}
