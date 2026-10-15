import { allRequiredPassed, check, checkScore, clamp, closesOf, formatPercent, priceFormatter, sma, volumesOf } from "./indicators";
import type { Bar, StrategyDefinition } from "./types";

const K = 0.5;
const NOISE_PERIOD = 20;

/** Larry Williams' noise ratio: share of the day's range that was not net movement. */
function averageNoise(bars: Bar[]) {
  const recent = bars.slice(-NOISE_PERIOD);
  const noises = recent.map((bar) => (bar.high > bar.low ? 1 - Math.abs(bar.close - bar.open) / (bar.high - bar.low) : 1));

  return noises.reduce((sum, value) => sum + value, 0) / noises.length;
}

export const volatilityBreakoutStrategy: StrategyDefinition = {
  id: "volatility-breakout",
  name: "변동성 돌파",
  author: "래리 윌리엄스",
  source: "『장기 투자 비밀』(Long-Term Secrets to Short-Term Trading)",
  minBars: 30,
  buy: {
    summary: "오늘 변동폭의 K배만큼 내일 시가에서 상승하면 매수하고 다음 날 시가에 파는 단기 전략입니다. 추세와 노이즈가 좋은 종목을 고릅니다.",
    rules: [
      "내일 목표가 = 내일 시가 + 오늘 (고가−저가) × 0.5",
      "종가가 5일·20일 이동평균 위 (상승 추세 필터)",
      "20일 평균 노이즈 비율 < 0.5 (방향성이 뚜렷한 종목)",
      "오늘 변동폭이 종가의 2~12% (너무 작거나 크지 않음)",
      "거래량이 20일 평균 이상이면 가점",
    ],
    action: "목표가 도달 시 매수, 다음 날 시가 매도 (하루 보유)",
    evaluate(bars, { currency }) {
      const price = priceFormatter(currency);
      const latest = bars[bars.length - 1];
      const closes = closesOf(bars);
      const ma5 = sma(closes, 5) ?? 0;
      const ma20 = sma(closes, 20) ?? 0;
      const noise = averageNoise(bars);
      const range = latest.high - latest.low;
      const rangeRatio = latest.close > 0 ? range / latest.close : 0;
      const volumeRatio = latest.volume / (sma(volumesOf(bars), 20) || 1);

      const checks = [
        check("above-ma5", "종가 > 5일선", latest.close > ma5, price(latest.close), price(ma5)),
        check("above-ma20", "종가 > 20일선", latest.close > ma20, price(latest.close), price(ma20)),
        check("noise", "20일 노이즈 < 0.5", noise < 0.5, noise.toFixed(2), "< 0.50"),
        check("range", "변동폭 2~12%", rangeRatio >= 0.02 && rangeRatio <= 0.12, formatPercent(rangeRatio), "2% ~ 12%"),
        check("volume", "거래량 ≥ 20일 평균", volumeRatio >= 1, formatPercent(volumeRatio, 0), "≥ 100%", false),
      ];

      const breakoutGap = range * K;
      const trendStrength = ma20 > 0 ? latest.close / ma20 - 1 : 0;
      const score = checkScore(checks) * 60 + clamp((0.5 - noise) / 0.3) * 25 + clamp(trendStrength / 0.1) * 15;

      const rationale = [
        `20일 평균 노이즈 ${noise.toFixed(2)}로 방향성이 ${noise < 0.4 ? "뚜렷" : "보통"}합니다.`,
        `종가가 20일선보다 ${formatPercent(trendStrength)} 위에 있어 상승 추세 필터를 ${latest.close > ma20 ? "통과" : "통과하지 못"}했습니다.`,
        `오늘 변동폭 ${price(range)}(${formatPercent(rangeRatio)}) × 0.5 = ${price(breakoutGap)}.`,
        `내일 시가가 오늘 종가와 같다면 목표가는 약 ${price(latest.close + breakoutGap)}입니다.`,
      ].join(" ");

      return {
        eligible: allRequiredPassed(checks),
        score,
        checks,
        rationale,
        levels: {
          entry: latest.close + breakoutGap,
          note: `내일 시가 + ${price(breakoutGap)} 돌파 시 매수, 다음 날 시가 매도`,
        },
      };
    },
  },
  sell: {
    summary: "같은 원리를 아래 방향으로 적용합니다. 하락 추세에서 변동폭의 K배만큼 내려가면 이탈하는 단기 하락 신호입니다.",
    rules: [
      "내일 이탈가 = 내일 시가 − 오늘 (고가−저가) × 0.5",
      "종가가 5일·20일 이동평균 아래 (하락 추세 필터)",
      "20일 평균 노이즈 비율 < 0.5",
      "당일 음봉, 변동폭 2~12%",
      "거래량이 20일 평균 이상이면 가점",
    ],
    action: "이탈가 하향 돌파 시 보유분 정리, 신규 매수 보류",
    evaluate(bars, { currency }) {
      const price = priceFormatter(currency);
      const latest = bars[bars.length - 1];
      const closes = closesOf(bars);
      const ma5 = sma(closes, 5) ?? 0;
      const ma20 = sma(closes, 20) ?? 0;
      const noise = averageNoise(bars);
      const range = latest.high - latest.low;
      const rangeRatio = latest.close > 0 ? range / latest.close : 0;
      const volumeRatio = latest.volume / (sma(volumesOf(bars), 20) || 1);

      const checks = [
        check("below-ma5", "종가 < 5일선", latest.close < ma5, price(latest.close), price(ma5)),
        check("below-ma20", "종가 < 20일선", latest.close < ma20, price(latest.close), price(ma20)),
        check("noise", "20일 노이즈 < 0.5", noise < 0.5, noise.toFixed(2), "< 0.50"),
        check(
          "bearish-range",
          "음봉 · 변동폭 2~12%",
          latest.close < latest.open && rangeRatio >= 0.02 && rangeRatio <= 0.12,
          formatPercent(rangeRatio),
          "음봉, 2% ~ 12%",
        ),
        check("volume", "거래량 ≥ 20일 평균", volumeRatio >= 1, formatPercent(volumeRatio, 0), "≥ 100%", false),
      ];

      const breakdownGap = range * K;
      const weakness = ma20 > 0 ? 1 - latest.close / ma20 : 0;
      const score = checkScore(checks) * 60 + clamp((0.5 - noise) / 0.3) * 25 + clamp(weakness / 0.1) * 15;

      const rationale = [
        `20일 평균 노이즈 ${noise.toFixed(2)}.`,
        `종가가 20일선보다 ${formatPercent(weakness)} 아래에 있어 ${latest.close < ma20 ? "하락 추세" : "추세 약화 전 단계"}입니다.`,
        `내일 시가가 오늘 종가와 같다면 이탈가는 약 ${price(latest.close - breakdownGap)}입니다.`,
      ].join(" ");

      return {
        eligible: allRequiredPassed(checks),
        score,
        checks,
        rationale,
        levels: { stop: latest.close - breakdownGap, note: `내일 시가 − ${price(breakdownGap)} 이탈 시 정리` },
      };
    },
  },
};
