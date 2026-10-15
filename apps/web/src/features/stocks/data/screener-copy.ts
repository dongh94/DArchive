export const screenerCopy = {
  title: "Stock Lab",
  description: "유명 차트 매매법으로 국내·미국 종목을 평가해, 매매법마다 지금 사기 좋은 종목과 팔아야 할 신호가 나온 종목 Top 20을 이유와 함께 보여드려요.",
  disclaimer:
    "개인 학습용 정보이며 투자 권유가 아닙니다. 장 마감 후 일봉(토스증권 오픈API)으로 계산한 결과라 장중 가격과 다를 수 있습니다. 매수·매도 판단과 책임은 본인에게 있습니다.",
  emptyTitle: "아직 계산된 결과가 없어요",
  emptyDescription: "허용 IP로 등록한 맥에서 pnpm stocks:sync를 실행하면 일봉을 모아 매매법별 Top 20을 계산해요.",
  regions: [
    { value: "kr", label: "국내" },
    { value: "us", label: "미국" },
  ],
  sides: {
    buy: { label: "매수", listTitle: "지금 사기 좋은 종목", scoreLabel: "매수 적합도", eligibleLabel: "매수 조건 모두 충족" },
    sell: { label: "매도", listTitle: "매도 신호가 나온 종목", scoreLabel: "매도 신호 강도", eligibleLabel: "매도 조건 모두 충족" },
  },
  ineligibleNotice: "필수 조건을 모두 충족한 종목이 20개보다 적어서, 점수가 높은 근접 후보를 함께 보여드려요.",
  universeNote: {
    kr: "20일 평균 거래대금 10억 원 이상 보통주",
    us: "시가총액 3조 원(약 $20억) 이상, 20일 평균 거래대금 $1,000만 이상",
  },
} as const;
