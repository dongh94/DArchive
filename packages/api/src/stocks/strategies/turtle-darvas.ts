import {
  allRequiredPassed,
  averageTrueRange,
  check,
  checkScore,
  clamp,
  formatPercent,
  highest,
  highsOf,
  lowest,
  lowsOf,
  priceFormatter,
  sma,
  volumesOf,
} from "./indicators";
import type { Bar, StrategyDefinition } from "./types";

const BOX_LOOKBACK = 30;
const BOX_CONFIRM_BARS = 3;
const MAX_BOX_HEIGHT = 0.15;

/**
 * Darvas box from the bars before today: the top is a high left untouched for at least
 * three sessions, the bottom is the lowest low after that top.
 */
export function findDarvasBox(bars: Bar[]) {
  const window = bars.slice(-BOX_LOOKBACK - 1, -1);

  if (window.length < BOX_LOOKBACK) {
    return null;
  }

  let topIndex = 0;
  window.forEach((bar, index) => {
    if (bar.high > window[topIndex].high) {
      topIndex = index;
    }
  });

  const afterTop = window.slice(topIndex + 1);

  if (afterTop.length < BOX_CONFIRM_BARS) {
    return null;
  }

  const top = window[topIndex].high;
  const bottom = Math.min(...afterTop.map((bar) => bar.low));

  return { top, bottom, height: (top - bottom) / top, days: afterTop.length };
}

