// ════════════════════════════════════════
//  DYNAMIC — AUTO DECISION (Step 16)
// ════════════════════════════════════════
function addAdInfo() {
  const id = "adinfo_" + Date.now();
  const c = document.getElementById("adInfoRows");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">개인정보 유형</span><button class="btn-icon" onclick="removeAdInfo('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">처리 단계 / 결정명</label><input type="text" data-field="stage" placeholder="예: AI 서류전형, AI 면접전형" oninput="syncAdInfo();updatePreview()"></div>
      <div class="field-group"><label class="field-label">개인정보 유형</label><input type="text" data-field="infoType" placeholder="예: 자기소개서, 학부성적, 응답패턴" oninput="syncAdInfo();updatePreview()"></div>
      <div class="field-group" style="max-width:100px"><label class="field-label">반영 비중</label><input type="text" data-field="weight" placeholder="예: 30%" oninput="syncAdInfo();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAdInfo(id) {
  document.getElementById(id)?.remove();
  syncAdInfo();
  updatePreview();
}

function syncAdInfo() {
  S.adInfoRows = [];
  document.querySelectorAll("#adInfoRows .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.adInfoRows.push({
      stage: g("stage"),
      infoType: g("infoType"),
      weight: g("weight"),
    });
  });
}
