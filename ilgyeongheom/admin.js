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

  // ───── 2026-11-27 집체코칭 출석 전자서명 ─────
  const todayStr = () => { const d = new Date(Date.now() + 9 * 3600e3); return d.toISOString().slice(0, 10); };
  function curSession() {
    const a = S.att; if (!a || !a.sessions.length) return null;
    return a.sessions.find(x => x.id === S.sid) || a.sessions.find(x => x.status === "진행중") || a.sessions[0];
  }
  function attendSection() {
    const a = S.att;
    if (!a) return '<div class="coach-card"><b>집체코칭 출석</b><div class="coach-meta">불러오는 중…</div></div>';
    const ses = curSession();
    const bizs = Array.from(new Set((S.data.bizList && S.data.bizList.length ? S.data.bizList : ["도봉구", "용인시"])));
    let h = '<div class="coach-card" style="border:2px solid var(--accent,#5b7)"><div class="coach-top"><b>집체코칭 출석 · 전자서명</b></div>';
    if (a.sessions.length) {
      h += '<select id="sesSel" style="font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--line);margin:4px 0">' +
        a.sessions.map(x => '<option value="' + e(x.id) + '"' + (ses && x.id === ses.id ? " selected" : "") + '>' + e(x.date) + ' · ' + e(x.biz) + ' · ' + e(x.title) + (x.status === "마감" ? " (마감)" : "") + '</option>').join("") + '</select>';
    }
    if (ses) {
      const mine = a.attendance.filter(r => r.sid === ses.id);
      h += '<div class="coach-meta">서명 ' + mine.length + '명' + (ses.status === "마감" ? " · 마감됨" : "") + '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">' +
        (ses.status === "마감" ? '<button class="btn btn-ghost btn-sm" data-ses="reopen">다시 열기</button>' :
          '<button class="btn btn-primary" data-ses="qr">📋 현장 코드 · 출석 현황</button> <button class="btn btn-ghost btn-sm" data-ses="sign">링크 없는 분 서명(관리자 기기)</button>') +
        '<button class="btn btn-ghost btn-sm" data-ses="pdf">명부 PDF 저장</button>' +
        (ses.status !== "마감" ? '<button class="btn btn-ghost btn-sm" data-ses="close">마감</button>' : "") + '</div>' +
        (ses.pdf ? '<div class="coach-meta"><a href="' + e(ses.pdf) + '" target="_blank" rel="noopener">저장된 명부 PDF 열기</a></div>' : "") +
        (mine.length ? '<details class="plan-block"><summary>서명한 사람 보기</summary>' + mine.map(r =>
          '<div class="coach-meta">' + e(r.name) + (r.kind === "신규" ? ' <span class="chip info">명단에 없음</span>' : '') + ' · ' + e(r.at) + ' <button class="btn btn-ghost btn-sm" data-sdel="' + r.rowIndex + '" data-name="' + e(r.name) + '">삭제</button></div>').join("") + '</details>' : "");
    }
    h += '<details class="plan-block"' + (ses ? "" : " open") + '><summary>새 회차 만들기</summary>' +
      '<input id="newTitle" placeholder="회차 이름 (예: 집체코칭 1회 (오리엔테이션))" value="집체코칭 1회 (오리엔테이션)" style="width:100%;box-sizing:border-box;margin:6px 0;padding:7px;font:inherit;border:1px solid var(--line);border-radius:8px">' +
      '<input id="newDate" type="date" value="' + todayStr() + '" style="padding:7px;font:inherit;border:1px solid var(--line);border-radius:8px"> ' +
      '<select id="newBiz" style="font:inherit;padding:7px;border-radius:8px;border:1px solid var(--line)">' + bizs.map(b => '<option>' + e(b) + '</option>').join("") + '</select> ' +
      '<button class="btn btn-primary btn-sm" data-ses="create">만들기</button></details></div>';
    return h;
  }
  // 참여자는 개인 링크 앱에서 서명해요. 이 화면은 현장에서 알려 줄 '현장 코드'와 서명 현황을 보여줘요.
  function qrScreen() {
    const ses = curSession();
    const mine = S.att.attendance.filter(r => r.sid === ses.id);
    return '<div style="text-align:center"><div class="brand"><b>' + e(ses.title) + '</b><span>' + e(ses.date) + '</span></div>' +
      '<p style="font-size:18px;margin:8px 0">참여자는 받은 일경험 앱 링크를 열어 [집단코칭 참여]에서 서명해요</p>' +
      '<p class="muted" style="margin:10px 0 0">현장 코드 (참여자에게 말로 알려 주세요)</p>' +
      '<div style="font-size:64px;font-weight:700;letter-spacing:8px">' + e(ses.onsite) + '</div>' +
      '<p style="margin:12px 0 4px"><b>서명 ' + mine.length + '명</b></p>' +
      '<div style="text-align:left;max-width:360px;margin:0 auto">' + (mine.length ? mine.map(r => '<div class="coach-meta">✓ ' + e(r.name) + (r.kind === "현장" ? ' <span class="muted">(관리자 기기)</span>' : '') + ' · ' + e(r.at) + '</div>').join("") : '<span class="muted">아직 없어요</span>') + '</div>' +
      '<div style="display:flex;gap:8px;justify-content:center;margin-top:12px"><button class="btn btn-ghost" data-ses="qrrefresh">서명 현황 새로고침</button><button class="btn btn-primary" data-ses="back">← 돌아가기</button></div></div>';
  }
  function signScreen() {
    const ses = curSession();
    const signed = new Set(S.att.attendance.filter(r => r.sid === ses.id).map(r => r.name));
    const list = S.data.participants.filter(p => p.biz === ses.biz);
    const rest = S.data.participants.filter(p => p.biz !== ses.biz);
    const btn = p => '<button class="btn ' + (signed.has(p.name) ? "btn-ghost" : "btn-primary") + '" style="margin:4px;min-width:96px;font-size:17px" data-who="' + e(p.name) + '" data-wcode="' + e(p.code) + '">' + e(p.name) + (signed.has(p.name) ? " ✓" : "") + '</button>';
    return '<div class="brand"><b>출석 서명</b><span>' + e(ses.title) + ' · ' + e(ses.date) + '</span></div>' +
      '<p class="muted">본인 이름을 눌러 서명해 주세요. (✓ = 서명 완료, 다시 누르면 다시 서명)</p>' +
      '<div>' + (list.length ? list.map(btn).join("") : '<span class="muted">' + e(ses.biz) + ' 참여자가 아직 등록되지 않았어요. 아래에 이름을 직접 입력해 주세요.</span>') + '</div>' +
      (rest.length ? '<details class="plan-block"><summary>다른 사업 참여자</summary>' + rest.map(btn).join("") + '</details>' : "") +
      '<div style="margin:12px 0"><input id="manualName" placeholder="명단에 없으면 이름 직접 입력" style="padding:9px;font:inherit;border:1px solid var(--line);border-radius:8px"> ' +
      '<button class="btn btn-ghost" data-who-manual="1">서명하기</button></div>' +
      '<button class="btn btn-ghost btn-block" data-ses="back">← 돌아가기</button>';
  }
  function padScreen() {
    return '<div class="brand"><b>' + e(S.who.name) + '님 서명</b></div>' +
      '<p class="muted">아래 칸에 손가락으로 서명해 주세요.</p>' +
      '<canvas id="pad" style="width:100%;height:220px;border:2px dashed #888;border-radius:10px;background:#fff;touch-action:none"></canvas>' +
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-ghost" id="padClear">지우기</button>' +
      '<button class="btn btn-primary" id="padOk" style="flex:1">서명 완료</button><button class="btn btn-ghost" id="padCancel">취소</button></div><p id="padMsg" class="muted"></p>';
  }
  function setupPad() {
    const cv = document.getElementById("pad"); if (!cv) return;
    const r = window.devicePixelRatio || 1;
    cv.width = Math.round(cv.clientWidth * r); cv.height = Math.round(cv.clientHeight * r);
    const c = cv.getContext("2d"); c.lineWidth = 3 * r; c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = "#111";
    let drawing = false, signed = false;
    const pos = ev => { const b = cv.getBoundingClientRect(); return [(ev.clientX - b.left) * cv.width / b.width, (ev.clientY - b.top) * cv.height / b.height]; };
    cv.addEventListener("pointerdown", ev => { drawing = true; cv.setPointerCapture(ev.pointerId); c.beginPath(); c.moveTo.apply(c, pos(ev)); });
    cv.addEventListener("pointermove", ev => { if (!drawing) return; c.lineTo.apply(c, pos(ev)); c.stroke(); signed = true; });
    ["pointerup", "pointercancel"].forEach(t => cv.addEventListener(t, () => { drawing = false; }));
    document.getElementById("padClear").onclick = () => { c.clearRect(0, 0, cv.width, cv.height); signed = false; };
    document.getElementById("padCancel").onclick = () => { S.screen = "sign"; render(); };
    document.getElementById("padOk").onclick = async () => {
      const msg = document.getElementById("padMsg");
      if (!signed) { msg.textContent = "서명을 해 주세요."; return; }
      // 서명 둘레의 빈 곳을 잘라내고 폭 400px 이하로 줄여요(투명 PNG)
      const d = c.getImageData(0, 0, cv.width, cv.height).data; let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const w = x1 - x0 + 1, h = y1 - y0 + 1, k = Math.min(1, 400 / w);
      const out = document.createElement("canvas"); out.width = Math.max(1, Math.round(w * k)); out.height = Math.max(1, Math.round(h * k));
      out.getContext("2d").drawImage(cv, x0, y0, w, h, 0, 0, out.width, out.height);
      const b = document.getElementById("padOk"); b.disabled = true; b.textContent = "저장 중…"; msg.textContent = "";
      try {
        const res = await api({ action: "adminSign", token, sid: curSession().id, code: S.who.code, name: S.who.name, signData: out.toDataURL("image/png") });
        if (!res.ok) { msg.textContent = (ATT_ERR[res.error] || "저장하지 못했어요: " + res.error); b.disabled = false; b.textContent = "서명 완료"; return; }
        await loadAtt(); S.screen = "sign"; render();
      } catch (err) { msg.textContent = "저장하지 못했어요. 다시 눌러 주세요."; b.disabled = false; b.textContent = "서명 완료"; }
    };
  }
  const ATT_ERR = { closed: "이 회차는 마감됐어요.", bad_sign: "서명 이미지가 올바르지 않아요.", missing_field: "빈 칸이 있어요.", no_session: "회차를 찾지 못했어요.", forbidden: "관리자 토큰이 맞지 않아요.", changed: "그 사이 기록이 바뀌었어요. 새로고침해 주세요." };
  async function loadAtt() { try { const r = await api({ action: "adminSessionList", token }); if (r.ok) S.att = r; } catch (err) {} }
  app.addEventListener("change", ev => { if (ev.target.id === "sesSel") { S.sid = ev.target.value; render(); } });
  app.addEventListener("click", async ev => {
    const b = ev.target.closest("button[data-ses], button[data-sdel], button[data-who], button[data-who-manual]");
    if (!b) return;
    const ses = curSession();
    if (b.dataset.who) { S.who = { name: b.dataset.who, code: b.dataset.wcode }; S.screen = "pad"; render(); return; }
    if (b.dataset.whoManual) {
      const n = (document.getElementById("manualName").value || "").trim();
      if (!n) { alert("이름을 입력해 주세요."); return; }
      S.who = { name: n, code: "" }; S.screen = "pad"; render(); return;
    }
    const act = b.dataset.ses;
    if (act === "sign") { S.screen = "sign"; render(); return; }
    if (act === "qr") { S.screen = "qr"; render(); return; }
    if (act === "qrrefresh") { b.disabled = true; await loadAtt(); render(); return; }
    if (act === "back") { S.screen = "ready"; render(); return; }
    let payload;
    if (b.dataset.sdel) {
      if (!confirm(b.dataset.name + " 님의 서명을 삭제할까요?")) return;
      payload = { action: "adminSignDelete", token, sid: ses.id, rowIndex: Number(b.dataset.sdel), name: b.dataset.name };
    } else if (act === "create") {
      const title = document.getElementById("newTitle").value.trim(), date = document.getElementById("newDate").value, biz = document.getElementById("newBiz").value;
      if (!title || !date) { alert("회차 이름과 날짜를 입력해 주세요."); return; }
      payload = { action: "adminSessionCreate", token, title, date, biz };
    } else if (act === "close" || act === "reopen") {
      if (act === "close" && !confirm("마감하면 더 이상 서명을 받을 수 없어요. 마감할까요? (다시 열 수 있어요)")) return;
      payload = { action: "adminSessionClose", token, id: ses.id, reopen: act === "reopen" };
    } else if (act === "pdf") {
      payload = { action: "adminSessionPdf", token, sid: ses.id };
    } else return;
    b.disabled = true; const label = b.textContent; b.textContent = act === "pdf" ? "PDF 만드는 중(10~20초)…" : "처리 중…";
    try {
      const r = await api(payload);
      if (!r.ok) { alert(ATT_ERR[r.error] || ("처리하지 못했어요: " + r.error)); b.disabled = false; b.textContent = label; return; }
      if (act === "create") S.sid = r.id;
      if (act === "pdf") alert("저장했어요. (" + r.count + "명, 폴더: 일경험/연도/" + r.folder + ")");
      await loadAtt(); render();
    } catch (err) { alert("처리하지 못했어요. 잠시 뒤 다시 시도해 주세요."); b.disabled = false; b.textContent = label; }
  });

  function render() {
    let body;
    if (S.screen === "loading") body = '<div class="sec-intro"><p class="eyebrow">일경험 관리자 대시보드</p><h2>불러오는 중…</h2></div>';
    else if (S.screen === "no-token") body = noTokenScreen();
    else if (S.screen === "error") body = errorScreen();
    else if (S.screen === "sign") body = signScreen();
    else if (S.screen === "qr") body = qrScreen();
    else if (S.screen === "pad") body = padScreen();
    else body = dashboard();
    app.innerHTML = body;
    if (S.screen === "pad") setupPad();
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
