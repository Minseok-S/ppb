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
        <div class="date-wrapper">
          <input type="date" id="effectiveDate" oninput="updatePreview()" />
          <span class="date-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
        </div>
       
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
      <div class="section-desc">개인정보를 국외로 이전하는 경우 해당 유형을 선택하여 입력합니다.</div>

      <!-- 가. 국외 제3자 제공 -->
      <div class="field-group">
        <label class="field-label">가. 개인정보 국외 제3자 제공</label>
        <div class="radio-group">
          <div class="radio-item selected" id="otP_no" onclick="selectOTType('provide','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="otP_yes" onclick="selectOTType('provide','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 있음 (상세 입력)</div></div>
          </div>
        </div>
      </div>
      <div id="otProvideDetail" style="display:none;margin-bottom:14px">
        <div id="otProvideItems"></div>
        <button class="btn-add" style="margin-top:6px" onclick="addOverseas('provide')">＋ 제공 대상 추가</button>
      </div>

      <!-- 나. 국외 처리위탁·보관 -->
      <div class="field-group" style="margin-top:10px">
        <label class="field-label">나. 개인정보 국외 처리위탁·보관</label>
        <div class="radio-group">
          <div class="radio-item selected" id="otD_no" onclick="selectOTType('delegate','no')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="otD_yes" onclick="selectOTType('delegate','yes')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 있음 (상세 입력)</div></div>
          </div>
        </div>
      </div>
      <div id="otDelegateDetail" style="display:none;margin-bottom:14px">
        <div id="otDelegateItems"></div>
        <button class="btn-add" style="margin-top:6px" onclick="addOverseas('delegate')">＋ 위탁·보관 대상 추가</button>
      </div>

      <!-- 공통: 거부 불이익 + 거부 방법 -->
      <div id="otRefuseSection" style="display:none">
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">국외 이전 거부 방법</label>
          <div style="display:flex;flex-direction:column;gap:5px;">
            <div>
              <div class="toggle-item" id="otRef_web_toggle" onclick="toggleRefuseChannel('web')">
                <div><div class="toggle-label">홈페이지</div></div>
                <div class="toggle-switch"></div>
              </div>
              <div id="otRef_web_input" style="display:none;margin-top:4px;padding:0 4px">
                <input type="text" class="field-input" id="otRef_web_path" placeholder="예: 메뉴 – 내 정보 – 회원 탈퇴" oninput="syncOT();updatePreview()" />
              </div>
            </div>
            <div>
              <div class="toggle-item" id="otRef_mobile_toggle" onclick="toggleRefuseChannel('mobile')">
                <div><div class="toggle-label">모바일 앱</div></div>
                <div class="toggle-switch"></div>
              </div>
              <div id="otRef_mobile_input" style="display:none;margin-top:4px;padding:0 4px">
                <input type="text" class="field-input" id="otRef_mobile_path" placeholder="예: 메뉴 – 내 정보 – 회원 탈퇴" oninput="syncOT();updatePreview()" />
              </div>
            </div>
            <div>
              <div class="toggle-item" id="otRef_cs_toggle" onclick="toggleRefuseChannel('cs')">
                <div><div class="toggle-label">고객센터</div></div>
                <div class="toggle-switch"></div>
              </div>
              <div id="otRef_cs_input" style="display:none;margin-top:4px;padding:0 4px">
                <input type="text" class="field-input" id="otRef_cs_phone" placeholder="예: 0000-0000" oninput="syncOT();updatePreview()" />
              </div>
            </div>
          </div>
          <div class="sec-extra-row" style="margin-top:6px">
            <input type="text" id="otRef_custom_name" class="field-input" placeholder="채널명 (예: 우편, 팩스)" style="flex:1.2" onkeydown="if(event.key==='Enter')addRefuseCustom()" />
            <input type="text" id="otRef_custom_detail" class="field-input" placeholder="세부 내용 (예: 주소, 번호)" style="flex:2" onkeydown="if(event.key==='Enter')addRefuseCustom()" />
            <button class="btn-add-sm" onclick="addRefuseCustom()">추가</button>
          </div>
          <div id="otRef_custom_chips" class="sec-chips"></div>
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
        자동수집장치 및 행태정보 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">쿠키·행태정보 등 개인정보 자동 수집 장치에 관한 사항을 설정합니다.</div>
      <div class="field-group">
        <label class="field-label">쿠키 차단 안내 환경</label>
        <div class="radio-group">
          <div class="radio-item selected" id="be_web" onclick="selectBrowserEnv('web')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">웹 브라우저</div><div class="radio-desc">PC 등 웹브라우저(Chrome, Edge 등)만 해당</div></div>
          </div>
          <div class="radio-item" id="be_mobile" onclick="selectBrowserEnv('mobile')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">모바일 브라우저</div><div class="radio-desc">모바일(Safari, Chrome 모바일, 삼성인터넷 등)만 해당</div></div>
          </div>
          <div class="radio-item" id="be_both" onclick="selectBrowserEnv('both')">
            <div class="radio-dot"></div>
            <div><div class="radio-text">웹+모바일 모두</div><div class="radio-desc">웹브라우저와 모바일 브라우저 모두 해당</div></div>
          </div>
        </div>
      </div>
      <!-- ▶ 행태정보 서브섹션 -->
      <div style="margin-top:14px;padding-top:12px;border-top:2px solid #e5e7eb;margin-bottom:10px">
        <div style="font-size:11.5px;font-weight:700;color:#374151;margin-bottom:3px">행태정보(Behavioral) 관련</div>
        <div style="font-size:11px;color:var(--text3);line-height:1.5">맞춤형 광고 등을 위해 행태정보를 수집·이용하는 경우 기재합니다.</div>
      </div>
      <div class="field-group">
        <label class="field-label">회사의 행태정보 처리 여부</label>
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

        <!-- 정보주체 식별 여부 -->
        <div class="field-group" style="margin-top:12px;padding:10px 12px;border:1.5px solid var(--accent);border-radius:8px;background:#fafbff">
          <label class="field-label">정보주체 식별 여부 <span style="font-size:11px;color:var(--text3);font-weight:400">(법적 근거 칼럼 포함 여부에 영향)</span></label>
          <div class="radio-group" style="margin-top:6px">
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

        <!-- 행태정보의 수집·이용·제공 및 거부 등에 관한 사항 -->
        <div style="margin-top:14px;padding-top:12px;border-top:2px solid #e5e7eb">
          <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px;letter-spacing:-0.2px">
            &lt; 행태정보의 수집·이용·제공 및 거부 등에 관한 사항 &gt;
          </div>

          <!-- 3-1 행태정보 수집·이용 관련 -->
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-bottom:10px">
            <div style="font-size:11.5px;font-weight:700;color:#374151;margin-bottom:8px">행태정보 수집·이용 관련</div>
            <div class="field-group">
              <label class="field-label">처리 목적</label>
              <input type="text" id="bhPurpose" placeholder="예: 정보주체에게 최적화된 맞춤형 서비스 및 혜택을 제공" oninput="updatePreview()" style="margin-bottom:6px"/>
            </div>
            <div class="field-group">
              <label class="field-label">행태정보 수집 항목 <span class="opt">(표)</span></label>
              <div id="bhItems"></div>
              <button class="btn-add" style="margin-top:6px" onclick="addBehavioral()">＋ 행태정보 항목 추가</button>
            </div>
          </div>

          <!-- 3-2 행태정보의 제3자(광고사업자 등) 제공 관련 -->
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-bottom:10px">
            <div style="font-size:11.5px;font-weight:700;color:#374151;margin-bottom:8px">행태정보의 제3자(광고사업자 등) 제공 관련</div>
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



          <!-- 3-4 제3자가 운영하는 웹‧앱에 설치된 개인정보 자동 수집 장치로부터 행태정보를 수집하는 경우 -->
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-bottom:10px">
            <div style="font-size:11.5px;font-weight:700;color:#374151;margin-bottom:4px">제3자가 운영하는 웹‧앱에 설치된 개인정보 자동 수집 장치로부터 행태정보를 수집하는 경우</div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:8px;line-height:1.5">귀사가 제3자가 운영하는 웹·앱에 설치된 자동수집장치로부터 행태정보를 수집·이용하는 경우</div>
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

          <!-- 3-4 수집한 행태정보를 맞춤형 광고에 활용하는 경우 -->
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-bottom:10px">
            <div style="font-size:11.5px;font-weight:700;color:#374151;margin-bottom:8px">수집한 행태정보를 맞춤형 광고에 활용하는 경우</div>
            <div class="radio-group">
              <div class="radio-item selected" id="bhAdUse_no" onclick="selectR('bhAdUse_no','bhAdUse_yes','bhAdUse','no')" style="margin-bottom:0">
                <div class="radio-dot"></div>
                <div><div class="radio-text">해당 없음</div></div>
              </div>
              <div class="radio-item" id="bhAdUse_yes" onclick="selectR('bhAdUse_yes','bhAdUse_no','bhAdUse','yes')" style="margin-bottom:0">
                <div class="radio-dot"></div>
                <div><div class="radio-text">맞춤형 광고에 활용합니다</div></div>
              </div>
            </div>
            <div id="bhAdUseDetail" style="display:none;margin-top:10px">
              <div class="field-group">
                <label class="field-label">민감정보 미수집 문구</label>
                <div class="toggle-group">
                  <div class="toggle-item checked" data-key="bh_nosensitive" onclick="toggleItem(this,'bhFlags')">
                    <div><div class="toggle-label">민감한 행태정보 수집하지 않음</div></div>
                    <div class="toggle-switch"></div>
                  </div>
                </div>
                <input type="text" id="bhSensitivePurpose" placeholder="수집 목적 예: 최적화된 맞춤형 서비스 및 혜택, 온라인 맞춤형 광고 등"
                  value="최적화된 맞춤형 서비스 및 혜택, 온라인 맞춤형 광고 등" oninput="updatePreview()" style="margin-top:6px"/>
              </div>
              <div class="field-group" style="margin-top:8px">
                <label class="field-label">웹브라우저 쿠키 차단 안내</label>
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
              <div class="field-group" style="margin-top:8px">
                <label class="field-label">모바일 광고 식별자 문구</label>
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
            </div>
          </div>
        </div>

        <!-- 행태정보 담당부서 연락처 -->
        <div class="field-group" style="margin-top:10px">
          <label class="field-label">행태정보 담당부서 연락처 <span class="opt">(선택)</span></label>
          <input type="text" id="bhContactDept" placeholder="부서명 예: 개인정보보호팀" oninput="updatePreview()" style="margin-bottom:4px"/>
          <input type="text" id="bhContactPerson" placeholder="담당자명 예: 개인정보보호팀장" oninput="updatePreview()" style="margin-bottom:4px"/>
          <input type="text" id="bhContactPhone" placeholder="전화번호 예: 02-1234-5678" oninput="updatePreview()" style="margin-bottom:4px"/>
          <input type="text" id="bhContactEmail" placeholder="이메일 예: privacy@company.com" oninput="updatePreview()"/>
        </div>
      </div>
      <!-- 제3자가 수집해가는 행태정보 관련 (귀사 행태정보 처리 여부와 독립) -->
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-top:12px">
        <div style="font-size:11.5px;font-weight:700;color:#374151;margin-bottom:4px">제3자가 수집해가는 행태정보 관련</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:8px;line-height:1.5">귀사 웹·앱에서 제3자가 행태정보를 수집해가는 경우</div>
        <div class="radio-group">
          <div class="radio-item selected" id="bhThirdOut_no" onclick="selectR('bhThirdOut_no','bhThirdOut_yes','bhThirdOut','no')" style="margin-bottom:0">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 없음</div></div>
          </div>
          <div class="radio-item" id="bhThirdOut_yes" onclick="selectR('bhThirdOut_yes','bhThirdOut_no','bhThirdOut','yes')" style="margin-bottom:0">
            <div class="radio-dot"></div>
            <div><div class="radio-text">해당 있음</div></div>
          </div>
        </div>
        <div id="bhThirdOutDetail" style="display:none;margin-top:8px">
          <div id="bhThirdOutItems"></div>
          <button class="btn-add" style="margin-top:6px" onclick="addBhThirdOutItem()">＋ 항목 추가</button>
        </div>
      </div>
    </div>

    <!-- ── STEP 10: 권리행사 ── -->
    <div class="section-panel" id="step10">
      <div class="section-title">
        <div class="section-num">10</div>
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

    <!-- ── STEP 11: 책임자 ── -->
    <div class="section-panel" id="step11">
      <div class="section-title">
        <div class="section-num">11</div>
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

    <!-- ── STEP 12: 추가적 이용·제공 ── -->
    <div class="section-panel" id="step12">
      <div class="section-title">
        <div class="section-num">12</div>
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

    <!-- ── STEP 13: 민감정보 ── -->
    <div class="section-panel" id="step13">
      <div class="section-title">
        <div class="section-num">13</div>
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

    <!-- ── STEP 14: 가명정보 ── -->
    <div class="section-panel" id="step14">
      <div class="section-title">
        <div class="section-num">14</div>
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

          <!-- 가명정보 안전성 확보조치 -->
          <div class="field-group" style="margin-top:16px">
            <label class="field-label">가명정보 안전성 확보조치 <span style="font-size:11px;color:#888;font-weight:400;">(보호법 제28조의4)</span></label>
            <div style="background:#f8f9ff;border:1px solid #e0e4f0;border-radius:8px;padding:12px;margin-top:6px">

              <div class="field-group">
                <label class="field-label" style="font-size:12px;color:#3b5bdb;">관리적 조치</label>
                <div class="toggle-group">
                  <div class="toggle-item" data-key="ps_mgmt" onclick="toggleItem(this,'pseudonymSecurity')">
                    <div><div class="toggle-label">내부 관리계획 수립·시행</div></div>
                    <div class="toggle-switch"></div>
                  </div>
                  <div class="toggle-item" data-key="ps_edu" onclick="toggleItem(this,'pseudonymSecurity')">
                    <div><div class="toggle-label">정기적 직원 교육</div></div>
                    <div class="toggle-switch"></div>
                  </div>
                  <div class="toggle-item" data-key="ps_org" onclick="toggleItem(this,'pseudonymSecurity')">
                    <div><div class="toggle-label">전담 조직 운영</div></div>
                    <div class="toggle-switch"></div>
                  </div>
                </div>
                <div class="sec-extra-row">
                  <input type="text" id="ps_sec_mgmt_input" class="field-input" placeholder="관리적 조치 직접 추가" onkeydown="if(event.key==='Enter')addPsSecItem('mgmt')" />
                  <button class="btn-add-sm" onclick="addPsSecItem('mgmt')">추가</button>
                </div>
                <div id="ps_sec_mgmt_chips" class="sec-chips"></div>
              </div>

              <div class="field-group" style="margin-top:10px">
                <label class="field-label" style="font-size:12px;color:#3b5bdb;">기술적 조치</label>
                <div class="toggle-group">
                  <div class="toggle-item" data-key="ps_sep" onclick="toggleItem(this,'pseudonymSecurity')">
                    <div><div class="toggle-label">가명정보와 추가정보의 분리 보관</div></div>
                    <div class="toggle-switch"></div>
                  </div>
                  <div class="toggle-item" data-key="ps_destroy" onclick="toggleItem(this,'pseudonymSecurity')">
                    <div><div class="toggle-label">추가정보 불필요 시 파기</div></div>
                    <div class="toggle-switch"></div>
                  </div>
                  <div class="toggle-item" data-key="ps_access" onclick="toggleItem(this,'pseudonymSecurity')">
                    <div><div class="toggle-label">접근 권한 분리 및 접근통제시스템 설치</div></div>
                    <div class="toggle-switch"></div>
                  </div>
                  <div class="toggle-item" data-key="ps_log" onclick="toggleItem(this,'pseudonymSecurity')">
                    <div><div class="toggle-label">처리기록 및 접속기록 보관·점검</div></div>
                    <div class="toggle-switch"></div>
                  </div>
                  <div class="toggle-item" data-key="ps_sec" onclick="toggleItem(this,'pseudonymSecurity')">
                    <div><div class="toggle-label">보안프로그램 설치</div></div>
                    <div class="toggle-switch"></div>
                  </div>
                </div>
                <div class="sec-extra-row">
                  <input type="text" id="ps_sec_tech_input" class="field-input" placeholder="기술적 조치 직접 추가" onkeydown="if(event.key==='Enter')addPsSecItem('tech')" />
                  <button class="btn-add-sm" onclick="addPsSecItem('tech')">추가</button>
                </div>
                <div id="ps_sec_tech_chips" class="sec-chips"></div>
              </div>

              <div class="field-group" style="margin-top:10px">
                <label class="field-label" style="font-size:12px;color:#3b5bdb;">물리적 조치</label>
                <div class="toggle-group">
                  <div class="toggle-item" data-key="ps_phys" onclick="toggleItem(this,'pseudonymSecurity')">
                    <div><div class="toggle-label">전산실, 자료보관실 등의 출입통제</div></div>
                    <div class="toggle-switch"></div>
                  </div>
                </div>
                <div class="sec-extra-row">
                  <input type="text" id="ps_sec_phys_input" class="field-input" placeholder="물리적 조치 직접 추가" onkeydown="if(event.key==='Enter')addPsSecItem('phys')" />
                  <button class="btn-add-sm" onclick="addPsSecItem('phys')">추가</button>
                </div>
                <div id="ps_sec_phys_chips" class="sec-chips"></div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── STEP 15: 자동화된 결정 ── -->
    <div class="section-panel" id="step15">
      <div class="section-title">
        <div class="section-num">15</div>
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
        <div id="autoDecisionDetail" style="display:none;margin-top:12px">

          <!-- ① 사실·목적·대상 -->
          <div class="field-group" style="background:#f8f9ff;border:1px solid #e0e4f0;border-radius:8px;padding:12px;margin-bottom:10px">
            <label class="field-label" style="font-size:12px;font-weight:700;color:#3b5bdb;margin-bottom:8px">
              ① 자동화된 결정이 이루어진다는 사실과 그 목적 및 대상이 되는 정보주체의 범위
            </label>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">결정의 목적</label>
                <input type="text" id="adPurpose" placeholder="예: 채용 전형 평가, 신용점수 산출, 복지 부정수급 탐지"
                  oninput="updatePreview()">
              </div>
              <div class="field-group">
                <label class="field-label">대상이 되는 정보주체의 범위</label>
                <input type="text" id="adSubjectScope" placeholder="예: 당사 채용에 지원한 모든 지원자"
                  oninput="updatePreview()">
              </div>
            </div>
          </div>

          <!-- ② 주요 개인정보 유형과 관계 -->
          <div class="field-group" style="background:#f8f9ff;border:1px solid #e0e4f0;border-radius:8px;padding:12px;margin-bottom:10px">
            <label class="field-label" style="font-size:12px;font-weight:700;color:#3b5bdb;margin-bottom:6px">
              ② 자동화된 결정에 사용되는 주요 개인정보의 유형과 자동화된 결정의 관계
            </label>
            <div style="font-size:11px;color:#888;margin-bottom:8px">
              단계별로 사용되는 개인정보 유형과 결정 반영 비중을 입력하세요. (비중 생략 가능)
            </div>
            <div id="adInfoRows"></div>
            <button class="btn-add" onclick="addAdInfo()">＋ 행 추가</button>
          </div>

          <!-- ③ 고려사항 및 절차 -->
          <div class="field-group" style="background:#f8f9ff;border:1px solid #e0e4f0;border-radius:8px;padding:12px;margin-bottom:10px">
            <label class="field-label" style="font-size:12px;font-weight:700;color:#3b5bdb;margin-bottom:6px">
              ③ 자동화된 결정 과정에서의 고려사항 및 주요 개인정보가 처리되는 절차
            </label>
            <textarea id="adProcedure" rows="3"
              placeholder="예: 자동화 시스템은 지원자가 제출한 개인정보를 분석하여 단계별 역량을 평가하고 점수로 산출합니다. 최종 대면면접 이전의 불합격 결정은 자동으로 통보됩니다."
              oninput="updatePreview()"></textarea>
          </div>

          <!-- ④ 민감정보·아동 -->
          <div class="field-group" style="background:#f8f9ff;border:1px solid #e0e4f0;border-radius:8px;padding:12px;margin-bottom:10px">
            <label class="field-label" style="font-size:12px;font-weight:700;color:#3b5bdb;margin-bottom:8px">
              ④ 민감정보 또는 14세 미만 아동의 개인정보 처리 여부
            </label>
            <div class="radio-group" style="margin-bottom:6px">
              <div class="radio-item selected" id="adSen_no" onclick="selectR('adSen_no','adSen_yes','adSensitive','no')">
                <div class="radio-dot"></div>
                <div><div class="radio-text">처리하지 않습니다</div></div>
              </div>
              <div class="radio-item" id="adSen_yes" onclick="selectR('adSen_yes','adSen_no','adSensitive','yes')">
                <div class="radio-dot"></div>
                <div><div class="radio-text">처리합니다</div></div>
              </div>
            </div>
            <div id="adSensitiveDetailPanel" style="display:none">
              <textarea id="adSensitiveDetail" rows="2"
                placeholder="예: 자동화된 결정 과정에서 AI 면접 시 지원자의 얼굴영상(생체인식정보)을 처리하며, 목적은 비언어적 역량 평가입니다."
                oninput="updatePreview()"></textarea>
            </div>
          </div>

          <!-- ⑤ 거부·설명 요구 방법 및 절차 -->
          <div class="field-group" style="background:#f8f9ff;border:1px solid #e0e4f0;border-radius:8px;padding:12px">
            <label class="field-label" style="font-size:12px;font-weight:700;color:#3b5bdb;margin-bottom:6px">
              ⑤ 자동화된 결정에 대한 거부·설명 요구 방법 및 절차 (담당부서 연락처)
            </label>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">부서명</label>
                <input type="text" id="adContactDept" placeholder="예: 고객센터 / 개인정보보호팀"
                  oninput="updatePreview()">
              </div>
              <div class="field-group">
                <label class="field-label">전화번호</label>
                <input type="tel" id="adContactPhone" placeholder="예: 02-1234-5678"
                  oninput="updatePreview()">
              </div>
            </div>
            <div class="field-row" style="margin-top:6px">
              <div class="field-group">
                <label class="field-label">이메일</label>
                <input type="email" id="adContactEmail" placeholder="예: privacy@company.com"
                  oninput="updatePreview()">
              </div>
              <div class="field-group">
                <label class="field-label">주소</label>
                <input type="text" id="adContactAddr" placeholder="예: 서울특별시 강남구 테헤란로 000"
                  oninput="updatePreview()">
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ── STEP 17: 영상정보처리기기 ── -->
    <div class="section-panel" id="step17">
      <div class="section-title">
        <div class="section-num">17</div>
        영상정보처리기기 운영·관리에 관한 사항 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">고정형·이동형 영상정보처리기기(CCTV 등)를 운영하는 경우 기재합니다.</div>

      <!-- ▶ 가. 고정형 -->
      <div style="margin-top:6px;padding:12px;border:1.5px solid #e5e7eb;border-radius:10px;background:#fafbff">
        <div style="font-size:12.5px;font-weight:700;color:#374151;margin-bottom:8px">가. 고정형 영상정보처리기기</div>
        <div class="field-group">
          <div class="radio-group">
            <div class="radio-item selected" id="cctvFixed_no" onclick="selectCCTV('fixed','no')">
              <div class="radio-dot"></div>
              <div><div class="radio-text">운영하지 않습니다</div></div>
            </div>
            <div class="radio-item" id="cctvFixed_yes" onclick="selectCCTV('fixed','yes')">
              <div class="radio-dot"></div>
              <div><div class="radio-text">운영합니다 (상세 입력)</div></div>
            </div>
          </div>
        </div>
        <div id="cctvFixedDetail" style="display:none;margin-top:10px">
          <!-- ① 설치 목적 -->
          <div class="field-group">
            <label class="field-label">① 설치 목적 <span class="req">*</span></label>
            <input type="text" id="cctvFixedPurpose" placeholder="예: 시설 안전 및 화재예방, 범죄 예방" oninput="S.cctvFixedPurpose=this.value;updatePreview()" />
          </div>
          <!-- ② 설치 위치 및 대수 -->
          <div class="field-group" style="margin-top:8px">
            <label class="field-label">② 설치 위치 및 대수</label>
            <div id="cctvFixedLocations"></div>
            <button class="btn-add" onclick="addCCTVLocation('fixed')">＋ 위치 추가</button>
          </div>
          <!-- ③ 관리책임자 및 접근권한자 -->
          <div class="field-group" style="margin-top:8px">
            <label class="field-label">③ 관리책임자</label>
            <div class="field-row" style="margin-bottom:4px">
              <input type="text" id="cctvFixedManagerName" placeholder="이름" oninput="S.cctvFixedManagerName=this.value;updatePreview()" />
              <input type="text" id="cctvFixedManagerTitle" placeholder="직위" oninput="S.cctvFixedManagerTitle=this.value;updatePreview()" />
            </div>
            <div class="field-row">
              <input type="text" id="cctvFixedManagerDept" placeholder="소속 (부서명)" oninput="S.cctvFixedManagerDept=this.value;updatePreview()" />
              <input type="tel" id="cctvFixedManagerPhone" placeholder="연락처" oninput="S.cctvFixedManagerPhone=this.value;updatePreview()" />
            </div>
          </div>
          <div class="field-group" style="margin-top:6px">
            <label class="field-label">③ 접근권한자</label>
            <div class="field-row" style="margin-bottom:4px">
              <input type="text" id="cctvFixedAccessName" placeholder="이름" oninput="S.cctvFixedAccessName=this.value;updatePreview()" />
              <input type="text" id="cctvFixedAccessTitle" placeholder="직위" oninput="S.cctvFixedAccessTitle=this.value;updatePreview()" />
            </div>
            <div class="field-row">
              <input type="text" id="cctvFixedAccessDept" placeholder="소속 (부서명)" oninput="S.cctvFixedAccessDept=this.value;updatePreview()" />
              <input type="tel" id="cctvFixedAccessPhone" placeholder="연락처" oninput="S.cctvFixedAccessPhone=this.value;updatePreview()" />
            </div>
          </div>
          <!-- ④ 촬영시간, 보관기간, 보관장소 -->
          <div class="field-group" style="margin-top:8px">
            <label class="field-label">④ 촬영 시간</label>
            <input type="text" id="cctvFixedHours" placeholder="예: 24시간 연속 촬영" oninput="S.cctvFixedHours=this.value;updatePreview()" />
          </div>
          <div class="field-group" style="margin-top:6px">
            <label class="field-label">보관 기간</label>
            <div style="display:flex;align-items:center;gap:6px">
              <input type="text" id="cctvFixedRetention" value="30" min="1" style="width:80px" oninput="S.cctvFixedRetention=this.value;updatePreview()" />
              <span style="font-size:12px;color:var(--text2)">일</span>
            </div>
          </div>
          <div class="field-group" style="margin-top:6px">
            <label class="field-label">보관 장소</label>
            <input type="text" id="cctvFixedStorageLocation" placeholder="예: 보안실 서버실" oninput="S.cctvFixedStorageLocation=this.value;updatePreview()" />
          </div>
          <!-- ⑤ 위탁 -->
          <div class="field-group" style="margin-top:8px">
            <label class="field-label">⑤ 설치·관리 위탁 여부</label>
            <div class="radio-group">
              <div class="radio-item selected" id="cctvFixedDelegate_no" onclick="selectCCTVDelegate('fixed','no')">
                <div class="radio-dot"></div>
                <div><div class="radio-text">위탁하지 않습니다</div></div>
              </div>
              <div class="radio-item" id="cctvFixedDelegate_yes" onclick="selectCCTVDelegate('fixed','yes')">
                <div class="radio-dot"></div>
                <div><div class="radio-text">위탁합니다</div></div>
              </div>
            </div>
            <div id="cctvFixedDelegateDetail" style="display:none;margin-top:6px">
              <div id="cctvFixedDelegateItems"></div>
              <button class="btn-add" onclick="addCCTVDelegate('fixed')">＋ 수탁업체 추가</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ▶ 나. 이동형 -->
      <div style="margin-top:10px;padding:12px;border:1.5px solid #e5e7eb;border-radius:10px;background:#fafbff">
        <div style="font-size:12.5px;font-weight:700;color:#374151;margin-bottom:8px">나. 이동형 영상정보처리기기</div>
        <div class="field-group">
          <div class="radio-group">
            <div class="radio-item selected" id="cctvMobile_no" onclick="selectCCTV('mobile','no')">
              <div class="radio-dot"></div>
              <div><div class="radio-text">운영하지 않습니다</div></div>
            </div>
            <div class="radio-item" id="cctvMobile_yes" onclick="selectCCTV('mobile','yes')">
              <div class="radio-dot"></div>
              <div><div class="radio-text">운영합니다 (상세 입력)</div></div>
            </div>
          </div>
        </div>
        <div id="cctvMobileDetail" style="display:none;margin-top:10px">
          <!-- ① 운영 목적 -->
          <div class="field-group">
            <label class="field-label">① 운영 목적 <span class="req">*</span></label>
            <input type="text" id="cctvMobilePurpose" placeholder="예: 현장 안전 관리, 시설 점검" oninput="S.cctvMobilePurpose=this.value;updatePreview()" />
          </div>
          <!-- ② 촬영 대상 지역 -->
          <div class="field-group" style="margin-top:8px">
            <label class="field-label">② 촬영 대상 지역</label>
            <input type="text" id="cctvMobileArea" placeholder="예: 사업장 내외 공공장소" oninput="S.cctvMobileArea=this.value;updatePreview()" />
          </div>
          <!-- ③ 운영 담당자 -->
          <div class="field-group" style="margin-top:8px">
            <label class="field-label">③ 관리책임자</label>
            <div class="field-row" style="margin-bottom:4px">
              <input type="text" id="cctvMobileManagerName" placeholder="이름" oninput="S.cctvMobileManagerName=this.value;updatePreview()" />
              <input type="text" id="cctvMobileManagerTitle" placeholder="직위" oninput="S.cctvMobileManagerTitle=this.value;updatePreview()" />
            </div>
            <div class="field-row">
              <input type="text" id="cctvMobileManagerDept" placeholder="소속 (부서명)" oninput="S.cctvMobileManagerDept=this.value;updatePreview()" />
              <input type="tel" id="cctvMobileManagerPhone" placeholder="연락처" oninput="S.cctvMobileManagerPhone=this.value;updatePreview()" />
            </div>
          </div>
          <div class="field-group" style="margin-top:6px">
            <label class="field-label">③ 접근권한자</label>
            <div class="field-row" style="margin-bottom:4px">
              <input type="text" id="cctvMobileAccessName" placeholder="이름" oninput="S.cctvMobileAccessName=this.value;updatePreview()" />
              <input type="text" id="cctvMobileAccessTitle" placeholder="직위" oninput="S.cctvMobileAccessTitle=this.value;updatePreview()" />
            </div>
            <div class="field-row">
              <input type="text" id="cctvMobileAccessDept" placeholder="소속 (부서명)" oninput="S.cctvMobileAccessDept=this.value;updatePreview()" />
              <input type="tel" id="cctvMobileAccessPhone" placeholder="연락처" oninput="S.cctvMobileAccessPhone=this.value;updatePreview()" />
            </div>
          </div>
          <!-- ④ 촬영시간, 보관기간, 보관장소 -->
          <div class="field-group" style="margin-top:8px">
            <label class="field-label">④ 촬영 시간대</label>
            <input type="text" id="cctvMobileHours" placeholder="예: 업무시간 중(09:00~18:00), 필요 시 수시" oninput="S.cctvMobileHours=this.value;updatePreview()" />
          </div>
          <div class="field-group" style="margin-top:6px">
            <label class="field-label">보관 기간</label>
            <div style="display:flex;align-items:center;gap:6px">
              <input type="text" id="cctvMobileRetention" value="30" min="1" style="width:80px" oninput="S.cctvMobileRetention=this.value;updatePreview()" />
              <span style="font-size:12px;color:var(--text2)">일</span>
            </div>
          </div>
          <div class="field-group" style="margin-top:6px">
            <label class="field-label">보관 장소</label>
            <input type="text" id="cctvMobileStorageLocation" placeholder="예: 보안실 서버실" oninput="S.cctvMobileStorageLocation=this.value;updatePreview()" />
          </div>
          <!-- ⑤ 위탁 -->
          <div class="field-group" style="margin-top:8px">
            <label class="field-label">⑤ 설치·관리 위탁 여부</label>
            <div class="radio-group">
              <div class="radio-item selected" id="cctvMobileDelegate_no" onclick="selectCCTVDelegate('mobile','no')">
                <div class="radio-dot"></div>
                <div><div class="radio-text">위탁하지 않습니다</div></div>
              </div>
              <div class="radio-item" id="cctvMobileDelegate_yes" onclick="selectCCTVDelegate('mobile','yes')">
                <div class="radio-dot"></div>
                <div><div class="radio-text">위탁합니다</div></div>
              </div>
            </div>
            <div id="cctvMobileDelegateDetail" style="display:none;margin-top:6px">
              <div id="cctvMobileDelegateItems"></div>
              <button class="btn-add" onclick="addCCTVDelegate('mobile')">＋ 수탁업체 추가</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── STEP 16: 국내대리인 ── -->
    <div class="section-panel" id="step16">
      <div class="section-title">
        <div class="section-num">16</div>
        국내대리인 지정 <span class="badge-opt">해당시</span>
      </div>
      <div class="section-desc">국내에 주소·영업소가 없는 해외사업자로서 법적 조건에 해당하는 경우에만 포함합니다.</div>
    
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
        <div id="domAgentDetail" style="display:none;margin-top:12px">
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">성명 <span class="req">*</span><span style="font-size:10px;color:#aaa;font-weight:400"> (법인의 경우 법인명, 대표자의 성명)</span></label>
              <input type="text" id="daName" placeholder="예: 홍길동 / (주)○○" oninput="updatePreview()" />
            </div>
            <div class="field-group">
              <label class="field-label">전화번호 <span class="req">*</span><span style="font-size:10px;color:#aaa;font-weight:400"> (국내 연락 가능 번호)</span></label>
              <input type="tel" id="daPhone" placeholder="예: 02-0000-0000" oninput="updatePreview()" />
            </div>
          </div>
          <div class="field-group" style="margin-top:8px">
            <label class="field-label">주소 <span class="req">*</span><span style="font-size:10px;color:#aaa;font-weight:400"> (법인의 경우 영업소 소재지)</span></label>
            <input type="text" id="daAddr" placeholder="예: 서울특별시 ○○구 ○○로 00" oninput="updatePreview()" />
          </div>
          <div class="field-group" style="margin-top:8px">
            <label class="field-label">이메일 <span class="req">*</span></label>
            <input type="email" id="daEmail" placeholder="예: privacy@example.com" oninput="updatePreview()" />
          </div>
        </div>
      </div>
    </div>
  `;
}
