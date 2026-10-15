import {
  allRequiredPassed,
  check,
  checkScore,
  clamp,
  closesOf,
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

const STOP_LOSS_RATIO = 0.08;

/** Range (high-low)/high of three consecutive 20-bar windows, oldest first. */
function contractionDepths(bars: Bar[]) {
  const highs = highsOf(bars);
  const lows = lowsOf(bars);

  return [40, 20, 0].map((offset) => {
    const high = highest(highs, 20, offset) ?? 0;
    const low = lowest(lows, 20, offset) ?? 0;
    return high > 0 ? (high - low) / high : 0;
  });
}

export const sepaStrategy: StrategyDefinition = {
  id: "sepa",
  name: "SEPA 추세 템플릿",
  author: "마크 미너비니",
  source: "『초수익 성장주 투자』(Trade Like a Stock Market Wizard)",
  minBars: 252,
  buy: {
    summary: "장기 상승 추세(2단계)에 있는 주도주 중 변동성이 줄어들며 피벗 돌파를 준비하는 종목을 찾습니다.",
    rules: [
      "종가가 150일·200일 이동평균 위",
      "150일선 > 200일선, 200일선이 최소 1개월 상승",
      "50일선 > 150일선 > 200일선, 종가 > 50일선",
      "52주 저점 대비 30% 이상, 52주 고점 대비 25% 이내",
      "상대강도(RS) 70 이상",
      "VCP: 조정 폭이 점점 줄고 거래량이 마르면 가점",
    ],
    action: "피벗 돌파 매수, 매수가 대비 7~8% 손절",
    evaluate(bars, { rsRating, currency }) {
      const price = priceFormatter(currency);
      const closes = closesOf(bars);
      const close = closes[closes.length - 1];
      const ma50 = sma(closes, 50) ?? 0;
      const ma150 = sma(closes, 150) ?? 0;
      const ma200 = sma(closes, 200) ?? 0;
      const ma200MonthAgo = sma(closes, 200, 21) ?? 0;
      const high52 = highest(highsOf(bars), 252) ?? close;
      const low52 = lowest(lowsOf(bars), 252) ?? close;
      const fromLow = low52 > 0 ? close / low52 - 1 : 0;
      const fromHigh = high52 > 0 ? 1 - close / high52 : 1;

      const checks = [
        check("above-150-200", "종가 > 150·200일선", close > ma150 && close > ma200, price(close), `${price(ma150)} / ${price(ma200)}`),
        check("ma150-over-200", "150일선 > 200일선", ma150 > ma200, price(ma150), price(ma200)),
        check("ma200-rising", "200일선 1개월 상승", ma200 > ma200MonthAgo, price(ma200), `1개월 전 ${price(ma200MonthAgo)}`),
        check("ma50-over-150-200", "50일선 > 150·200일선", ma50 > ma150 && ma50 > ma200, price(ma50), price(Math.max(ma150, ma200))),
        check("above-50", "종가 > 50일선", close > ma50, price(close), price(ma50)),
        check("off-low", "52주 저점 대비 +30%↑", fromLow >= 0.3, `+${formatPercent(fromLow)}`, "≥ +30%"),
        check("near-high", "52주 고점 대비 -25% 이내", fromHigh <= 0.25, `-${formatPercent(fromHigh)}`, "≤ -25%"),
        check("rs", "상대강도 RS ≥ 70", rsRating >= 70, String(rsRating), "≥ 70"),
      ];

      const depths = contractionDepths(bars);
      const isContracting = depths[0] > depths[1] && depths[1] > depths[2];
      const volumes = volumesOf(bars);
      const volumeRatio = (sma(volumes, 10) ?? 0) / (sma(volumes, 50) || 1);
      const isVolumeDrying = volumeRatio < 0.8;

      checks.push(
        check("vcp", "VCP 변동성 수축", isContracting, depths.map((depth) => formatPercent(depth, 0)).join(" → "), "점점 감소", false),
        check("volume-dry", "거래량 감소(10일/50일)", isVolumeDrying, formatPercent(volumeRatio, 0), "< 80%", false),
      );

      const pivot = highest(highsOf(bars), 20) ?? close;
      const score =
        checkScore(checks) * 60 + (rsRating / 99) * 25 + clamp(1 - fromHigh / 0.25) * 10 + clamp(1 - depths[2] / 0.15) * 5;

      const passedTemplate = checks.slice(0, 8).filter((item) => item.passed).length;
      const rationale = [
        `추세 템플릿 8개 중 ${passedTemplate}개 충족, RS ${rsRating}.`,
        `52주 고점까지 ${formatPercent(fromHigh)} 남았습니다.`,
        isContracting
          ? `20일 단위 조정 폭이 ${depths.map((depth) => formatPercent(depth, 0)).join("→")}로 줄어드는 VCP 모양입니다.`
          : "변동성 수축(VCP)은 아직 뚜렷하지 않습니다.",
        isVolumeDrying ? `최근 거래량이 50일 평균의 ${formatPercent(volumeRatio, 0)}로 말라 있습니다.` : "",
        `피벗 ${price(pivot)} 돌파 시 진입 후보입니다.`,
      ]
        .filter(Boolean)
        .join(" ");

      return {
        eligible: allRequiredPassed(checks),
        score,
        checks,
        rationale,
        levels: {
          entry: pivot,
          stop: pivot * (1 - STOP_LOSS_RATIO),
          note: "피벗(최근 20일 고점) 돌파 시 매수, 매수가 -8% 손절",
        },
      };
    },
  },
  sell: {
    summary: "상승 추세에 있던 종목이 50일선을 대량 거래로 깨며 2단계가 끝나가는 신호를 찾습니다. 보유 중이면 정리, 신규 매수는 피할 구간입니다.",
    rules: [
      "최근 20일 안에는 50일선 위에 있었음 (막 꺾인 추세)",
      "종가가 50일선 아래로 이탈",
      "이탈일 거래량이 50일 평균의 1.5배 이상이면 가점",
      "50일선 하락 전환, 150일선 이탈, RS 50 미만이면 가점",
    ],
    action: "50일선 회복 실패 시 정리, 150일선 이탈 시 전량 매도",
    evaluate(bars, { rsRating, currency }) {
      const price = priceFormatter(currency);
      const closes = closesOf(bars);
      const latest = bars[bars.length - 1];
      const ma50 = sma(closes, 50) ?? 0;
      const ma50Before = sma(closes, 50, 5) ?? 0;
      const ma150 = sma(closes, 150) ?? 0;
      const wasAbove = bars.slice(-21, -1).some((bar, index) => bar.close > (sma(closes, 50, 20 - index) ?? Infinity));
      const breakdown = ma50 > 0 ? latest.close / ma50 - 1 : 0;
      const volumeRatio = latest.volume / (sma(volumesOf(bars), 50, 1) || 1);

      const checks = [
        check("was-above-50", "최근 20일 내 50일선 위", wasAbove, wasAbove ? "있었음" : "없음", "있었음"),
        check("below-50", "종가 < 50일선", latest.close < ma50, price(latest.close), price(ma50)),
        check("heavy-volume", "이탈 거래량 ≥ 1.5배", volumeRatio >= 1.5, `${volumeRatio.toFixed(1)}배`, "≥ 1.5배", false),
        check("ma50-falling", "50일선 하락 전환", ma50 < ma50Before, price(ma50), `5일 전 ${price(ma50Before)}`, false),
        check("below-150", "종가 < 150일선", latest.close < ma150, price(latest.close), price(ma150), false),
        check("weak-rs", "상대강도 RS < 50", rsRating < 50, String(rsRating), "< 50", false),
      ];

      const score = checkScore(checks) * 60 + clamp(-breakdown / 0.1) * 20 + clamp((volumeRatio - 1) / 2) * 10 + ((99 - rsRating) / 99) * 10;

      const rationale = [
        wasAbove ? "최근까지 50일선 위에서 움직이던 종목입니다." : "이미 오래전에 50일선 아래로 내려온 종목입니다.",
        `종가가 50일선(${price(ma50)}) 대비 ${formatPercent(breakdown)} 위치입니다.`,
        volumeRatio >= 1.5 ? `이탈일 거래량이 평소의 ${volumeRatio.toFixed(1)}배로, 기관 매도 가능성이 있습니다.` : "",
        ma50 < ma50Before ? "50일선도 꺾이기 시작했습니다." : "",
        `RS ${rsRating}.`,
      ]
        .filter(Boolean)
        .join(" ");

      return {
        eligible: allRequiredPassed(checks),
        score,
        checks,
        rationale,
        levels: { stop: ma50, note: `50일선 ${price(ma50)} 회복 못 하면 정리` },
      };
    },
  },
};
