// ════════════════════════════════════════
//  CCTV (영상정보처리기기) HELPERS
// ════════════════════════════════════════

function selectCCTV(type, val) {
  const cap = type === "fixed" ? "Fixed" : "Mobile";
  document.getElementById("cctv" + cap + "_yes").classList.toggle("selected", val === "yes");
  document.getElementById("cctv" + cap + "_no").classList.toggle("selected", val === "no");
  S["cctv" + cap] = val;
  const detail = document.getElementById("cctv" + cap + "Detail");
  if (detail) detail.style.display = val === "yes" ? "block" : "none";
  updatePreview();
}

function selectCCTVDelegate(type, val) {
  const cap = type === "fixed" ? "Fixed" : "Mobile";
  document.getElementById("cctv" + cap + "Delegate_yes").classList.toggle("selected", val === "yes");
  document.getElementById("cctv" + cap + "Delegate_no").classList.toggle("selected", val === "no");
  S["cctv" + cap + "Delegate"] = val;
  const detail = document.getElementById("cctv" + cap + "DelegateDetail");
  if (detail) detail.style.display = val === "yes" ? "block" : "none";
  updatePreview();
}

function addCCTVLocation(type) {
  const cap = type === "fixed" ? "Fixed" : "Mobile";
  const arr = S["cctv" + cap + "Locations"];
  arr.push({ location: "", count: "" });
  renderCCTVLocations(type);
  updatePreview();
}

function renderCCTVLocations(type) {
  const cap = type === "fixed" ? "Fixed" : "Mobile";
  const arr = S["cctv" + cap + "Locations"];
  const container = document.getElementById("cctv" + cap + "Locations");
  if (!container) return;
  container.innerHTML = arr.map((item, i) => `
    <div class="card-item" data-idx="${i}" style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
      <span class="drag-handle" title="끌어서 순서 변경" data-reorder-array="cctv${cap}Locations" data-reorder-render="renderCCTVLocations('${type}')">⠿</span>
      <input type="text" placeholder="설치 위치 (예: 로비, 주차장)" value="${item.location}"
        oninput="S.cctv${cap}Locations[${i}].location=this.value;updatePreview()" style="flex:2" />
      <input type="text" placeholder="대수" value="${item.count}"
        oninput="S.cctv${cap}Locations[${i}].count=this.value;updatePreview()" style="flex:1;width:60px" />
      <button onclick="removeCCTVLocation('${type}',${i})" style="padding:4px 8px;font-size:11px;border:1px solid #e0e0e0;border-radius:6px;background:#fff;cursor:pointer;color:#ef4444;flex-shrink:0">✕</button>
    </div>`).join("");
}

function removeCCTVLocation(type, idx) {
  const cap = type === "fixed" ? "Fixed" : "Mobile";
  S["cctv" + cap + "Locations"].splice(idx, 1);
  renderCCTVLocations(type);
  updatePreview();
}

function addCCTVDelegate(type) {
  const cap = type === "fixed" ? "Fixed" : "Mobile";
  const arr = S["cctv" + cap + "DelegateItems"];
  arr.push({ company: "", manager: "", phone: "" });
  renderCCTVDelegates(type);
  updatePreview();
}

function renderCCTVDelegates(type) {
  const cap = type === "fixed" ? "Fixed" : "Mobile";
  const arr = S["cctv" + cap + "DelegateItems"];
  const container = document.getElementById("cctv" + cap + "DelegateItems");
  if (!container) return;
  container.innerHTML = arr.map((item, i) => `
    <div class="card-item" data-idx="${i}" style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
      <span class="drag-handle" title="끌어서 순서 변경" data-reorder-array="cctv${cap}DelegateItems" data-reorder-render="renderCCTVDelegates('${type}')">⠿</span>
      <input type="text" placeholder="수탁업체명" value="${item.company}"
        oninput="S.cctv${cap}DelegateItems[${i}].company=this.value;updatePreview()" style="flex:2" />
      <input type="text" placeholder="담당자" value="${item.manager}"
        oninput="S.cctv${cap}DelegateItems[${i}].manager=this.value;updatePreview()" style="flex:1.5" />
      <input type="tel" placeholder="연락처" value="${item.phone}"
        oninput="S.cctv${cap}DelegateItems[${i}].phone=this.value;updatePreview()" style="flex:1.5" />
      <button onclick="removeCCTVDelegate('${type}',${i})" style="padding:4px 8px;font-size:11px;border:1px solid #e0e0e0;border-radius:6px;background:#fff;cursor:pointer;color:#ef4444;flex-shrink:0">✕</button>
    </div>`).join("");
}

function removeCCTVDelegate(type, idx) {
  const cap = type === "fixed" ? "Fixed" : "Mobile";
  S["cctv" + cap + "DelegateItems"].splice(idx, 1);
  renderCCTVDelegates(type);
  updatePreview();
}
