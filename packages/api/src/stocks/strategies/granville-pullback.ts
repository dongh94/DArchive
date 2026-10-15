import { allRequiredPassed, check, checkScore, clamp, closesOf, formatPercent, highest, highsOf, priceFormatter, sma, volumesOf } from "./indicators";
import type { StrategyDefinition } from "./types";

const MAX_DISTANCE_FROM_MA20 = 0.03;

export const granvillePullbackStrategy: StrategyDefinition = {
  id: "granville-pullback",
  name: "그랜빌 이동평균",
  author: "조셉 그랜빌",
  source: "그랜빌의 이동평균 8법칙",
  minBars: 125,
  buy: {
    summary: "이동평균이 정배열인 상승 추세에서 주가가 상승하는 20일선까지 눌렸다가 다시 반등하는 자리(눌림목)를 찾습니다.",
    rules: [
      "20일선 > 60일선 > 120일선 정배열",
      "20일선이 상승 중 (5일 전보다 높음)",
      "종가가 20일선 위 0~3% 이내 (20일선 지지)",
      "눌림 구간 거래량 감소 (5일 평균 < 20일 평균)",
      "당일 양봉, 직전 20일 고점이 20일선보다 5% 이상 위(앞선 상승)면 가점",
    ],
    action: "20일선 지지 확인 후 매수, 20일선 3% 이탈 시 손절, 직전 고점 목표",
    evaluate(bars, { currency }) {
      const price = priceFormatter(currency);
      const latest = bars[bars.length - 1];
      const closes = closesOf(bars);
      const ma20 = sma(closes, 20) ?? 0;
      const ma20Before = sma(closes, 20, 5) ?? 0;
      const ma60 = sma(closes, 60) ?? 0;
      const ma120 = sma(closes, 120) ?? 0;
      const distance = ma20 > 0 ? latest.close / ma20 - 1 : 1;
      const volumes = volumesOf(bars);
      const volumeRatio = (sma(volumes, 5) ?? 0) / (sma(volumes, 20) || 1);
      const recentHigh = highest(highsOf(bars), 20) ?? latest.high;
      const priorRally = ma20 > 0 ? recentHigh / ma20 - 1 : 0;

      const checks = [
        check("aligned", "20 > 60 > 120일선", ma20 > ma60 && ma60 > ma120, `${price(ma20)} > ${price(ma60)} > ${price(ma120)}`, "정배열"),
        check("ma20-rising", "20일선 상승", ma20 > ma20Before, price(ma20), `5일 전 ${price(ma20Before)}`),
        check(
          "near-ma20",
          "20일선 위 0~3%",
          distance >= 0 && distance <= MAX_DISTANCE_FROM_MA20,
          `${distance >= 0 ? "+" : ""}${formatPercent(distance)}`,
          "0% ~ +3%",
        ),
        check("volume-dry", "눌림 거래량 감소", volumeRatio < 1, formatPercent(volumeRatio, 0), "< 100%"),
        check("bullish", "당일 양봉", latest.close > latest.open, price(latest.close - latest.open), "> 0", false),
        check("prior-rally", "앞선 상승 ≥ 5%", priorRally >= 0.05, `+${formatPercent(priorRally)}`, "≥ +5%", false),
      ];

      const alignmentGap = ma120 > 0 ? ma20 / ma120 - 1 : 0;
      const score =
        checkScore(checks) * 60 +
        clamp(1 - Math.abs(distance) / MAX_DISTANCE_FROM_MA20) * 20 +
        clamp(1 - volumeRatio) * 10 +
        clamp(alignmentGap / 0.2) * 10;

      const rationale = [
        ma20 > ma60 && ma60 > ma120
          ? `20·60·120일선이 정배열이고 20일선이 120일선보다 ${formatPercent(alignmentGap)} 위에 있습니다.`
          : "이동평균 정배열이 아닙니다.",
        `종가가 20일선 대비 ${distance >= 0 ? "+" : ""}${formatPercent(distance)}로 ${distance >= 0 && distance <= MAX_DISTANCE_FROM_MA20 ? "지지선 부근까지 눌렸습니다" : "눌림목 구간이 아닙니다"}.`,
        `최근 5일 거래량은 20일 평균의 ${formatPercent(volumeRatio, 0)}입니다.`,
        latest.close > latest.open ? "당일 양봉으로 반등 신호가 나왔습니다." : "",
        `직전 고점 ${price(recentHigh)}이 1차 목표입니다.`,
      ]
        .filter(Boolean)
        .join(" ");

      return {
        eligible: allRequiredPassed(checks),
        score,
        checks,
        rationale,
        levels: { entry: latest.close, stop: ma20 * 0.97, target: recentHigh, note: "20일선 -3% 이탈 시 손절" },
      };
    },
  },
  sell: {
    summary: "그랜빌 매도 법칙(5·6)을 적용합니다. 20일선이 꺾인 상태에서 주가가 그 아래로 내려가거나, 반등해도 하락하는 20일선을 못 넘는 자리입니다.",
    rules: [
      "종가가 20일선 아래",
      "20일선이 하락 중 (5일 전보다 낮음)",
      "5일선 < 20일선 (데드크로스 상태)",
      "20 < 60일선 역배열이면 가점",
      "당일 음봉이면 가점",
    ],
    action: "20일선 회복 전까지 보유분 축소, 신규 매수 보류",
    evaluate(bars, { currency }) {
      const price = priceFormatter(currency);
      const latest = bars[bars.length - 1];
      const closes = closesOf(bars);
      const ma5 = sma(closes, 5) ?? 0;
      const ma20 = sma(closes, 20) ?? 0;
      const ma20Before = sma(closes, 20, 5) ?? 0;
      const ma60 = sma(closes, 60) ?? 0;
      const distance = ma20 > 0 ? latest.close / ma20 - 1 : 0;
      const slope = ma20Before > 0 ? ma20 / ma20Before - 1 : 0;

      const checks = [
        check("below-ma20", "종가 < 20일선", latest.close < ma20, price(latest.close), price(ma20)),
        check("ma20-falling", "20일선 하락", ma20 < ma20Before, price(ma20), `5일 전 ${price(ma20Before)}`),
        check("dead-cross", "5일선 < 20일선", ma5 < ma20, price(ma5), price(ma20)),
        check("reverse-aligned", "20일선 < 60일선", ma20 < ma60, price(ma20), price(ma60), false),
        check("bearish", "당일 음봉", latest.close < latest.open, price(latest.close - latest.open), "< 0", false),
      ];

      const score = checkScore(checks) * 60 + clamp(-distance / 0.1) * 20 + clamp(-slope / 0.03) * 20;

      const rationale = [
        `종가가 20일선 대비 ${distance >= 0 ? "+" : ""}${formatPercent(distance)} 위치입니다.`,
        ma20 < ma20Before ? `20일선이 5일 전보다 ${formatPercent(-slope)} 내려와 하락 추세로 꺾였습니다.` : "20일선은 아직 꺾이지 않았습니다.",
        ma5 < ma20 ? "단기선(5일)이 20일선 아래에 있습니다." : "",
        ma20 < ma60 ? "20일선이 60일선 아래로 역배열입니다." : "",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        eligible: allRequiredPassed(checks),
        score,
        checks,
        rationale,
        levels: { stop: ma20, note: `20일선 ${price(ma20)} 회복 전까지 매수 보류` },
      };
    },
  },
};
