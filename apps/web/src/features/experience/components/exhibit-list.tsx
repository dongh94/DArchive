import { Trophy } from "lucide-react";
import { exhibitKindLabels, type GalleryZone } from "../data/gallery-content";

export function ExhibitList({ zones }: { zones: GalleryZone[] }) {
  return (
    <section id="exhibit-list" className="experience-list px-5 py-14 md:px-12" aria-labelledby="exhibit-list-title">
      <div className="mx-auto max-w-5xl">
        <h2 id="exhibit-list-title" className="text-xl font-bold">
          전시 목록
        </h2>
        <p className="mt-1 text-sm text-foreground/55">전시관을 걷지 않고 한 번에 훑어볼 수 있는 목록입니다.</p>

        <div className="mt-8 grid gap-10">
          {zones.map((zone) => (
            <section key={zone.id} aria-labelledby={`zone-${zone.id}`}>
              <h3 id={`zone-${zone.id}`} className="flex items-baseline gap-3 border-b border-border pb-2">
                <span className="text-base font-bold">{zone.title}</span>
                <span className="text-sm text-foreground/50">{zone.caption}</span>
              </h3>
              <div className="mt-2 divide-y divide-border">
                {zone.exhibits.map((exhibit) => (
                  <details key={exhibit.id} className="group py-4">
                    <summary className="grid cursor-pointer list-none gap-1 md:grid-cols-[150px_minmax(0,1fr)] md:gap-6">
                      <span className="text-xs font-semibold text-foreground/50">
                        {exhibit.period}
                        <span className="ml-2 text-[var(--list-accent)]">{exhibitKindLabels[exhibit.kind]}</span>
                      </span>
                      <span>
                        <span className="flex flex-wrap items-center gap-2 font-semibold">
                          {exhibit.title}
                          {exhibit.badge ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#b58100]">
                              <Trophy className="h-3 w-3" aria-hidden="true" />
                              {exhibit.badge}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-foreground/60">{exhibit.summary}</span>
                      </span>
                    </summary>
                    <div className="mt-3 md:ml-[174px]">
                      {exhibit.details.length > 0 ? (
                        <ul className="grid list-disc gap-1.5 pl-5 text-sm leading-6 text-foreground/75">
                          {exhibit.details.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>
                      ) : null}
                      {exhibit.result ? <p className="mt-3 text-sm leading-6 text-foreground/75">결과 · {exhibit.result}</p> : null}
                      <p className="mt-3 text-xs text-foreground/50">{exhibit.tech.join(" · ")}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
