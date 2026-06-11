// ════════════════════════════════════════
//  DYNAMIC — DELEGATE
// ════════════════════════════════════════
function addDelegate() {
  const id = "dl_" + Date.now(),
    c = document.getElementById("dlItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">수탁업체</span><button class="btn-icon" onclick="removeAndSyncDL('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">수탁자</label><input type="text" data-field="company" placeholder="업체명" oninput="syncDL();updatePreview()"></div>
      <div class="field-group"><label class="field-label">위탁 업무</label><input type="text" data-field="task" placeholder="업무 내용" oninput="syncDL();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAndSyncDL(id) {
  document.getElementById(id)?.remove();
  syncDL();
  updatePreview();
}

function syncDL() {
  S.dlItems = [];
  document.querySelectorAll("#dlItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.dlItems.push({ company: g("company"), task: g("task") });
  });
}

function addSubDelegate() {
  const id = "sdl_" + Date.now(),
    c = document.getElementById("dlSubItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">재수탁업체</span><button class="btn-icon" onclick="removeAndSyncSDL('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">재수탁자</label><input type="text" data-field="company" placeholder="업체명" oninput="syncSDL();updatePreview()"></div>
      <div class="field-group"><label class="field-label">위탁 업무</label><input type="text" data-field="task" placeholder="업무 내용" oninput="syncSDL();updatePreview()"></div>
    </div>
  `;
  c.appendChild(d);
}

function removeAndSyncSDL(id) {
  document.getElementById(id)?.remove();
  syncSDL();
  updatePreview();
}

function syncSDL() {
  S.dlSubItems = [];
  document.querySelectorAll("#dlSubItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.dlSubItems.push({ company: g("company"), task: g("task") });
  });
}
