import Link from "next/link";
import { Calendar, Camera, MessageSquare, Send } from "lucide-react";

type ClosingSectionProps = {
  addToCalendar: () => void;
  onRsvp: () => void;
  onShare: () => void;
};

export function ClosingSection({ addToCalendar, onRsvp, onShare }: ClosingSectionProps) {
  return (
    <section className="bg-white px-6 py-20 pb-32 text-center">
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="font-serif text-lg italic tracking-widest text-brand-gold">Thank You</p>
          <p className="text-sm leading-relaxed text-brand-muted">
            저희의 시작을 축복해주시는 모든 분들께<br />
            진심으로 감사의 인사를 드립니다.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <Link
            href="/wedding/photos"
            className="flex items-center justify-center gap-2 rounded-full border border-brand-gold/30 bg-brand-beige/50 px-8 py-4 text-sm font-medium text-brand-ink shadow-sm transition-all hover:border-brand-gold/45 hover:bg-brand-beige active:scale-95"
          >
            <Camera size={18} />
            게스트 스냅 바로가기
          </Link>
          <button
            type="button"
            onClick={onRsvp}
            className="flex items-center justify-center gap-2 rounded-full bg-brand-ink px-8 py-4 text-sm font-medium text-white shadow-md transition-all hover:bg-brand-ink/90 active:scale-95"
          >
            <Send size={18} />
            참석 의사 전달하기
          </button>
          <button
            type="button"
            onClick={addToCalendar}
            className="flex items-center justify-center gap-2 rounded-full bg-brand-gold px-8 py-4 text-sm font-medium text-white shadow-md transition-all hover:bg-brand-gold/90 active:scale-95"
          >
            <Calendar size={18} />
            캘린더 저장하기
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex items-center justify-center gap-2 rounded-full border border-brand-gold/30 bg-white px-8 py-4 text-sm font-medium text-brand-gold shadow-sm transition-all hover:bg-brand-beige active:scale-95"
          >
            <MessageSquare size={18} />
            카카오톡 공유하기
          </button>
        </div>
      </div>
    </section>
  );
}
