(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycby3FN9AR9b-2Q8Kzj0vmMtEIFqGLE0Vlq8LJA19VaavcNEfk2hpd2vXBKuMvw5_Us7SyA/exec";
  const DEMO = !API_URL;

  const qs = new URLSearchParams(location.search);
  const token = qs.get("t") || "";
  const app = document.getElementById("app");
  const e = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const won = n => new Intl.NumberFormat("ko-KR").format(Math.round(n || 0)) + "원";

  const S = { screen: "loading", data: null, q: "", filter: "진행중", biz: "", code: null };
  const STAGES = ["신청", "코칭", "사전검사", "계획서작성", "일경험 진행", "서비스 종료", "만족도조사", "사후검사", "완료"];

  async function api(payload) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl.signal });
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  function noTokenScreen() {
    return '<div class="sec-intro"><p class="eyebrow">일경험 관리자 대시보드</p><h2>개인 링크로 들어와 주세요</h2>' +
      '<p class="muted">스프레드시트 메뉴 [일경험 관리 → 관리자 대시보드 링크 보기]에서 받은 링크로 들어와 주세요.</p></div>';
  }
  function errorScreen() {
    return '<div class="sec-intro"><p class="eyebrow">일경험 관리자 대시보드</p><h2>불러오지 못했어요</h2>' +
      '<p class="muted">' + e(S.err || "잠시 뒤 다시 열어 주세요.") + '</p>' +
      '<button class="btn btn-primary btn-block" onclick="location.reload()">다시 시도하기</button></div>';
  }

  function planChip(status) {
    if (!status) return '<span class="chip muted">계획서 미제출</span>';
    const cls = status === "승인" ? "ok" : status === "반려" ? "watch" : "info";
    return '<span class="chip ' + cls + '">계획서 ' + e(status) + '</span>';
  }

  function participantRow(p) {
    return '<div class="coach-card">' +
      '<div class="coach-top"><b>' + e(p.code) + ' · ' + e(p.name) + '</b>' +
      '<span class="chip ' + (p.met ? "ok" : "watch") + '">' + p.thisWeekHours + 'h / ' + p.weeklyMinHours + 'h' + (p.met ? " 충족" : "") + '</span></div>' +
      '<div class="coach-meta">사업: ' + e(p.biz || "미분류") + ' · 코치: ' + e(p.coach || "—") + ' · 단계: ' + e(p.stage) + (p.pendingCount ? ' · 인증 대기 ' + p.pendingCount + '건' : '') + '</div>' +
      '<div class="coach-meta">누적 활동 ' + p.cumulativeHours + '시간 · 누적 지급액 ' + won(p.cumulativeAmount) + '</div>' +
      '<div class="coach-meta">연락처: ' + e(p.phone || "—") + ' · 상태: ' + e(p.status) + '</div>' +
      planChip(p.planStatus) + planBlock(p) + pendingBlock(p) +
      '<div><button class="btn btn-ghost btn-sm" data-sendlink="' + e(p.code) + '" data-who="part">참여자 링크 문자 보내기</button></div>' +
      '</div>';
  }

  // 2026-11-23: 관리자가 이 화면에서 바로 계획서 승인/반려와 출퇴근 기록 인증을 할 수 있어요
  function planBlock(p) {
    const pl = p.plan;
    if (!pl) return "";
    let h = '<details class="plan-block"' + (pl.status === "대기" ? " open" : "") + '><summary>계획서 보기</summary>' +
      '<div class="coach-meta">목표: ' + e(pl.goal) + '</div>' +
      '<div class="coach-meta">기간: ' + e(pl.startDate) + ' ~ ' + e(pl.endDate) + ' · 주 ' + e(pl.weeklyHours) + '시간 · 장소: ' + e(pl.location) + '</div>' +
      '<div class="coach-meta">활동 내용: ' + e(pl.content) + '</div>' +
      (pl.comment ? '<div class="coach-meta">코멘트: ' + e(pl.comment) + '</div>' : '');
    if (pl.status === "대기" || pl.status === "반려") {
      h += '<textarea id="cm-' + e(p.code) + '" placeholder="코멘트(반려할 때는 사유를 꼭 적어 주세요)"></textarea>' +
        '<div style="display:flex;gap:6px;margin-top:6px">' +
        '<button class="btn btn-primary btn-sm" data-plan="승인" data-code="' + e(p.code) + '">계획서 승인</button>' +
        '<button class="btn btn-ghost btn-sm" data-plan="반려" data-code="' + e(p.code) + '">반려</button></div>';
    }
    return h + '</details>';
  }
  function pendingBlock(p) {
    if (!p.pending || !p.pending.length) return "";
    return '<details class="plan-block" open><summary>출퇴근 기록 인증 대기 ' + p.pending.length + '건</summary>' +
      p.pending.map(c => '<div class="coach-meta" style="border-top:1px solid var(--line);padding-top:6px;margin-top:6px">' +
        '<b>' + e(c.date) + '</b> ' + e(c.type) + ' · ' + e(c.timeIn) + '~' + e(c.timeOut) + ' (' + e(c.hours) + '시간)' +
        (c.place ? ' · ' + e(c.place) : '') + (c.mood ? ' · 기분: ' + e(c.mood) : '') +
        (c.job ? '<br>직무: ' + e(c.job) : '') + (c.note ? '<br>소감: ' + e(c.note) : '') +
        (c.photo ? '<br><a href="' + e(c.photo) + '" target="_blank" rel="noopener">사진 보기</a>' : '') +
        '<br><button class="btn btn-primary btn-sm" style="margin-top:4px" data-checkin="' + c.rowIndex + '" data-code="' + e(p.code) + '" data-date="' + e(c.date) + '">인증</button>' +
        ' <button class="btn btn-ghost btn-sm" style="margin-top:4px" data-reject="' + c.rowIndex + '" data-code="' + e(p.code) + '" data-date="' + e(c.date) + '">반려</button></div>').join("") +
      '</details>';
  }
  const ERR_ = { missing_comment: "반려할 때는 사유를 적어 주세요.", no_plan: "계획서를 찾지 못했어요.", changed: "그 사이 기록이 바뀌었어요. 새로고침해 주세요.", forbidden: "관리자 토큰이 맞지 않아요." };
  app.addEventListener("click", async ev => {
    const b = ev.target.closest("button[data-plan], button[data-checkin], button[data-reject]");
    if (!b) return;
    const code = b.dataset.code;
    let payload;
    if (b.dataset.plan) {
      const cm = document.getElementById("cm-" + code);
      if (b.dataset.plan === "승인" && !confirm(code + " 계획서를 승인할까요? 승인하면 단계가 '일경험 진행'으로 넘어가요.")) return;
      payload = { action: "adminReviewPlan", token, code: code, decision: b.dataset.plan, comment: cm ? cm.value : "" };
    } else if (b.dataset.reject) {
      // 반려 사유는 참여자 앱에 그대로 보여요
      const reason = prompt(code + " " + b.dataset.date + " 기록을 반려할게요. 참여자가 다시 작성할 수 있게 사유를 적어 주세요.");
      if (reason === null) return;
      payload = { action: "adminRejectCheckin", token, code: code, rowIndex: Number(b.dataset.reject), date: b.dataset.date, reason: reason };
    } else {
      payload = { action: "adminApproveCheckin", token, code: code, rowIndex: Number(b.dataset.checkin), date: b.dataset.date };
    }
    b.disabled = true; const label = b.textContent; b.textContent = "처리 중…";
    try {
      const r = await api(payload);
      if (!r.ok) { alert(ERR_[r.error] || ("처리하지 못했어요: " + r.error)); b.disabled = false; b.textContent = label; return; }
      await load(); // 최신 상태로 다시 그려요
    } catch (err) { alert("처리하지 못했어요. 잠시 뒤 다시 시도해 주세요."); b.disabled = false; b.textContent = label; }
  });

  // 2026-11-27: 마음살피기 관리자 화면처럼 좌측 사이드바(검색·사업·상태·목록) + 우측 본문. 시트 [일경험 관리] 메뉴 기능도 대시보드에 모았어요.
  const $ = id => document.getElementById(id);
  function matches(p) {
    const q = S.q.trim();
    const inF = S.filter === "전체" || p.status === S.filter;
    const inB = !S.biz || p.biz === S.biz;
    return inF && inB && (!q || String(p.name).indexOf(q) >= 0 || String(p.code).indexOf(q) >= 0);
  }
  function renderSide() {
    if (!S.data) return;
    const d = S.data, ps = d.participants;
    const bizs = Array.from(new Set((d.bizList && d.bizList.length ? d.bizList : ["도봉구", "용인시", "미래내일일경험", "갭이어"]).concat(ps.map(p => p.biz).filter(Boolean))));
    $("bizFilter").innerHTML = ['<option value="">전체 사업</option>'].concat(bizs.map(b => '<option value="' + e(b) + '"' + (b === S.biz ? " selected" : "") + '>' + e(b) + '</option>')).join("");
    const cnt = st => st === "전체" ? ps.length : ps.filter(p => p.status === st).length;
    $("filters").innerHTML = ["진행중", "전체", "중단", "완료"].map(f => '<button data-f="' + f + '" class="' + (f === S.filter ? "on" : "") + '">' + f + " " + cnt(f) + '</button>').join("");
    $("dashBtn").textContent = S.code ? "← 대시보드" : "대시보드";
    $("list").innerHTML = ps.filter(matches).map(p =>
      '<div class="p-item' + (p.code === S.code ? " on" : "") + '" data-code="' + e(p.code) + '"><b>' + e(p.code) + '</b> ' + e(p.name) +
      (p.pendingCount || p.planStatus === "대기" ? ' <span class="p-warn">●</span>' : "") +
      '<span class="p-meta">' + e(p.biz || "미분류") + " · " + e(p.stage) + " · " + p.thisWeekHours + "/" + p.weeklyMinHours + "h" + (p.coach ? " · 코치 " + e(p.coach) : "") + '</span></div>').join("") ||
      '<div class="empty" style="padding:12px">해당하는 참여자가 없어요.</div>';
  }
  $("search").addEventListener("input", ev => { S.q = ev.target.value; renderSide(); });
  $("bizFilter").addEventListener("change", ev => { S.biz = ev.target.value; renderSide(); });
  $("filters").addEventListener("click", ev => { const b = ev.target.closest("button[data-f]"); if (b) { S.filter = b.dataset.f; renderSide(); } });
  $("dashBtn").addEventListener("click", () => { S.code = null; render(); });
  $("list").addEventListener("click", ev => { const it = ev.target.closest(".p-item"); if (it) { S.code = it.dataset.code; render(); $("main").scrollTop = 0; } });

  function rosterTable(rows) {
    if (!rows.length) return '<p class="empty">해당하는 참여자가 없어요. (사이드바 상태·사업 필터를 확인해 주세요)</p>';
    return '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:13px"><tr style="text-align:left;color:var(--muted)"><th>참여번호</th><th>이름</th><th>사업</th><th>단계</th><th>코치</th><th>이번 주</th><th>계획서</th></tr>' +
      rows.map(p => '<tr style="border-top:1px solid var(--line)"><td>' + e(p.code) + '</td><td><a href="#" data-open="' + e(p.code) + '"><b>' + e(p.name) + '</b></a></td><td>' + e(p.biz || "미분류") + '</td><td>' + e(p.stage) + '</td><td>' + e(p.coach || "—") + '</td>' +
        '<td>' + p.thisWeekHours + '/' + p.weeklyMinHours + 'h' + (p.met ? " ✓" : "") + '</td><td>' + e(p.planStatus || "미제출") + '</td></tr>').join("") + '</table></div>';
  }
  function dashboard() {
    const d = S.data;
    if (S.code) {
      const p = d.participants.find(x => x.code === S.code);
      if (p) return '<div class="brand"><b>' + e(p.name) + ' 님</b><span>' + e(d.weekStart) + ' 주 시작 기준</span></div>' + participantRow(p);
    }
    const active = d.participants.filter(p => p.status === "진행중");
    const stageCards = STAGES.map(s => '<div class="card"><b>' + active.filter(p => p.stage === s).length + '</b><span>' + e(s) + '</span></div>').join("");
    const shown = d.participants.filter(matches);
    const todo = active.filter(p => p.pendingCount || p.planStatus === "대기");
    const todoRows = todo.length ? todo.map(p => '<div class="coach-meta"><a href="#" data-open="' + e(p.code) + '"><b>' + e(p.code) + ' ' + e(p.name) + '</b></a> — ' +
      (p.planStatus === "대기" ? "계획서 승인 대기 " : "") + (p.pendingCount ? "출퇴근 인증 대기 " + p.pendingCount + "건" : "") + '</div>').join("") : '<p class="empty">지금 처리할 일이 없어요.</p>';
    const coaches = d.coaches || [];
    const coachOpts = ['<option value="">담당 코치(나중에 정해도 돼요)</option>'].concat(coaches.map(c => '<option value="' + e(c.name) + '">' + e(c.name) + '</option>')).join("");
    return '<div class="brand"><b>일경험 관리자 대시보드</b><span>' + e(d.weekStart) + ' 주 시작 기준 · 진행중 ' + active.length + '명</span></div>' +
      '<div class="stat-cards" style="margin-top:12px">' + stageCards + '</div>' +
      '<h2 class="sec-h">지금 처리할 일 (' + todo.length + '명)</h2><div class="coach-card">' + todoRows + '</div>' +
      '<h2 class="sec-h">참여자 현황 (' + shown.length + '명 · 사이드바 필터 기준)</h2>' + rosterTable(shown) +
      '<h2 class="sec-h">집체코칭 출석</h2>' + attendSection() +
      '<h2 class="sec-h">관리 작업 (시트 [일경험 관리] 메뉴와 같아요)</h2>' +
      '<div class="coach-card"><b>참여자 추가</b><div class="coach-meta">마음살피기 참여번호를 그대로 넣어 주세요. 마음살피기 승인으로 이미 올라온 분은 목록에서 [링크 문자 보내기]를 쓰면 돼요.</div>' +
      '<div class="form-row"><input id="np-code" placeholder="참여번호(예: YI26-003)"><input id="np-name" placeholder="이름"><input id="np-phone" placeholder="연락처(01012345678)"><select id="np-coach">' + coachOpts + '</select></div>' +
      '<div class="form-row"><label><input type="checkbox" id="np-send" checked> 추가하면서 링크 문자 보내기</label><button class="btn btn-primary btn-sm" data-addp="1">참여자 추가</button></div></div>' +
      '<div class="coach-card" style="margin-top:10px"><b>코치</b>' +
      (coaches.length ? coaches.map(c => '<div class="coach-meta">' + e(c.name) + ' · ' + e(c.phone || "—") + ' <button class="btn btn-ghost btn-sm" data-sendlink="' + e(c.name) + '" data-who="coach">코치 링크 문자 보내기</button></div>').join("") : '<p class="empty">등록된 코치가 없어요.</p>') +
      '<div class="form-row"><input id="nc-name" placeholder="코치 이름"><input id="nc-phone" placeholder="연락처"><label><input type="checkbox" id="nc-send" checked> 문자 보내기</label><button class="btn btn-primary btn-sm" data-addc="1">코치 추가</button></div></div>' +
      '<div class="coach-card" style="margin-top:10px"><b>이번 달 보상금 계산</b><div class="coach-meta">인증된 출퇴근 기록으로 이번 달 지급 예정 줄을 만들어요. 이미 지급완료인 줄은 건드리지 않아요.</div>' +
      '<div><button class="btn btn-primary btn-sm" data-calc="1">이번 달 보상금 계산하기</button></div></div>' +
      '<div class="coach-card" style="margin-top:10px"><b>문자 발송 설정 (솔라피)</b><div class="coach-meta" id="sms-status">확인 중…</div>' +
      '<div class="form-row"><input id="sms-key" placeholder="API Key"><input id="sms-secret" type="password" placeholder="API Secret"><input id="sms-sender" placeholder="발신번호(0222471091)"><button class="btn btn-primary btn-sm" data-smssave="1">저장</button></div></div>' +
      '<div class="act-msg" id="act-msg"></div>';
  }
  async function loadSmsStatus() {
    try { const r = await api({ action: "adminSmsStatus", token }); const el = $("sms-status"); if (el) el.textContent = !r.ok ? "확인하지 못했어요" : r.ready ? "설정됨 (발신번호 " + r.sender + ")" : "아직 설정 안 됨"; } catch (err) {}
  }
  const MENU_ERR = { missing_fields: "빈 칸이 있어요.", duplicate: "이미 등록된 분이에요.", not_found: "대상을 찾지 못했어요.", forbidden: "관리자 토큰이 맞지 않아요.", busy: "다른 작업 중이에요. 잠시 뒤 다시 눌러 주세요." };
  function linkResult(r) { return (r.sent ? "문자로 링크를 보냈어요." : "문자를 못 보냈어요 (" + (r.smsError || "") + ") — 아래 링크를 직접 전달해 주세요.") + "\n" + r.link; }
  app.addEventListener("click", async ev => {
    const o = ev.target.closest("a[data-open]");
    if (o) { ev.preventDefault(); S.code = o.dataset.open; render(); $("main").scrollTop = 0; return; }
    const b = ev.target.closest("button[data-addp], button[data-addc], button[data-sendlink], button[data-calc], button[data-smssave]");
    if (!b) return;
    const v = id => ($(id) ? $(id).value.trim() : "");
    let payload, done;
    if (b.dataset.addp) {
      if (!v("np-code") || !v("np-name") || !v("np-phone")) { alert("참여번호·이름·연락처를 입력해 주세요."); return; }
      payload = { action: "adminAddParticipant", token, code: v("np-code"), name: v("np-name"), phone: v("np-phone"), coach: v("np-coach"), send: $("np-send").checked };
      done = r => "추가했어요. " + v("np-code") + "\n" + linkResult(r);
    } else if (b.dataset.addc) {
      if (!v("nc-name") || !v("nc-phone")) { alert("코치 이름과 연락처를 입력해 주세요."); return; }
      payload = { action: "adminAddCoach", token, name: v("nc-name"), phone: v("nc-phone"), send: $("nc-send").checked };
      done = r => "추가했어요.\n" + linkResult(r);
    } else if (b.dataset.sendlink) {
      if (!confirm((b.dataset.who === "coach" ? "코치" : "참여자") + " " + b.dataset.sendlink + " 에게 링크 문자를 보낼까요?")) return;
      payload = { action: "adminSendLink", token, who: b.dataset.who, key: b.dataset.sendlink };
      done = linkResult;
    } else if (b.dataset.calc) {
      if (!confirm("이번 달 보상금을 계산할까요?")) return;
      payload = { action: "adminCalcPay", token };
      done = r => "이번 달(" + r.ym + ") 계산 완료 — 새로 만든 줄 " + r.made + "건, 수정 " + r.updated + "건, 지급완료라 건드리지 않은 줄 " + r.skipped + "건";
    } else {
      if (!v("sms-key") || !v("sms-secret") || !v("sms-sender")) { alert("세 칸 모두 입력해 주세요."); return; }
      payload = { action: "adminSmsSettings", token, key: v("sms-key"), secret: v("sms-secret"), sender: v("sms-sender") };
      done = () => "저장했어요.";
    }
    b.disabled = true; const label = b.textContent; b.textContent = "처리 중…";
    try {
      const r = await api(payload);
      b.disabled = false; b.textContent = label;
      if (!r.ok) { alert(MENU_ERR[r.error] || ("처리하지 못했어요: " + r.error)); return; }
      alert(done(r));
      if (b.dataset.addp || b.dataset.addc) await load(); else if (b.dataset.smssave) loadSmsStatus();
    } catch (err) { b.disabled = false; b.textContent = label; alert("처리하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
  });

  // ───── 2026-11-27 집체코칭 출석 확인 ─────
  // 참여자가 앱에서 날짜·회차를 고르고 서명하면 여기 올라와요. 참석을 확인(체크)하고 저장하면 명부 PDF가 사업 폴더에 저장돼요.
  function attendGroups() {
    const rows = (S.att && S.att.rows) || [], map = {};
    rows.forEach(r => { const k = r.biz + "|" + r.date + "|" + r.round; (map[k] = map[k] || { biz: r.biz, date: r.date, round: r.round, rows: [] }).rows.push(r); });
    return Object.keys(map).map(k => map[k]).sort((x, y) => (y.date + y.round).localeCompare(x.date + x.round));
  }
  function attendSection() {
    if (!S.att) return '<div class="coach-card"><b>집체코칭 출석 확인</b><div class="coach-meta">불러오는 중…</div></div>';
    if (S.att.failed) return '<div class="coach-card"><b>집체코칭 출석 확인</b><div class="coach-meta">불러오지 못했어요. (Apps Script가 최신 버전으로 배포됐는지 확인해 주세요.) <button class="btn btn-ghost btn-sm" data-attretry="1">다시 불러오기</button></div></div>';
    const gs = attendGroups();
    let h = '<div class="coach-card" style="border:2px solid var(--accent,#5b7)"><div class="coach-top"><b>집체코칭 출석 확인</b></div>' +
      '<div class="coach-meta">참여자가 일경험 앱에서 날짜·회차를 고르고 서명하면 아래에 나타나요. 참석한 분을 체크하고 저장하면 명부 PDF가 사업 폴더에 저장돼요.</div>';
    if (!gs.length) h += '<p class="empty">아직 서명한 사람이 없어요.</p>';
    gs.forEach((g, gi) => {
      const conf = g.rows.filter(r => r.confirmed).length;
      h += '<details class="plan-block"' + (gi === 0 ? " open" : "") + '><summary>' + e(g.date) + ' · ' + e(g.biz) + ' · ' + g.round + '회차' + (g.round === 1 ? " (오리엔테이션)" : "") +
        ' — 서명 ' + g.rows.length + '명 / 확인 ' + conf + '명</summary>' +
        '<div class="coach-meta"><button class="btn btn-ghost btn-sm" data-allchk="' + gi + '">전체 선택</button></div>' +
        g.rows.map(r => '<div class="coach-meta"><label><input type="checkbox" data-chk="' + gi + '" data-row="' + r.rowIndex + '"' + (r.confirmed ? " checked" : "") + '> <b>' + e(r.name) + '</b></label> ' +
          '<span class="muted">' + e(r.at) + ' 서명</span> <button class="btn btn-ghost btn-sm" data-adel="' + r.rowIndex + '" data-name="' + e(r.name) + '" data-date="' + e(r.date) + '" data-round="' + r.round + '">삭제</button></div>').join("") +
        '<button class="btn btn-primary btn-sm" style="margin-top:8px" data-asave="' + gi + '">참석 확인 저장 · 명부 PDF 만들기</button></details>';
    });
    return h + '</div>';
  }
  async function loadAtt() { try { const r = await api({ action: "adminAttendList", token }); S.att = r.ok ? r : { rows: [], failed: true }; } catch (err) { S.att = { rows: [], failed: true }; } }
  app.addEventListener("click", async ev => { if (ev.target.closest("button[data-attretry]")) { S.att = null; render(); await loadAtt(); render(); } });
  const ATT_ERR = { changed: "그 사이 기록이 바뀌었어요. 새로고침해 주세요.", none_confirmed: "참석 확인된 사람이 없어요.", forbidden: "관리자 토큰이 맞지 않아요.", missing_field: "빈 칸이 있어요." };
  app.addEventListener("click", async ev => {
    const b = ev.target.closest("button[data-allchk], button[data-asave], button[data-adel]");
    if (!b) return;
    if (b.dataset.allchk != null) { document.querySelectorAll('input[data-chk="' + b.dataset.allchk + '"]').forEach(c => { c.checked = true; }); return; }
    let payload;
    const gs = attendGroups();
    if (b.dataset.adel) {
      if (!confirm(b.dataset.name + " 님의 서명을 삭제할까요? (참여자가 다시 서명할 수 있게 돼요)")) return;
      payload = { action: "adminAttendDelete", token, rowIndex: Number(b.dataset.adel), name: b.dataset.name, date: b.dataset.date, round: Number(b.dataset.round) };
    } else {
      const g = gs[Number(b.dataset.asave)];
      const items = Array.from(document.querySelectorAll('input[data-chk="' + b.dataset.asave + '"]')).map(c => {
        const r = g.rows.find(x => x.rowIndex === Number(c.dataset.row));
        return { rowIndex: r.rowIndex, name: r.name, date: r.date, round: r.round, confirmed: c.checked };
      });
      if (!items.some(i => i.confirmed)) { alert("참석한 분을 한 명 이상 체크해 주세요."); return; }
      b.disabled = true; b.textContent = "저장 중(10~20초)…";
      try {
        const r1 = await api({ action: "adminAttendConfirm", token, items });
        if (!r1.ok) { alert(ATT_ERR[r1.error] || ("저장하지 못했어요: " + r1.error)); await loadAtt(); render(); return; }
        const r2 = await api({ action: "adminAttendPdf", token, biz: g.biz, date: g.date, round: g.round });
        if (!r2.ok) alert("참석 확인은 저장했지만 PDF는 만들지 못했어요: " + (ATT_ERR[r2.error] || r2.error));
        else alert("저장했어요. (" + r2.count + "명 · 폴더: 일경험/연도/" + r2.folder + ")");
      } catch (err) { alert("처리하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
      await loadAtt(); render(); return;
    }
    b.disabled = true;
    try {
      const r = await api(payload);
      if (!r.ok) { alert(ATT_ERR[r.error] || ("처리하지 못했어요: " + r.error)); b.disabled = false; return; }
      await loadAtt(); render();
    } catch (err) { alert("처리하지 못했어요. 잠시 뒤 다시 시도해 주세요."); b.disabled = false; }
  });

  function render() {
    let body;
    if (S.screen === "loading") body = '<div class="sec-intro"><p class="eyebrow">일경험 관리자 대시보드</p><h2>불러오는 중…</h2></div>';
    else if (S.screen === "no-token") body = noTokenScreen();
    else if (S.screen === "error") body = errorScreen();
    else body = dashboard();
    app.innerHTML = body;
    renderSide();
    if (S.screen === "ready" && !S.code) loadSmsStatus();
  }

  async function load() {
    try {
      if (DEMO) {
        S.data = { weekStart: "2026-01-01", participants: [] };
      } else {
        const r = await api({ action: "adminStatus", token });
        if (!r.ok) throw new Error(r.error || "fail");
        S.data = r;
      }
      S.screen = "ready"; render();
      loadAtt().then(render);
    } catch (err) {
      S.err = err.message === "forbidden"
        ? "관리자 토큰이 맞지 않아요. 시트 메뉴 [일경험 관리 → 관리자 대시보드 링크 보기]의 t= 뒤 값을 다시 넣어 주세요."
        : "불러오지 못했어요. 잠시 뒤 다시 시도해 주세요."; S.screen = "error"; render();
    }
  }

  if (!token) { S.screen = "no-token"; render(); }
  else { render(); load(); }
})();
