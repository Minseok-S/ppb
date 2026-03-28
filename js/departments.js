// ════════════════════════════════════════
//  DYNAMIC — PREV POLICIES
// ════════════════════════════════════════
function addPrevPolicy() {
  const id = "prevPolicy_" + Date.now();
  const c = document.getElementById("prevPolicyItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">이전 방침</span><button class="btn-icon" onclick="removePrevPolicy('${id}')">✕</button></div>
    <div class="field-group"><label class="field-label">시행일</label><input type="text" data-field="date" placeholder="예: 2024. 01. 01" oninput="syncPrevPolicies();updatePreview()"></div>
    <div class="field-group" style="margin-top:6px"><label class="field-label">URL</label><input type="text" data-field="url" placeholder="예: https://example.com/privacy-2024" oninput="syncPrevPolicies();updatePreview()"></div>
  `;
  c.appendChild(d);
}

function removePrevPolicy(id) {
  document.getElementById(id)?.remove();
  syncPrevPolicies();
  updatePreview();
}

function syncPrevPolicies() {
  S.prevPolicies = [];
  document.querySelectorAll("#prevPolicyItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.prevPolicies.push({ date: g("date"), url: g("url") });
  });
}

// ════════════════════════════════════════
//  DYNAMIC — DEPT
// ════════════════════════════════════════
function addDept() {
  const id = "dept_" + Date.now(),
    c = document.getElementById("deptItems");
  const d = document.createElement("div");
  d.className = "card-item";
  d.id = id;
  d.innerHTML = `
    <div class="card-header"><span class="card-title">담당부서</span><button class="btn-icon" onclick="removeAndSyncDept('${id}')">✕</button></div>
    <div class="field-row">
      <div class="field-group"><label class="field-label">부서명</label><input type="text" data-field="name" placeholder="부서명" oninput="syncDepts();updatePreview()"></div>
      <div class="field-group"><label class="field-label">전화번호</label><input type="text" data-field="phone" placeholder="전화번호" oninput="syncDepts();updatePreview()"></div>
    </div>
    <input type="email" data-field="email" placeholder="이메일" style="margin-top:6px;" oninput="syncDepts();updatePreview()">
  `;
  c.appendChild(d);
}

function removeAndSyncDept(id) {
  document.getElementById(id)?.remove();
  syncDepts();
  updatePreview();
}

function syncDepts() {
  S.depts = [];
  // default row
  S.depts.push({
    name: document.getElementById("dept1Name")?.value || "",
    phone: document.getElementById("dept1Phone")?.value || "",
    email: document.getElementById("dept1Email")?.value || "",
  });
  document.querySelectorAll("#deptItems .card-item").forEach((d) => {
    const g = (f) => d.querySelector('[data-field="' + f + '"]')?.value || "";
    S.depts.push({ name: g("name"), phone: g("phone"), email: g("email") });
  });
}

// ════════════════════════════════════════
//  READ SIMPLE FIELDS
// ════════════════════════════════════════
function readFields() {
  [
    "companyName",
    "serviceName",
    "effectiveDate",
    "childItems",
    "childMethod",
    "cpoName",
    "cpoTitle",
    "cpoPhone",
    "cpoEmail",
    "rightsWebPath",
    "rightsAppPath",
    "rightsInquiryPath",
    "rightsDeptName",
    "rightsDeptPhone",
    "rightsDeptEmail",
    "rightsDeptFax",
    "sensitiveText",
    "pseudonymText",
    "autoDecisionText",
    "daName",
    "daPhone",
    "daAddr",
    "daEmail",
    "bhPurpose",
    "bhTool",
    "bhIdentify",
    "bhSensitivePurpose",
    "bhChildAction",
    "bhMobileAction",
    "bhMobileAdType",
    "bhContactDept",
    "bhContactPerson",
    "bhContactPhone",
    "bhContactEmail",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) S[id] = el.value;
  });
  syncDepts();
  syncAU();
}
