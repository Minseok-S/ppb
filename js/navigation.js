// ════════════════════════════════════════
//  STEP NAV
// ════════════════════════════════════════
let curStep = 1;
const TOTAL = 17;
const stepLabels = [
  "기본 정보",
  "수집 항목",
  "아동 개인정보",
  "파기",
  "제3자 제공",
  "위탁",
  "국외이전",
  "안전조치",
  "쿠키",
  "행태정보",
  "권리행사",
  "책임자",
  "추가적 이용·제공",
  "민감정보",
  "가명정보",
  "자동화 결정",
  "국내대리인",
];

function goStep(n) {
  document.getElementById("step" + curStep).classList.remove("active");
  document
    .querySelector('[data-step="' + curStep + '"]')
    .classList.remove("active");
  curStep = n;
  document.getElementById("step" + curStep).classList.add("active");
  document
    .querySelector('[data-step="' + curStep + '"]')
    .classList.add("active");
  document.getElementById("progressFill").style.width =
    Math.round((curStep / TOTAL) * 100) + "%";
  document.getElementById("progressText").textContent =
    "STEP " + curStep + "/" + TOTAL + " · " + stepLabels[curStep - 1];
  document.getElementById("prevBtn").style.display =
    curStep > 1 ? "flex" : "none";
  document.getElementById("nextBtn").style.display =
    curStep < TOTAL ? "flex" : "none";
}

function nextStep() {
  if (curStep < TOTAL) {
    document
      .querySelector('[data-step="' + curStep + '"]')
      .classList.add("done");
    goStep(curStep + 1);
  }
}

function prevStep() {
  if (curStep > 1) goStep(curStep - 1);
}
