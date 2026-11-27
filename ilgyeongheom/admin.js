(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycby3FN9AR9b-2Q8Kzj0vmMtEIFqGLE0Vlq8LJA19VaavcNEfk2hpd2vXBKuMvw5_Us7SyA/exec";
  const DEMO = !API_URL;

  const qs = new URLSearchParams(location.search);
  const token = qs.get("t") || "";
  const app = document.getElementById("app");
  const e = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const won = n => new Intl.NumberFormat("ko-KR").format(Math.round(n || 0)) + "원";

  const S = { screen: "loading", data: null };

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
      planChip(p.planStatus) + planBlock(p) + pendingBlock(p) +
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

  // 2026-11-24: 사업별로 걸러 보기 — 목록은 마음살피기 [사업목록](허브 [사업 관리])을 따라가요
  function dashboard() {
    const d = S.data;
    const bizs = Array.from(new Set((d.bizList && d.bizList.length ? d.bizList : ["도봉구", "용인시", "미래내일일경험", "갭이어"]).concat(d.participants.map(p => p.biz).filter(Boolean))));
    const cur = S.biz || "";
    const shown = d.participants.filter(p => !cur || p.biz === cur);
    const sel = '<select id="bizSel" style="font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--line);margin:0 0 12px">' +
      ['<option value="">전체 사업</option>'].concat(bizs.map(b => '<option value="' + e(b) + '"' + (b === cur ? " selected" : "") + '>' + e(b) + '</option>')).join("") + '</select>';
    const rows = shown.length ? shown.map(participantRow).join("") : '<p class="empty">진행중인 참여자가 없어요.</p>';
    return '<div class="brand"><b>일경험 관리자 대시보드</b><span>' + e(d.weekStart) + ' 주 시작 기준</span></div>' + attendSection() + sel + rows;
  }
  app.addEventListener("change", ev => { if (ev.target.id === "bizSel") { S.biz = ev.target.value; render(); } });

  // ───── 2026-11-27 집체코칭 출석 확인 ─────
  // 참여자가 앱에서 날짜·회차를 고르고 서명하면 여기 올라와요. 참석을 확인(체크)하고 저장하면 명부 PDF가 사업 폴더에 저장돼요.
  function attendGroups() {
    const rows = (S.att && S.att.rows) || [], map = {};
    rows.forEach(r => { const k = r.biz + "|" + r.date + "|" + r.round; (map[k] = map[k] || { biz: r.biz, date: r.date, round: r.round, rows: [] }).rows.push(r); });
    return Object.keys(map).map(k => map[k]).sort((x, y) => (y.date + y.round).localeCompare(x.date + x.round));
  }
  function attendSection() {
    if (!S.att) return '<div class="coach-card"><b>집체코칭 출석 확인</b><div class="coach-meta">불러오는 중…</div></div>';
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
  async function loadAtt() { try { const r = await api({ action: "adminAttendList", token }); if (r.ok) S.att = r; } catch (err) {} }
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
