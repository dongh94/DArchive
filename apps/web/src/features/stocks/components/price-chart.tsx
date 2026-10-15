import { useId } from "react";

const WIDTH = 600;
const PADDING_Y = 12;

function scale(values: (number | null)[], min: number, max: number, height: number) {
  const span = max - min || 1;
  const step = WIDTH / Math.max(values.length - 1, 1);

  return values.map((value, index) =>
    value === null ? null : { x: index * step, y: PADDING_Y + (1 - (value - min) / span) * (height - PADDING_Y * 2) },
  );
}

const toPath = (points: ({ x: number; y: number } | null)[]) =>
  points
    .filter((point): point is { x: number; y: number } => point !== null)
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

export function PriceChart({
  closes,
  ma20,
  label,
  height = 180,
}: {
  closes: number[];
  ma20: (number | null)[];
  label: string;
  height?: number;
}) {
  const gradientId = useId();

  if (closes.length < 2) {
    return null;
  }

  const values = [...closes, ...ma20.filter((value): value is number => value !== null)];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const isUp = closes[closes.length - 1] >= closes[0];
  const color = isUp ? "#f04452" : "#3182f6";
  const closePoints = scale(closes, min, max, height);
  const linePath = toPath(closePoints);
  const last = closePoints[closePoints.length - 1];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" style={{ height }} role="img" aria-label={label} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${linePath} L${WIDTH},${height} L0,${height} Z`} fill={`url(#${gradientId})`} />
      <path
        d={toPath(scale(ma20, min, max, height))}
        fill="none"
        stroke="#b0b8c1"
        strokeWidth={1.25}
        strokeDasharray="4 4"
        vectorEffect="non-scaling-stroke"
      />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {last ? <circle cx={last.x} cy={last.y} r={4} fill={color} stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" /> : null}
    </svg>
  );
}
