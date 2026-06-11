// ════════════════════════════════════════
//  CHILD ITEMS
// ════════════════════════════════════════
let childCustomItems = [];

function addChildCustomItem() {
  const input = document.getElementById("childItemsCustomInput");
  const val = input.value.trim();
  if (!val) return;
  childCustomItems.push(val);
  input.value = "";
  renderChildCustomTags();
  syncChildItems();
}

function removeChildCustomItem(idx) {
  childCustomItems.splice(idx, 1);
  renderChildCustomTags();
  syncChildItems();
}

function renderChildCustomTags() {
  const container = document.getElementById("childCustomTags");
  if (!container) return;
  container.innerHTML = childCustomItems
    .map(
      (item, i) =>
        `<span style="display:inline-flex;align-items:center;gap:3px;background:#eef1fe;border:1px solid #c5cdf7;border-radius:12px;padding:2px 8px;font-size:11px;">
          ${item}
          <button onclick="removeChildCustomItem(${i})" style="background:none;border:none;cursor:pointer;color:#999;font-size:13px;padding:0;line-height:1;">×</button>
        </span>`
    )
    .join("");
}

function syncChildItems() {
  const items = [];
  if (document.getElementById("childItemName")?.checked) items.push("법정대리인의 성명");
  if (document.getElementById("childItemPhone")?.checked) items.push("전화번호");
  if (document.getElementById("childItemEmail")?.checked) items.push("이메일주소");
  items.push(...childCustomItems);
  const val = items.join(", ");
  const hidden = document.getElementById("childItems");
  if (hidden) hidden.value = val;
  S.childItems = val;
  updatePreview();
}

function selectChildPreset(el) {
  const isCustom = el.value === "custom";
  const ta = document.getElementById("childMethod");
  ta.style.display = isCustom ? "" : "none";
  if (!isCustom) ta.value = el.value;
  else ta.value = "";
  updatePreview();
}
