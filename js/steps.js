// ════════════════════════════════════════
//  STEP PANELS HTML
// ════════════════════════════════════════
function renderSteps() {
  document.getElementById("stepsContent").innerHTML = `
    <!-- ── STEP 1: 기본정보 ── -->
    <div class="section-panel active" id="step1">
      <div class="section-title">
        <div class="section-num">1</div>
        기본 정보 <span class="badge-req">필수</span>
      </div>
      <div class="section-desc">
        서문에 표시될 회사명, 서비스명, 시행일을 입력합니다.
      </div>
      <div class="field-group">
        <label class="field-label">개인정보처리자명 <span class="req">*</span></label>
        <input type="text" id="companyName" placeholder="예: (주)첼라" oninput="updatePreview()" />
      </div>
      <div class="field-group">
        <label class="field-label">서비스명 <span class="req">*</span></label>
        <input type="text" id="serviceName" placeholder="예: 개인정보처리방침 빌더" oninput="updatePreview()" />
      </div>
      <div class="field-group">
        <label class="field-label">시행일 <span class="req">*</span></label>
        <input type="text" id="effectiveDate" placeholder="예: 2025. 09. 15" oninput="updatePreview()" />
      </div>
      <div class="field-group" style="margin-top:14px;border-top:1px dashed #e0e0e0;padding-top:14px">
        <label class="field-label">이전 개인정보 처리방침 링크
          <span style="font-size:11px;color:#aaa;font-weight:400">(선택 · 시행일자별)</span>
        </label>
        <div id="prevPolicyItems"></div>
        <button class="btn-add" onclick="addPrevPolicy()">＋ 이전 방침 추가</button>
      </div>
    </div>

    <!-- ── STEP 2: 수집항목 ── -->
    <div class="section-panel" id="step2">
      <div class="section-title">
        <div class="section-num">2</div>
        개인정보 수집·이용 항목 <span class="badge-req">필수</span>
      </div>
      <div class="section-desc">
        동의 없이 처리 / 동의 받아 처리 / 그 밖에 수집으로 구분하여 입력합니다.
      </div>
      <div class="field-group">
        <label class="field-label" style="font-size:12px;color:var(--text);margin-bottom:8px">① 동의 없이 처리하는 개인정보</label>
        <div id="collectNoConsent"></div>
        <button class="btn-add" onclick="addCollect('noConsent')">＋ 항목 추가</button>
      </div>
      <div class="field-group" style="margin-top:14px">
        <label class="field-label" style="font-size:12px;color:var(--text);margin-bottom:8px">② 동의 받아 처리하는 개인정보</label>
        <div id="collectConsent"></div>
        <button class="btn-add" onclick="addCollect('consent')">＋ 항목 추가</button>
      </div>
      <div class="field-group" style="margin-top:14px;border-top:1px dashed #e0e0e0;padding-top:14px">
        <label class="field-label" style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px">
          3. 그 밖에 수집하는 개인정보
          <span style="font-size:11px;color:#aaa;font-weight:400">(해당 시)</span>
        </label>
        <label class="field-label" style="font-size:12px;color:var(--text);margin-bottom:8px;margin-top:10px">가. 정보주체 이외로부터 수집한 개인정보</label>
        <div id="collectOther"></div>
        <button class="btn-add" onclick="addCollectOther()">＋ 항목 추가</button>
      </div>
      <div class="field-group" style="margin-top:14px">
        <label class="field-label" style="font-size:12px;color:var(--text);margin-bottom:8px">나. 자동으로 생성·수집되는 개인정보</label>
        <div id="collectAuto"></div>
        <button class="btn-add" onclick="addCollect('auto')">＋ 항목 추가</button>
      </div>
    </div>

    <!-- ── STEP 3: 아동 ── -->
    <div class="section-panel" id="step3">
      <div class="section-title">
        <div class="section-num">3</div>
        만 14세 미만 아동 개인정보 처리
        <span style="font-size:11px;color:#aaa;font-weight:400">(해당 시)</span>
      </div>
      <div class="section-desc">14세 미만 아동의 개인정보를 수집하는 경우 기재합니다.</div>
      <div class="radio-group">
        <div class="radio-item selected" id="childNo" onclick="selectR('childNo','childYes','child','no')">
          <div class="radio-dot"></div>
          <div><div class="radio-text">수집하지 않습니다</div></div>
        </div>
        <div class="radio-item" id="childYes" onclick="selectR('childYes','childNo','child','yes')">
          <div class="radio-dot"></div>
          <div>
            <div class="radio-text">법정대리인 동의 후 수집합니다</div>
            <div class="radio-desc">법정대리인 동의 확인 방법을 기재하세요</div>
          </div>
        </div>
      </div>
      <div id="childDetail" style="display:none">
        <div class="field-group" style="margin-top:14px">
          <label class="field-label">수집항목
            <span style="font-size:11px;color:#aaa;font-weight:400">(수집하는 항목 선택, 다중 선택 가능)</span>
          </label>
          <div style="display:flex;flex-direction:column;gap:5px;margin-top:4px">
            <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;padding:5px 8px;border:1px solid #e0e0e0;border-radius:6px;background:#fff">
              <input type="checkbox" id="childItemName" checked onchange="syncChildItems()" style="accent-color:var(--accent);width:13px;height:13px">
              법정대리인의 성명
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;padding:5px 8px;border:1px solid #e0e0e0;border-radius:6px;background:#fff">
              <input type="checkbox" id="childItemPhone" checked onchange="syncChildItems()" style="accent-color:var(--accent);width:13px;height:13px">
              전화번호
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;padding:5px 8px;border:1px solid #e0e0e0;border-radius:6px;background:#fff">
              <input type="checkbox" id="childItemEmail" checked onchange="syncChildItems()" style="accent-color:var(--accent);width:13px;height:13px">
              이메일주소
            </label>
          </div>
          <div style="margin-top:6px">
            <div id="childCustomTags" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px"></div>
            <div style="display:flex;gap:6px">
              <input type="text" id="childItemsCustomInput" placeholder="항목 입력 후 추가 버튼 또는 Enter" style="flex:1" onkeydown="if(event.key==='Enter'){addChildCustomItem();event.preventDefault();}"/>
              <button type="button" onclick="addChildCustomItem()" style="padding:4px 12px;font-size:11px;border:1px solid var(--accent);color:var(--accent);background:#fff;border-radius:6px;cursor:pointer;white-space:nowrap">추가</button>
            </div>
          </div>
          <input type="text" id="childItems" style="display:none" readonly />
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">동의 확인 방법
            <span style="font-size:11px;color:#aaa;font-weight:400">(알리는 방법)</span>
          </label>
          <div style="display:flex;flex-direction:column;gap:5px;margin-top:4px">
            <label style="display:flex;align-items:flex-start;gap:6px;font-size:11px;cursor:pointer;padding:5px 8px;border:1px solid #e0e0e0;border-radius:6px;background:#fff">
              <input type="radio" name="childMethodOpt" value="동의 내용을 게재한 인터넷 사이트에 법정대리인이 동의 여부를 표시하도록 하고, 그 동의 표시를 확인했음을 법정대리인의 휴대전화 문자메시지로 알리는 방법으로 그 사실을 확인합니다." onchange="selectChildPreset(this)" style="accent-color:var(--accent);margin-top:2px;flex-shrink:0">
              <span>인터넷 사이트 동의 + 문자메시지 알림<br><span style="color:#aaa;font-size:10px">동의 내용을 게재한 인터넷 사이트에서 동의 표시 후 문자메시지로 확인</span></span>
            </label>
            <label style="display:flex;align-items:flex-start;gap:6px;font-size:11px;cursor:pointer;padding:5px 8px;border:1px solid #e0e0e0;border-radius:6px;background:#fff">
              <input type="radio" name="childMethodOpt" value="법정대리인에게 동의 내용이 적힌 서면을 직접 발급하거나 우편으로 전달하고, 법정대리인이 서명 후 제출하는 방법으로 그 사실을 확인합니다." onchange="selectChildPreset(this)" style="accent-color:var(--accent);margin-top:2px;flex-shrink:0">
              <span>서면 발급 후 서명 제출<br><span style="color:#aaa;font-size:10px">동의 서면을 직접 발급하거나 우편 전달 후 서명 제출로 확인</span></span>
            </label>
            <label style="display:flex;align-items:flex-start;gap:6px;font-size:11px;cursor:pointer;padding:5px 8px;border:1px solid #e0e0e0;border-radius:6px;background:#fff">
              <input type="radio" name="childMethodOpt" value="법정대리인에게 전화를 통해 동의 내용을 직접 알리고 구두로 동의를 확인합니다." onchange="selectChildPreset(this)" style="accent-color:var(--accent);margin-top:2px;flex-shrink:0">
              <span>전화 통화 확인<br><span style="color:#aaa;font-size:10px">전화를 통해 동의 내용을 알리고 구두로 동의 확인</span></span>
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;padding:5px 8px;border:1px solid #e0e0e0;border-radius:6px;background:#fff">
              <input type="radio" name="childMethodOpt" value="custom" onchange="selectChildPreset(this)" style="accent-color:var(--accent)">
              직접 입력
            </label>
          </div>
          <textarea id="childMethod" placeholder="직접 입력해 주세요" oninput="updatePreview()" style="display:none;margin-top:6px"></textarea>
        </div>
      </div>
    </div>

    <!-- ── STEP 4: 파기 ── -->
    <div class="section-panel" id="step4">
      <div class="section-title">
        <div class="section-num">4</div>
        개인정보 파기 <span class="badge-req">필수</span>
      </div>
      <div class="section-desc">법령에 따른 보존 항목과 직접 추가 항목을 관리합니다.</div>
      <div class="field-group">
        <label class="field-label">법령 보존 항목</label>
        <div class="toggle-group" id="retentionToggles">
          <div class="toggle-item checked" data-key="contract" onclick="toggleItem(this,'retention')">
            <div><div class="toggle-label">계약·청약철회·대금결제·재화공급 기록</div><div class="toggle-sub">전자상거래법 · 5년</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="dispute" onclick="toggleItem(this,'retention')">
            <div><div class="toggle-label">소비자 불만·분쟁처리 기록</div><div class="toggle-sub">전자상거래법 · 3년</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="ad" onclick="toggleItem(this,'retention')">
            <div><div class="toggle-label">표시·광고에 관한 기록</div><div class="toggle-sub">전자상거래법 · 6개월</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="log" onclick="toggleItem(this,'retention')">
            <div><div class="toggle-label">웹사이트 방문기록(로그, IP 등)</div><div class="toggle-sub">통신비밀보호법 · 3개월</div></div>
            <div class="toggle-switch"></div>
          </div>
        </div>
      </div>
      <div class="field-group" style="margin-top:10px">
        <label class="field-label">법적 보존항목 <span class="opt">(위 목록에 없는 법령 근거 항목)</span></label>
        <div id="customRetentionLegal"></div>
        <button class="btn-add" onclick="addCustomRetentionLegal()">＋ 항목 추가</button>
      </div>
      <div class="field-group" style="margin-top:10px">
        <label class="field-label">그외 보존항목 <span class="opt">(사내규정·기타사유)</span></label>
        <div id="customRetentionOther"></div>
        <button class="btn-add" onclick="addCustomRetentionOther()">＋ 항목 추가</button>
      </div>
      <div class="field-group" style="margin-top:10px">
        <label class="field-label">파기 방법</label>
        <div class="toggle-group">
          <div class="toggle-item checked" data-key="electronic" onclick="toggleItem(this,'destroy')">
            <div><div class="toggle-label">전자적 파일</div><div class="toggle-sub">재생 불가하도록 파기</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="paper" onclick="toggleItem(this,'destroy')">
            <div><div class="toggle-label">종이 문서</div><div class="toggle-sub">분쇄기 분쇄 또는 소각</div></div>
            <div class="toggle-switch"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── STEP 5: 제3자 제공 ── -->
    <div class="section-panel" id="step5">
      <div class="section-title">
        <div class="section-num">5</div>
        제3자 제공 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">동의 기반 제공과 동의 없이 제공(법령 근거) 두 유형으로 구분합니다.</div>
      <div class="field-group">
        <label class="field-label">제3자 제공 여부</label>
        <div class="radio-group">
          <div class="radio-item selected" id="tp_no" onclick="selectR('tp_no','tp_yes','thirdParty','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">제공하지 않습니다</div></div>
          </div>
          <div class="radio-item" id="tp_yes" onclick="selectR('tp_yes','tp_no','thirdParty','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">제공합니다 (상세 입력)</div></div>
          </div>
        </div>
      </div>
      <div id="tpDetail" style="display:none">
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">동의 기반 제공 <span class="opt">(정보주체 동의)</span></label>
          <div id="tpConsent"></div>
          <button class="btn-add" onclick="addTP('consent')">＋ 제공 대상 추가</button>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">법령 근거 제공 <span class="opt">(동의 없이)</span></label>
          <div id="tpLegal"></div>
          <button class="btn-add" onclick="addTP('legal')">＋ 제공 대상 추가</button>
        </div>
      </div>
    </div>

    <!-- ── STEP 6: 위탁 ── -->
    <div class="section-panel" id="step6">
      <div class="section-title">
        <div class="section-num">6</div>
        처리 위탁 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">수탁자와 위탁 업무 내용을 기재합니다.</div>
      <div class="field-group">
        <label class="field-label">위탁 여부</label>
        <div class="radio-group">
          <div class="radio-item selected" id="dl_no" onclick="selectR('dl_no','dl_yes','delegate','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">위탁하지 않습니다</div></div>
          </div>
          <div class="radio-item" id="dl_yes" onclick="selectR('dl_yes','dl_no','delegate','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">위탁합니다 (상세 입력)</div></div>
          </div>
        </div>
      </div>
      <div id="dlDetail" style="display:none">
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">가. 위탁받는 자 <span class="opt">(수탁자)</span></label>
          <div id="dlItems"></div>
          <button class="btn-add" onclick="addDelegate()">＋ 수탁업체 추가</button>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">나. 재위탁받는 자 <span class="opt">(재수탁자, 해당시)</span></label>
          <div id="dlSubItems"></div>
          <button class="btn-add" onclick="addSubDelegate()">＋ 재수탁업체 추가</button>
        </div>
      </div>
    </div>

    <!-- ── STEP 7: 국외이전 ── -->
    <div class="section-panel" id="step7">
      <div class="section-title">
        <div class="section-num">7</div>
        국외 이전 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">개인정보를 국외로 이전(제공·위탁·보관)하는 경우 기재합니다.</div>
      <div class="field-group">
        <label class="field-label">국외 이전 여부</label>
        <div class="radio-group">
          <div class="radio-item selected" id="ot_no" onclick="selectR('ot_no','ot_yes','overseas','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="ot_yes" onclick="selectR('ot_yes','ot_no','overseas','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">국외 이전 있음 (상세 입력)</div></div>
          </div>
        </div>
      </div>
      <div id="otDetail" style="display:none">
        <div id="otItems"></div>
        <button class="btn-add" style="margin-top:6px" onclick="addOverseas()">＋ 이전 대상 추가</button>
        <div class="field-group" style="margin-top:14px">
          <label class="field-label">국외 이전 거부 시 불이익</label>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="white-space:nowrap;font-size:13px;color:#333">국외 이전을 거부할 경우</span>
            <input type="text" class="field-input" id="otRefuseDisadvantage" placeholder="서비스 이용이 불가능" style="flex:1;min-width:120px" oninput="syncOT();updatePreview()" />
            <span style="white-space:nowrap;font-size:13px;color:#333">합니다.</span>
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">국외 이전 거부 방법</label>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="white-space:nowrap;font-size:13px;color:#333">국외 이전을 원치 않을 경우</span>
            <input type="text" class="field-input" id="otRefuseMethod" placeholder="홈페이지(메뉴 – 내 정보 – 회원 탈퇴)" style="flex:1;min-width:160px" oninput="syncOT();updatePreview()" />
            <span style="white-space:nowrap;font-size:13px;color:#333">를 통하여 회원 탈퇴를 요청할 수 있습니다.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── STEP 8: 안전조치 ── -->
    <div class="section-panel" id="step8">
      <div class="section-title">
        <div class="section-num">8</div>
        안전성 확보 조치 <span class="badge-req">필수</span>
      </div>
      <div class="section-desc">시행 중인 관리적·기술적·물리적 조치를 선택합니다.</div>
      <div class="field-group">
        <label class="field-label">관리적 조치</label>
        <div class="toggle-group">
          <div class="toggle-item checked" data-key="s_plan" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">내부 관리계획 수립·시행</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="s_edu" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">정기적 직원 교육</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item" data-key="s_org" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">전담 조직 운영</div></div>
            <div class="toggle-switch"></div>
          </div>
        </div>
        <div class="sec-extra-row">
          <input type="text" id="sec_mgmt_input" class="field-input" placeholder="관리적 조치 직접 추가" onkeydown="if(event.key==='Enter')addSecItem('mgmt')" />
          <button class="btn-add-sm" onclick="addSecItem('mgmt')">추가</button>
        </div>
        <div id="sec_mgmt_chips" class="sec-chips"></div>
      </div>
      <div class="field-group" style="margin-top:10px">
        <label class="field-label">기술적 조치</label>
        <div class="toggle-group">
          <div class="toggle-item checked" data-key="s_access" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">접근 권한 관리 및 접근통제시스템</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="s_encrypt" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">개인정보 암호화</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="s_sec" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">보안프로그램 설치 및 갱신</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item" data-key="s_log" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">접속기록 보관 및 점검</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item" data-key="s_vuln" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">취약점 점검 및 보완</div></div>
            <div class="toggle-switch"></div>
          </div>
        </div>
        <div class="sec-extra-row">
          <input type="text" id="sec_tech_input" class="field-input" placeholder="기술적 조치 직접 추가" onkeydown="if(event.key==='Enter')addSecItem('tech')" />
          <button class="btn-add-sm" onclick="addSecItem('tech')">추가</button>
        </div>
        <div id="sec_tech_chips" class="sec-chips"></div>
      </div>
      <div class="field-group" style="margin-top:10px">
        <label class="field-label">물리적 조치</label>
        <div class="toggle-group">
          <div class="toggle-item checked" data-key="s_phys" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">전산실·자료보관실 접근통제</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item" data-key="s_media" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">보조저장매체 반출·입 통제</div></div>
            <div class="toggle-switch"></div>
          </div>
        </div>
        <div class="sec-extra-row">
          <input type="text" id="sec_phys_input" class="field-input" placeholder="물리적 조치 직접 추가" onkeydown="if(event.key==='Enter')addSecItem('phys')" />
          <button class="btn-add-sm" onclick="addSecItem('phys')">추가</button>
        </div>
        <div id="sec_phys_chips" class="sec-chips"></div>
      </div>
      <div class="field-group" style="margin-top:10px">
        <label class="field-label">추가 인증</label>
        <div class="toggle-group">
          <div class="toggle-item" data-key="s_isms" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">ISMS-P 인증</div><div class="toggle-sub">정보보호 관리체계 인증</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item" data-key="s_isms_cert" onclick="toggleItem(this,'security')">
            <div><div class="toggle-label">ISMS 인증</div><div class="toggle-sub">정보보호 관리체계 인증</div></div>
            <div class="toggle-switch"></div>
          </div>
        </div>
        <div class="sec-extra-row">
          <input type="text" id="sec_cert_input" class="field-input" placeholder="인증 항목 직접 추가" onkeydown="if(event.key==='Enter')addSecItem('cert')" />
          <button class="btn-add-sm" onclick="addSecItem('cert')">추가</button>
        </div>
        <div id="sec_cert_chips" class="sec-chips"></div>
      </div>
    </div>

    <!-- ── STEP 9: 쿠키 ── -->
    <div class="section-panel" id="step9">
      <div class="section-title">
        <div class="section-num">9</div>
        쿠키(자동수집장치) <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">쿠키 사용 여부와 브라우저별 거부 방법을 설정합니다.</div>
      <div class="field-group">
        <label class="field-label">쿠키 사용 여부</label>
        <div class="radio-group">
          <div class="radio-item selected" id="ck_yes" onclick="selectR('ck_yes','ck_no','cookie','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">쿠키를 사용합니다</div></div>
          </div>
          <div class="radio-item" id="ck_no" onclick="selectR('ck_no','ck_yes','cookie','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">사용하지 않습니다</div></div>
          </div>
        </div>
      </div>
      <div id="cookieDetail">
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">웹 브라우저</label>
          <div class="toggle-group">
            <div class="toggle-item checked" data-key="b_chrome" onclick="toggleItem(this,'browser')">
              <div><div class="toggle-label">크롬 (Chrome)</div></div>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-item checked" data-key="b_edge" onclick="toggleItem(this,'browser')">
              <div><div class="toggle-label">엣지 (Edge)</div></div>
              <div class="toggle-switch"></div>
            </div>
          </div>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">모바일 브라우저</label>
          <div class="toggle-group">
            <div class="toggle-item" data-key="b_chrome_m" onclick="toggleItem(this,'browser')">
              <div><div class="toggle-label">크롬 (Chrome)</div></div>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-item" data-key="b_safari" onclick="toggleItem(this,'browser')">
              <div><div class="toggle-label">사파리 (Safari)</div></div>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-item" data-key="b_samsung" onclick="toggleItem(this,'browser')">
              <div><div class="toggle-label">삼성 인터넷</div></div>
              <div class="toggle-switch"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="field-group" style="margin-top:12px;border-top:1px solid #eee;padding-top:12px">
        <label class="field-label">제3자 자동수집장치 허용 여부 <span class="badge-opt">해당시</span></label>
        <div style="font-size:11px;color:var(--text3);margin-bottom:8px;line-height:1.5">
          제3자 쿠키·SDK 등을 통해 귀사 웹·앱에서 제3자가 행태정보를 수집해가도록 허용하는 경우 기재합니다.
        </div>
        <div class="radio-group">
          <div class="radio-item selected" id="ck3rd_no" onclick="selectR('ck3rd_no','ck3rd_yes','cookie3rdParty','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="ck3rd_yes" onclick="selectR('ck3rd_yes','ck3rd_no','cookie3rdParty','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">제3자 자동수집장치 허용</div></div>
          </div>
        </div>
        <div id="ck3rdDetail" style="display:none;margin-top:8px">
          <div id="cedItems"></div>
          <button class="btn-add" style="margin-top:6px" onclick="addCookieExtDevice()">＋ 자동수집장치 추가</button>
        </div>
      </div>
    </div>

    <!-- ── STEP 10: 행태정보 ── -->
    <div class="section-panel" id="step10">
      <div class="section-title">
        <div class="section-num">10</div>
        행태정보 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">맞춤형 광고 등을 위해 행태정보를 수집·이용하는 경우 기재합니다.</div>
      <div class="field-group">
        <label class="field-label">행태정보 처리 여부</label>
        <div class="radio-group">
          <div class="radio-item selected" id="bh_no" onclick="selectR('bh_no','bh_yes','behavioral','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="bh_yes" onclick="selectR('bh_yes','bh_no','behavioral','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">행태정보를 처리합니다</div></div>
          </div>
        </div>
      </div>
      <div id="bhDetail" style="display:none">
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">① 처리 목적 / 수집도구 / 식별여부</label>
          <input type="text" id="bhPurpose" placeholder="목적 예: 정보주체에게 최적화된 맞춤형 서비스 및 혜택을 제공" oninput="updatePreview()" style="margin-bottom:4px"/>
          <input type="text" id="bhTool" placeholder="수집도구 예: 쿠키" value="쿠키" oninput="updatePreview()" style="margin-bottom:8px"/>
          <label class="field-label" style="font-size:11px;color:var(--text3);margin-bottom:4px">개인 식별 여부 (테이블 법적 근거 칼럼 포함 여부에 영향)</label>
          <div class="radio-group">
            <div class="radio-item" id="bhIM_identify" onclick="selectR('bhIM_identify','bhIM_nonidentify','bhIdentifyMode','identify')">
              <div class="radio-dot"></div>
              <div>
                <div class="radio-text">식별하여 처리</div>
                <div class="radio-desc">법적 근거 칼럼 포함 — 정보주체를 식별하는 방식</div>
              </div>
            </div>
            <div class="radio-item selected" id="bhIM_nonidentify" onclick="selectR('bhIM_nonidentify','bhIM_identify','bhIdentifyMode','nonidentify')">
              <div class="radio-dot"></div>
              <div>
                <div class="radio-text">식별하지 않고 처리 (비식별)</div>
                <div class="radio-desc">법적 근거 칼럼 없음 — 정보주체를 식별하지 않는 방식</div>
              </div>
            </div>
          </div>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">② 행태정보 수집 항목 <span class="opt">(표)</span></label>
          <div id="bhItems"></div>
          <button class="btn-add" style="margin-top:6px" onclick="addBehavioral()">＋ 행태정보 항목 추가</button>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">③ 행태정보 제3자 제공 여부</label>
          <div class="radio-group">
            <div class="radio-item selected" id="bhProvide_no" onclick="selectR('bhProvide_no','bhProvide_yes','bhProvide','no')" style="margin-bottom:0">
              <div class="radio-dot"></div>
              <div><div class="radio-text">제공하지 않습니다</div></div>
            </div>
            <div class="radio-item" id="bhProvide_yes" onclick="selectR('bhProvide_yes','bhProvide_no','bhProvide','yes')" style="margin-bottom:0">
              <div class="radio-dot"></div>
              <div><div class="radio-text">제공합니다</div></div>
            </div>
          </div>
          <div id="bhTpDetail" style="display:none;margin-top:8px">
            <div id="tpBhItems"></div>
            <button class="btn-add" style="margin-top:6px" onclick="addTpItem()">＋ 제3자 제공 항목 추가</button>
          </div>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">④ 제3자 웹·앱 자동수집장치로부터 수집 여부</label>
          <div style="font-size:11px;color:var(--text3);margin-bottom:6px;line-height:1.5">귀사가 제3자가 운영하는 웹·앱에 설치된 자동수집장치로부터 행태정보를 수집·이용하는 경우 </div>
          <div class="radio-group">
            <div class="radio-item selected" id="bhExtCollect_no" onclick="selectR('bhExtCollect_no','bhExtCollect_yes','bhExtCollect','no')" style="margin-bottom:0">
              <div class="radio-dot"></div>
              <div><div class="radio-text">해당 없음</div></div>
            </div>
            <div class="radio-item" id="bhExtCollect_yes" onclick="selectR('bhExtCollect_yes','bhExtCollect_no','bhExtCollect','yes')" style="margin-bottom:0">
              <div class="radio-dot"></div>
              <div><div class="radio-text">해당 있음</div></div>
            </div>
          </div>
          <div id="bhExtDetail" style="display:none;margin-top:8px">
            <div id="adItems"></div>
            <button class="btn-add" style="margin-top:6px" onclick="addAutoDevice()">＋ 자동수집장치 추가</button>
          </div>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">⑤ 민감정보 미수집 문구</label>
          <div class="toggle-group">
            <div class="toggle-item checked" data-key="bh_nosensitive" onclick="toggleItem(this,'bhFlags')">
              <div><div class="toggle-label">민감한 행태정보 수집하지 않음</div></div>
              <div class="toggle-switch"></div>
            </div>
          </div>
          <input type="text" id="bhSensitivePurpose" placeholder="수집 목적 예: 최적화된 맞춤형 서비스 및 혜택, 온라인 맞춤형 광고 등"
            value="최적화된 맞춤형 서비스 및 혜택, 온라인 맞춤형 광고 등" oninput="updatePreview()" style="margin-top:6px"/>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">⑥ 아동 광고 관련 문구</label>
          <div class="toggle-group">
            <div class="toggle-item checked" data-key="bh_nochild" onclick="toggleItem(this,'bhFlags')">
              <div><div class="toggle-label">아동 행태정보 수집·제공 조항 포함</div></div>
              <div class="toggle-switch"></div>
            </div>
          </div>
          <input type="text" id="bhChildAction" placeholder="아동 대상 행위 예: 아동에게 맞춤형 광고를 제공"
            value="아동에게 맞춤형 광고를 제공" oninput="updatePreview()" style="margin-top:6px"/>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">⑦ 웹브라우저 쿠키 차단 안내</label>
          <div class="toggle-group">
            <div class="toggle-item checked" data-key="bh_chrome" onclick="toggleItem(this,'bhBrowsers')">
              <div><div class="toggle-label">크롬 (Chrome)</div></div>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-item checked" data-key="bh_edge" onclick="toggleItem(this,'bhBrowsers')">
              <div><div class="toggle-label">엣지 (Edge)</div></div>
              <div class="toggle-switch"></div>
            </div>
          </div>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">⑧ 모바일 광고 식별자 문구</label>
          <div class="toggle-group">
            <div class="toggle-item checked" data-key="bh_mobile" onclick="toggleItem(this,'bhFlags')">
              <div><div class="toggle-label">모바일 광고 식별자 차단 안내 포함</div></div>
              <div class="toggle-switch"></div>
            </div>
          </div>
          <input type="text" id="bhMobileAction" placeholder="앱에서 하는 행위 예: 맞춤형 광고를 위하여 광고식별자를 수집·이용"
            value="맞춤형 광고를 위하여 광고식별자를 수집·이용" oninput="updatePreview()" style="margin-top:6px;margin-bottom:4px"/>
          <input type="text" id="bhMobileAdType" placeholder="차단 대상 예: 맞춤형 광고"
            value="맞춤형 광고" oninput="updatePreview()"/>
        </div>
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">⑨ 행태정보 담당부서 연락처 <span class="opt">(선택)</span></label>
          <input type="text" id="bhContactDept" placeholder="부서명 예: 개인정보보호팀" oninput="updatePreview()" style="margin-bottom:4px"/>
          <input type="text" id="bhContactPerson" placeholder="담당자명 예: 개인정보보호팀장" oninput="updatePreview()" style="margin-bottom:4px"/>
          <input type="text" id="bhContactPhone" placeholder="전화번호 예: 02-1234-5678" oninput="updatePreview()" style="margin-bottom:4px"/>
          <input type="text" id="bhContactEmail" placeholder="이메일 예: privacy@company.com" oninput="updatePreview()"/>
        </div>
      </div>
    </div>

    <!-- ── STEP 11: 권리행사 ── -->
    <div class="section-panel" id="step11">
      <div class="section-title">
        <div class="section-num">11</div>
        정보주체 권리 행사 <span class="badge-req">필수</span>
      </div>
      <div class="section-desc">권리 행사 방법·수단·청구 접수 부서를 설정합니다.</div>
      <div class="field-group">
        <label class="field-label">권리 행사 수단</label>
        <div class="toggle-group">
          <div class="toggle-item checked" data-key="r_written" onclick="toggleItem(this,'rights')">
            <div><div class="toggle-label">서면</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="r_phone" onclick="toggleItem(this,'rights')">
            <div><div class="toggle-label">전화</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="r_email" onclick="toggleItem(this,'rights')">
            <div><div class="toggle-label">전자우편</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item" data-key="r_fax" onclick="toggleItem(this,'rights')">
            <div><div class="toggle-label">팩스(FAX)</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item" data-key="r_web" onclick="toggleItem(this,'rights')">
            <div><div class="toggle-label">인터넷(앱/웹)</div></div>
            <div class="toggle-switch"></div>
          </div>
        </div>
      </div>
      <div id="rightsOnlineDetail" style="display:none;margin-top:6px;padding:12px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8">
        <div class="field-group">
          <label class="field-label">홈페이지 경로 <span class="opt">(해당 시)</span></label>
          <input type="text" id="rightsWebPath" placeholder="예: 내정보 &gt; 회원정보" oninput="updatePreview()" />
        </div>
        <div class="field-group" style="margin-top:8px">
          <label class="field-label">앱 경로 <span class="opt">(해당 시)</span></label>
          <input type="text" id="rightsAppPath" placeholder="예: 메뉴 &gt; 내 정보 관리" oninput="updatePreview()" />
        </div>
        <div class="field-group" style="margin-top:8px">
          <label class="field-label">직접 행사 가능한 항목</label>
          <div class="toggle-group" style="margin-top:4px">
            <div class="toggle-item checked" data-key="ra_view" onclick="toggleItem(this,'rightsActions')">
              <div><div class="toggle-label">조회</div></div>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-item checked" data-key="ra_edit" onclick="toggleItem(this,'rightsActions')">
              <div><div class="toggle-label">수정</div></div>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-item checked" data-key="ra_delete" onclick="toggleItem(this,'rightsActions')">
              <div><div class="toggle-label">삭제</div></div>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-item checked" data-key="ra_suspend" onclick="toggleItem(this,'rightsActions')">
              <div><div class="toggle-label">처리정지</div></div>
              <div class="toggle-switch"></div>
            </div>
            <div class="toggle-item checked" data-key="ra_withdraw" onclick="toggleItem(this,'rightsActions')">
              <div><div class="toggle-label">동의 철회</div></div>
              <div class="toggle-switch"></div>
            </div>
          </div>
        </div>
        <div class="field-group" style="margin-top:8px">
          <label class="field-label">온라인 열람 요청 경로</label>
          <input type="text" id="rightsInquiryPath" placeholder="예: 문의하기" oninput="updatePreview()" />
        </div>
      </div>
      <div class="field-group" style="margin-top:10px">
        <label class="field-label">개인정보 전송요구권(마이데이터) 해당 여부</label>
        <div class="radio-group">
          <div class="radio-item selected" id="mydata_no" onclick="selectR('mydata_no','mydata_yes','mydata','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="mydata_yes" onclick="selectR('mydata_yes','mydata_no','mydata','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">정보전송자에 해당 (마이데이터)</div></div>
          </div>
        </div>
      </div>
      <div class="field-group" style="margin-top:14px;border-top:1px dashed #e0e0e0;padding-top:14px">
        <label class="field-label">권리행사 청구 접수·처리 부서 <span class="opt">(선택)</span></label>
        <div style="font-size:10px;color:var(--text3);margin-bottom:8px">미입력 시 '아래 개인정보 보호책임자 항목 참고' 문구로 대체됩니다.</div>
        <input type="text" id="rightsDeptName" placeholder="부서명 (예: 개인정보보호팀)" oninput="updatePreview()" style="margin-bottom:6px" />
        <div class="field-row" style="margin-bottom:6px">
          <input type="tel" id="rightsDeptPhone" placeholder="전화번호" oninput="updatePreview()" />
          <input type="email" id="rightsDeptEmail" placeholder="이메일" oninput="updatePreview()" />
        </div>
        <input type="text" id="rightsDeptFax" placeholder="팩스번호 (선택)" oninput="updatePreview()" />
      </div>
    </div>

    <!-- ── STEP 12: 책임자 ── -->
    <div class="section-panel" id="step12">
      <div class="section-title">
        <div class="section-num">12</div>
        개인정보 보호책임자 <span class="badge-req">필수</span>
      </div>
      <div class="section-desc">CPO 정보와 담당 부서를 입력합니다.</div>
      <div class="field-group">
        <label class="field-label">개인정보 보호책임자(CPO)</label>
        <div class="field-row">
          <input type="text" id="cpoName" placeholder="성명" oninput="updatePreview()" />
          <input type="text" id="cpoTitle" placeholder="직책" oninput="updatePreview()" />
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">CPO 연락처</label>
        <div class="field-row">
          <input type="tel" id="cpoPhone" placeholder="전화번호" oninput="updatePreview()" />
          <input type="email" id="cpoEmail" placeholder="이메일" oninput="updatePreview()" />
        </div>
      </div>
      <div class="field-group" style="margin-top:10px">
        <label class="field-label">개인정보 업무 담당 부서</label>
        <div id="deptItems">
          <div class="card-item" id="dept_default">
            <div class="field-row">
              <input type="text" id="dept1Name" placeholder="부서명" oninput="updatePreview()" />
              <input type="text" id="dept1Phone" placeholder="전화번호" oninput="updatePreview()" />
            </div>
            <input type="email" id="dept1Email" placeholder="이메일" style="margin-top:6px" oninput="updatePreview()" />
          </div>
        </div>
        <button class="btn-add" style="margin-top:6px" onclick="addDept()">＋ 담당부서 추가</button>
      </div>
      <div class="field-group" style="margin-top:10px">
        <label class="field-label">구제 기관 포함</label>
        <div class="toggle-group">
          <div class="toggle-item checked" data-key="ag_kopico" onclick="toggleItem(this,'agency')">
            <div><div class="toggle-label">개인정보 분쟁조정위원회</div><div class="toggle-sub">1833-6972 · kopico.go.kr</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="ag_kisa" onclick="toggleItem(this,'agency')">
            <div><div class="toggle-label">개인정보침해 신고센터(KISA)</div><div class="toggle-sub">118 · privacy.kisa.or.kr</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="ag_spo" onclick="toggleItem(this,'agency')">
            <div><div class="toggle-label">대검찰청</div><div class="toggle-sub">1301 · spo.go.kr</div></div>
            <div class="toggle-switch"></div>
          </div>
          <div class="toggle-item checked" data-key="ag_police" onclick="toggleItem(this,'agency')">
            <div><div class="toggle-label">경찰청</div><div class="toggle-sub">182 · ecrm.police.go.kr</div></div>
            <div class="toggle-switch"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── STEP 13: 추가적 이용·제공 ── -->
    <div class="section-panel" id="step13">
      <div class="section-title">
        <div class="section-num">13</div>
        추가적 이용·제공 판단기준 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">정보주체 동의 없이 추가적으로 이용·제공하는 경우에만 포함합니다.</div>
      <div class="field-group">
        <div class="radio-group">
          <div class="radio-item selected" id="add_no" onclick="selectR('add_no','add_yes','addUsage','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="add_yes" onclick="selectR('add_yes','add_no','addUsage','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">있음 (판단기준 기재)</div></div>
          </div>
        </div>
        <div id="addUsageDetail" style="display:none;margin-top:8px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <div class="section-num">①</div>
            <span style="font-size:12.5px;font-weight:600;color:#374151">이용·제공 대상</span>
          </div>
          <div id="addUsageRows"></div>
          <button class="btn-add" style="margin-top:4px" onclick="addAU()">＋ 항목 추가</button>
          <div style="border-top:1px solid #e5e7eb;margin:14px 0"></div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
            <div class="section-num">②</div>
            <span style="font-size:12.5px;font-weight:600;color:#374151">고려사항 <span style="font-size:11px;font-weight:400;color:#6b7280">(시행령 §14조의2)</span></span>
          </div>
          <div class="field-group">
            <label class="field-label" style="font-size:12px">① 당초 수집 목적과의 관련성</label>
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:3px;font-size:12.5px;line-height:1.8;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;">
              <span>제공하는 개인정보의 당초 수집 목적인 '</span><input id="auC1Var" type="text" placeholder="서비스 제공" style="width:120px;padding:1px 6px;font-size:12.5px;border:1px solid #6366f1;border-radius:4px;background:#fff;" oninput="syncAU();updatePreview()"><span>' 목적을 위한 것으로 수집 목적과 관련성이 있습니다.</span>
            </div>
          </div>
          <div class="field-group" style="margin-top:6px">
            <label class="field-label" style="font-size:12px">② 예측 가능성</label>
            <div style="font-size:12.5px;line-height:1.8;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;">정보주체는 서비스 계약 과정에서 서비스 특성상 개인정보의 추가적인 이용·제공이 있을 수 있음을 예측할 수 있습니다.</div>
          </div>
          <div class="field-group" style="margin-top:6px">
            <label class="field-label" style="font-size:12px">③ 정보주체 이익 침해 여부</label>
            <div style="font-size:12.5px;line-height:1.8;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;">정보주체의 요청에 따라 서비스를 제공하기 위해 제공되는 정보로, 정보주체의 이익을 부당하게 침해하지 않습니다.</div>
          </div>
          <div class="field-group" style="margin-top:6px">
            <label class="field-label" style="font-size:12px">④ 안전성 확보 조치</label>
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:3px;font-size:12.5px;line-height:1.8;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;">
              <input id="auC4Var" type="text" placeholder="안심번호 사용" style="width:120px;padding:1px 6px;font-size:12.5px;border:1px solid #6366f1;border-radius:4px;background:#fff;" oninput="syncAU();updatePreview()"><span> 등 개인정보 노출을 최소화하기 위한 안전성 확보에 필요한 조치를 하고 있습니다.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── STEP 14: 민감정보 ── -->
    <div class="section-panel" id="step14">
      <div class="section-title">
        <div class="section-num">14</div>
        민감정보 공개 가능성 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">공개 설정된 게시물 등에 민감정보가 포함·노출될 수 있는 경우에만 포함합니다.</div>
      <div class="field-group">
        <div class="radio-group">
          <div class="radio-item selected" id="sen_no" onclick="selectR('sen_no','sen_yes','sensitive','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="sen_yes" onclick="selectR('sen_yes','sen_no','sensitive','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">공개 가능성 있음</div></div>
          </div>
        </div>
        <div id="sensitiveDetail" style="display:none;margin-top:12px">
          <div id="sensitiveRows"></div>
          <button class="btn-add" onclick="addSensitive()">+ 항목 추가</button>
        </div>
      </div>
    </div>

    <!-- ── STEP 15: 가명정보 ── -->
    <div class="section-panel" id="step15">
      <div class="section-title">
        <div class="section-num">15</div>
        가명정보 처리 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">개인정보를 가명처리하여 활용하는 경우에만 포함합니다.</div>
      <div class="field-group">
        <div class="radio-group">
          <div class="radio-item selected" id="ps_no" onclick="selectR('ps_no','ps_yes','pseudonym','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="ps_yes" onclick="selectR('ps_yes','ps_no','pseudonym','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">가명정보를 처리합니다</div></div>
          </div>
        </div>
        <div id="pseudonymDetail" style="display:none;margin-top:12px">
          <div id="pseudonymRows"></div>
          <button class="btn-add" onclick="addPseudo()">+ 가명처리 항목 추가</button>

          <div class="field-group" style="margin-top:16px">
            <label class="field-label">제3자 제공 여부</label>
            <div class="radio-group">
              <div class="radio-item selected" id="pstp_no" onclick="selectR('pstp_no','pstp_yes','pseudonymProvide','no')">
                <div class="radio-dot"></div>
                <div><div class="radio-text">제공 없음</div></div>
              </div>
              <div class="radio-item" id="pstp_yes" onclick="selectR('pstp_yes','pstp_no','pseudonymProvide','yes')">
                <div class="radio-dot"></div>
                <div><div class="radio-text">제3자에게 제공합니다</div></div>
              </div>
            </div>
          </div>
          <div id="pseudonymProvideDetail" style="display:none;margin-top:8px">
            <div id="pseudonymProvideRows"></div>
            <button class="btn-add" onclick="addPseudoProvide()">+ 제공 항목 추가</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── STEP 16: 자동화된 결정 ── -->
    <div class="section-panel" id="step16">
      <div class="section-title">
        <div class="section-num">16</div>
        자동화된 결정 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">AI 등 자동화된 시스템으로 개인에 관한 결정을 내리는 경우에만 포함합니다.</div>
      <div class="field-group">
        <div class="radio-group">
          <div class="radio-item selected" id="auto_no" onclick="selectR('auto_no','auto_yes','autoDecision','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="auto_yes" onclick="selectR('auto_yes','auto_no','autoDecision','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">자동화된 결정이 있습니다</div></div>
          </div>
        </div>
        <div id="autoDecisionDetail" style="display:none;margin-top:8px">
          <textarea id="autoDecisionText" rows="3"
            placeholder="예: AI 기반 신용평가 자동 결정 시스템을 운영하고 있으며, 정보주체는 거부·설명 요구를 할 수 있습니다."
            oninput="updatePreview()"></textarea>
        </div>
      </div>
    </div>

    <!-- ── STEP 17: 국내대리인 ── -->
    <div class="section-panel" id="step17">
      <div class="section-title">
        <div class="section-num">17</div>
        국내대리인 지정 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">국내에 주소·영업소가 없는 해외사업자의 경우에만 포함합니다.</div>
      <div class="field-group">
        <div class="radio-group">
          <div class="radio-item selected" id="da_no" onclick="selectR('da_no','da_yes','domAgent','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="da_yes" onclick="selectR('da_yes','da_no','domAgent','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">국내대리인을 지정하였습니다</div></div>
          </div>
        </div>
        <div id="domAgentDetail" style="display:none;margin-top:8px">
          <div class="field-row">
            <input type="text" id="daName" placeholder="성명(법인명)" oninput="updatePreview()" />
            <input type="tel" id="daPhone" placeholder="전화번호" oninput="updatePreview()" />
          </div>
          <input type="text" id="daAddr" placeholder="주소(영업소 소재지)" style="margin-top:6px" oninput="updatePreview()" />
          <input type="email" id="daEmail" placeholder="이메일" style="margin-top:6px" oninput="updatePreview()" />
        </div>
      </div>
      <div class="info-box" style="margin-top:14px">
        <div class="info-title">✅ 완성!</div>
        <p>오른쪽 미리보기를 확인하고 상단 <strong>HTML 다운로드</strong> 버튼으로 저장하세요.</p>
      </div>
    </div>
  `;
}