export const turtleDarvasStrategy: StrategyDefinition = {
  id: "turtle-darvas",
  name: "터틀·다바스 돌파",
  author: "리처드 데니스 · 니콜라스 다바스",
  source: "『터틀의 방식』(Way of the Turtle), 『나는 주식으로 200만 달러를 벌었다』",
  minBars: 60,
  buy: {
    summary: "가격이 일정 구간(박스)에서 다지다가 신고가로 돌파하고 거래량이 실리는 순간을 추세의 시작으로 봅니다.",
    rules: [
      "종가가 직전 20일 최고가 돌파 (터틀 시스템 1)",
      "직전 30일 안에 3일 이상 깨지지 않은 박스 상단을 돌파 (다바스)",
      "거래량이 20일 평균의 1.5배 이상",
      "직전 55일 최고가 돌파 (터틀 시스템 2) 시 가점",
      "박스 높이 15% 이하의 촘촘한 박스일수록 가점",
    ],
    action: "돌파 시 매수, 2N(ATR) 또는 박스 하단 이탈 시 손절",
    evaluate(bars, { currency }) {
      const price = priceFormatter(currency);
      const latest = bars[bars.length - 1];
      const highs = highsOf(bars);
      const high20 = highest(highs, 20, 1) ?? Infinity;
      const high55 = highest(highs, 55, 1) ?? Infinity;
      const box = findDarvasBox(bars);
      const volumeRatio = latest.volume / (sma(volumesOf(bars), 20, 1) || 1);
      const atr = averageTrueRange(bars, 20) ?? 0;
      const isBoxBreakout = box !== null && box.height <= MAX_BOX_HEIGHT && latest.close > box.top;

      const checks = [
        check("break-20", "20일 신고가 돌파", latest.close > high20, price(latest.close), price(high20)),
        check(
          "darvas",
          "다바스 박스 상단 돌파",
          isBoxBreakout,
          box ? `상단 ${price(box.top)} · 높이 ${formatPercent(box.height)}` : "박스 없음",
          "높이 ≤ 15%, 3일 이상 유지",
        ),
        check("volume", "거래량 ≥ 1.5배", volumeRatio >= 1.5, `${volumeRatio.toFixed(1)}배`, "≥ 1.5배"),
        check("break-55", "55일 신고가 돌파", latest.close > high55, price(latest.close), price(high55), false),
      ];

      const score =
        checkScore(checks) * 60 + clamp((volumeRatio - 1) / 3) * 20 + (box ? clamp(1 - box.height / MAX_BOX_HEIGHT) * 20 : 0);

      const turtleStop = latest.close - 2 * atr;
      const stop = box ? Math.max(turtleStop, box.bottom) : turtleStop;

      const rationale = [
        latest.close > high20 ? `직전 20일 고점 ${price(high20)}을 종가로 돌파했습니다.` : `20일 고점 ${price(high20)}까지 아직 닿지 않았습니다.`,
        box
          ? `${box.days}일간 ${price(box.bottom)}~${price(box.top)} 박스(높이 ${formatPercent(box.height)})를 다진 뒤 ${isBoxBreakout ? "상단을 넘었습니다" : "아직 박스 안에 있습니다"}.`
          : "최근 30일 안에 확정된 박스가 없습니다.",
        `거래량은 평소의 ${volumeRatio.toFixed(1)}배입니다.`,
        latest.close > high55 ? "55일 신고가까지 넘겨 더 긴 추세의 돌파입니다." : "",
        `손절 참고가는 ${price(stop)}(2N=${price(2 * atr)} 또는 박스 하단)입니다.`,
      ]
        .filter(Boolean)
        .join(" ");

      return {
        eligible: allRequiredPassed(checks),
        score,
        checks,
        rationale,
        levels: { entry: latest.close, stop, note: "N = 20일 ATR" },
      };
    },
  },
  sell: {
    summary: "터틀의 청산 규칙과 다바스 박스 하단 이탈을 봅니다. 추세가 끝났다고 판단하는 지점입니다.",
    rules: [
      "종가가 직전 10일 최저가 아래로 이탈 (터틀 시스템 1 청산)",
      "거래량이 20일 평균 이상",
      "직전 20일 최저가 이탈 (시스템 2 청산) 시 가점",
      "다바스 박스 하단 이탈 시 가점",
    ],
    action: "이탈 확인 시 보유분 청산, 다시 신고가 나기 전까지 관망",
    evaluate(bars, { currency }) {
      const price = priceFormatter(currency);
      const latest = bars[bars.length - 1];
      const lows = lowsOf(bars);
      const low10 = lowest(lows, 10, 1) ?? -Infinity;
      const low20 = lowest(lows, 20, 1) ?? -Infinity;
      const box = findDarvasBox(bars);
      const volumeRatio = latest.volume / (sma(volumesOf(bars), 20, 1) || 1);
      const isBoxBreakdown = box !== null && latest.close < box.bottom;
      const depth = low10 > 0 ? 1 - latest.close / low10 : 0;

      const checks = [
        check("break-low-10", "10일 최저가 이탈", latest.close < low10, price(latest.close), price(low10)),
        check("volume", "거래량 ≥ 20일 평균", volumeRatio >= 1, `${volumeRatio.toFixed(1)}배`, "≥ 1.0배"),
        check("break-low-20", "20일 최저가 이탈", latest.close < low20, price(latest.close), price(low20), false),
        check("box-breakdown", "다바스 박스 하단 이탈", isBoxBreakdown, box ? `하단 ${price(box.bottom)}` : "박스 없음", "종가 < 하단", false),
      ];

      const score = checkScore(checks) * 60 + clamp(depth / 0.08) * 20 + clamp((volumeRatio - 1) / 2) * 20;

      const rationale = [
        latest.close < low10 ? `직전 10일 최저가 ${price(low10)}를 종가로 깼습니다.` : `10일 최저가 ${price(low10)} 위에서 버티고 있습니다.`,
        latest.close < low20 ? `20일 최저가 ${price(low20)}까지 깨져 더 긴 추세도 꺾였습니다.` : "",
        isBoxBreakdown && box ? `박스 하단 ${price(box.bottom)} 아래로 내려왔습니다.` : "",
        `거래량은 평소의 ${volumeRatio.toFixed(1)}배입니다.`,
      ]
        .filter(Boolean)
        .join(" ");

      return {
        eligible: allRequiredPassed(checks),
        score,
        checks,
        rationale,
        levels: { stop: low10, note: "10일 최저가 이탈 = 터틀 단기 청산 신호" },
      };
    },
  },
};
