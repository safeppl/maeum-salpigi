(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycby3FN9AR9b-2Q8Kzj0vmMtEIFqGLE0Vlq8LJA19VaavcNEfk2hpd2vXBKuMvw5_Us7SyA/exec";
  const DEMO = !API_URL;

  const qs = new URLSearchParams(location.search);
  const token = qs.get("t") || "";
  const app = document.getElementById("app");
  const e = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const SCALE = ["전혀 그렇지 않다", "그렇지 않다", "그렇다", "매우 그렇다"];
  const S = { screen: "loading", data: null, saving: {} };

  async function api(payload) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl.signal });
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  function noTokenScreen() {
    return '<div class="sec-intro"><p class="eyebrow">일경험 코치 화면</p><h2>개인 링크로 들어와 주세요</h2>' +
      '<p class="muted">담당자에게 받은 코치 링크로 다시 들어와 주세요.</p></div>';
  }
  function errorScreen() {
    return '<div class="sec-intro"><p class="eyebrow">일경험 코치 화면</p><h2>불러오지 못했어요</h2>' +
      '<button class="btn btn-primary btn-block" onclick="location.reload()">다시 시도하기</button></div>';
  }

  function adaptRow(p, factor) {
    const cur = p.scores ? p.scores[factor] : null;
    return '<div class="adapt-row"><span class="adapt-label">' + e(factor) + '</span><div class="adapt-opts">' +
      SCALE.map((label, i) => '<label title="' + e(label) + '"><input type="radio" name="adapt-' + e(p.code) + '-' + e(factor) + '" value="' + i + '" ' + (cur === i ? "checked" : "") + '>' + i + '</label>').join("") +
      '</div></div>';
  }

  function planBlock(p) {
    const plan = p.plan;
    if (!plan) return '<div class="plan-block"><p class="adapt-title">활동 계획서</p><p class="list-note">아직 제출 전이에요.</p></div>';
    const details = '<p class="list-note"><b>목표</b> ' + e(plan.goal) + '</p>' +
      '<p class="list-note"><b>기간</b> ' + e(plan.startDate) + ' ~ ' + e(plan.endDate) + '</p>' +
      '<p class="list-note"><b>장소</b> ' + e(plan.location) + '</p>' +
      '<p class="list-note"><b>주요 활동</b> ' + e(plan.content) + '</p>' +
      '<p class="list-note"><b>주당 희망 시간</b> ' + e(plan.weeklyHours) + '시간</p>';
    if (plan.status !== "대기") {
      const chip = plan.status === "승인" ? "ok" : "watch";
      return '<div class="plan-block"><p class="adapt-title">활동 계획서 <span class="chip ' + chip + '">' + e(plan.status) + '</span></p>' + details +
        (plan.comment ? '<p class="list-note"><b>코치 코멘트</b> ' + e(plan.comment) + '</p>' : "") + '</div>';
    }
    return '<div class="plan-block"><p class="adapt-title">활동 계획서 <span class="chip info">검토 대기</span></p>' + details +
      '<textarea placeholder="반려할 경우 사유를 적어주세요 (승인 시 생략 가능)" data-plan-comment="' + e(p.code) + '"></textarea>' +
      '<div class="plan-actions">' +
      '<button class="btn btn-primary btn-sm plan-approve" data-code="' + e(p.code) + '">승인</button>' +
      '<button class="btn btn-ghost btn-sm plan-reject" data-code="' + e(p.code) + '">반려</button>' +
      '</div><div class="save-msg" id="plan-msg-' + e(p.code) + '"></div></div>';
  }

  function participantCard(p) {
    return '<div class="coach-card" id="p-' + e(p.code) + '">' +
      '<div class="coach-top"><b>' + e(p.code) + ' · ' + e(p.name) + '</b><span class="chip ' + (p.met ? "ok" : "watch") + '">' + p.thisWeekHours + 'h / ' + (p.weeklyMinHours || 6) + 'h' + (p.met ? " 충족" : "") + '</span></div>' +
      '<div class="coach-meta">단계: ' + e(p.stage) + (p.pendingCount ? ' · 인증 대기 ' + p.pendingCount + '건' : '') + '</div>' +
      planBlock(p) + attendBlock(p) +
      '<div class="adapt-block"><p class="adapt-title">이번 주 일경험 적응도 관찰 (0=전혀 그렇지 않다 ~ 3=매우 그렇다)</p>' +
      S.data.factors.map(f => adaptRow(p, f)).join("") + '</div>' +
      '<textarea placeholder="이번 주 코멘트를 남겨주세요." data-code="' + e(p.code) + '">' + e(p.comment) + '</textarea>' +
      '<button class="btn btn-ghost btn-sm coach-save" data-code="' + e(p.code) + '">저장</button>' +
      '<div class="save-msg" id="msg-' + e(p.code) + '"></div>' +
      '</div>';
  }

  // ───── 집체코칭 출석: 참여자별로 서명한 회차를 보고 [확인]하면 그 회차 출석이 인정돼요 ─────
  const attRows = () => ((S.att && S.att.rows) || []).filter(r => r.code && r.name);
  function attGroups() {
    const map = {};
    attRows().forEach(r => { const k = r.biz + "|" + r.date + "|" + r.round; (map[k] = map[k] || { biz: r.biz, date: r.date, round: r.round, rows: [] }).rows.push(r); });
    return Object.keys(map).map(k => map[k]).sort((x, y) => (y.date + y.round).localeCompare(x.date + x.round));
  }
  function attendBlock(p) {
    if (!S.att) return '<div class="adapt-block"><p class="adapt-title">집체코칭 출석</p><div class="coach-meta">불러오는 중…</div></div>';
    if (S.att.failed) return '<div class="adapt-block"><p class="adapt-title">집체코칭 출석</p><div class="coach-meta">불러오지 못했어요. 새로고침해 주세요.</div></div>';
    const mine = attRows().filter(r => r.code === p.code).sort((x, y) => x.round - y.round);
    const ok = mine.filter(r => r.confirmed).length;
    return '<div class="adapt-block"><p class="adapt-title">집체코칭 출석 — <b>' + ok + '회 확인</b>' + (mine.length > ok ? ' · 확인 대기 ' + (mine.length - ok) + '회' : '') + '</p>' +
      (mine.length ? mine.map(r => '<div class="coach-meta" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span><b>' + r.round + '회차</b>' + (r.round === 1 ? " (오리엔테이션)" : "") + ' · ' + e(r.date) + ' · ' + e(r.at) + ' 서명</span>' +
        '<span class="chip ' + (r.confirmed ? "ok" : "info") + '">' + (r.confirmed ? "확인됨" : "확인 대기") + '</span>' +
        '<button class="btn ' + (r.confirmed ? "btn-ghost" : "btn-primary") + ' btn-sm" data-attok="' + r.rowIndex + '">' + (r.confirmed ? "확인 취소" : "출석 확인") + '</button></div>').join("")
        : '<div class="coach-meta">아직 서명한 회차가 없어요.</div>') + '</div>';
  }
  // 확인이 끝난 회차는 날짜·사업별로 모아 참석명부 PDF를 받을 수 있어요.
  function pdfSection() {
    const gs = attGroups().filter(g => g.rows.some(r => r.confirmed));
    if (!gs.length) return "";
    return '<details class="plan-block" style="margin-bottom:12px"><summary>참석명부 PDF 받기 (' + gs.length + '건)</summary>' +
      gs.map((g, gi) => '<div class="coach-meta" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + e(g.date) + ' · ' + e(g.biz) + ' · ' + g.round + '회차 — 확인 ' + g.rows.filter(r => r.confirmed).length + '명 ' +
        '<button class="btn btn-primary btn-sm" data-pdf="' + e(g.biz) + '|' + e(g.date) + '|' + g.round + '">명부 PDF 다운로드</button></div>').join("") + '</details>';
  }
  async function loadAtt() { try { const r = await api({ action: "coachAttendList", token }); S.att = r.ok ? r : { rows: [], failed: true }; } catch (err) { S.att = { rows: [], failed: true }; } }
  function downloadPdf(name, b64) {
    const bin = atob(b64), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  app.addEventListener("click", async ev => {
    const ok = ev.target.closest("button[data-attok]"), pd = ev.target.closest("button[data-pdf]");
    if (!ok && !pd) return;
    const btn = ok || pd, label = btn.textContent; btn.disabled = true; btn.textContent = pd ? "만드는 중(10~20초)…" : "처리 중…";
    try {
      if (ok) {
        const r = attRows().find(x => x.rowIndex === Number(ok.dataset.attok));
        const res = await api({ action: "coachAttendConfirm", token, items: [{ rowIndex: r.rowIndex, name: r.name, date: r.date, round: r.round, confirmed: !r.confirmed }] });
        if (!res.ok) alert(res.error === "changed" ? "그 사이 기록이 바뀌었어요. 새로고침해 주세요." : "저장하지 못했어요: " + res.error);
      } else {
        const [biz, date, round] = pd.dataset.pdf.split("|");
        const res = await api({ action: "coachAttendPdf", token, biz, date, round: Number(round) });
        if (!res.ok) alert("명부를 만들지 못했어요: " + res.error);
        else if (res.data) downloadPdf(res.name, res.data);
      }
    } catch (err) { alert("처리하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
    await loadAtt(); render();
  });

  function dashboard() {
    const d = S.data;
    // 사업 → 참여자 순서로 고르면 그 사람의 보고서 칸만 보여요(여러 사업·여러 참여자를 맡은 코치용).
    const ps = d.participants, bizs = Array.from(new Set(ps.map(p => p.biz || "미분류")));
    if (!S.biz || bizs.indexOf(S.biz) < 0) S.biz = bizs[0];
    const inBiz = ps.filter(p => (p.biz || "미분류") === S.biz);
    if (!S.code || !inBiz.some(p => p.code === S.code)) S.code = inBiz.length ? inBiz[0].code : null;
    const sel = ps.length
      ? '<div style="margin:0 0 10px;display:flex;flex-wrap:wrap;gap:8px"><select id="bizPick" style="font:inherit;padding:7px 9px;border:1px solid var(--line);border-radius:8px;min-width:150px">' + bizs.map(b => '<option value="' + e(b) + '"' + (b === S.biz ? " selected" : "") + '>' + e(b) + ' (' + ps.filter(p => (p.biz || "미분류") === b).length + '명)</option>').join("") + '</select>' +
        '<select id="partPick" style="font:inherit;padding:7px 9px;border:1px solid var(--line);border-radius:8px;min-width:200px">' + inBiz.map(p => '<option value="' + e(p.code) + '"' + (p.code === S.code ? " selected" : "") + '>' + e(p.name) + ' · ' + e(p.stage) + (p.pendingCount ? ' · 인증 대기 ' + p.pendingCount : "") + '</option>').join("") + '</select></div>'
      : "";
    const cur = ps.find(p => p.code === S.code);
    const cards = cur ? sel + participantCard(cur) : (ps.length ? sel : '<p class="empty">담당하고 있는 참여자가 없어요.</p>');
    return '<div class="brand"><b>일경험 코치 화면</b><span>' + e(d.coachName) + ' 코치님</span></div>' +
      pdfSection() +
      '<p class="muted">이번 주(' + e(d.weekStart) + ' 시작) 기준이에요.</p>' + cards;
  }

  function render() {
    let body;
    if (S.screen === "loading") body = '<div class="sec-intro"><p class="eyebrow">일경험 코치 화면</p><h2>불러오는 중…</h2></div>';
    else if (S.screen === "no-token") body = noTokenScreen();
    else if (S.screen === "error") body = errorScreen();
    else body = dashboard();
    app.innerHTML = body;
    bind();
  }

  app.addEventListener("change", ev => {
    if (ev.target.id === "bizPick") { S.biz = ev.target.value; S.code = null; render(); }
    else if (ev.target.id === "partPick") { S.code = ev.target.value; render(); }
  });

  function bind() {
    document.querySelectorAll(".coach-save").forEach(btn => btn.addEventListener("click", () => saveComment(btn.dataset.code)));
    document.querySelectorAll(".plan-approve").forEach(btn => btn.addEventListener("click", () => reviewPlan(btn.dataset.code, "승인")));
    document.querySelectorAll(".plan-reject").forEach(btn => btn.addEventListener("click", () => reviewPlan(btn.dataset.code, "반려")));
  }

  async function reviewPlan(code, decision) {
    const msg = document.getElementById("plan-msg-" + code);
    const ta = document.querySelector('textarea[data-plan-comment="' + code + '"]');
    const comment = ta ? ta.value.trim() : "";
    if (decision === "반려" && !comment) { msg.textContent = "반려 사유를 적어주세요."; return; }
    msg.textContent = "처리하는 중…";
    try {
      if (!DEMO) {
        const r = await api({ action: "coachReviewPlan", token, code, decision, comment });
        if (!r.ok) throw new Error(r.error || "fail");
      }
      await load();
    } catch (err) {
      msg.textContent = "처리하지 못했어요. 다시 시도해 주세요.";
    }
  }

  async function saveComment(code) {
    const ta = document.querySelector('textarea[data-code="' + code + '"]');
    const msg = document.getElementById("msg-" + code);
    const comment = ta.value.trim();
    const scores = {};
    for (const f of S.data.factors) {
      const picked = document.querySelector('input[name="adapt-' + code + '-' + f + '"]:checked');
      if (!picked) { msg.textContent = "적응도 4개 항목을 모두 골라주세요."; return; }
      scores[f] = Number(picked.value);
    }
    msg.textContent = "저장하는 중…";
    try {
      if (!DEMO) {
        const r = await api({ action: "coachComment", token, code, weekStart: S.data.weekStart, comment, scores });
        if (!r.ok) throw new Error(r.error || "fail");
      }
      msg.textContent = "저장했어요.";
    } catch (err) {
      msg.textContent = "저장하지 못했어요. 다시 시도해 주세요.";
    }
  }

  async function load() {
    try {
      if (DEMO) {
        S.data = { coachName: "체험", weekStart: "2026-01-01", factors: ["관심", "통제", "호기심", "자신감"], participants: [] };
      } else {
        const r = await api({ action: "coachStatus", token });
        if (!r.ok) throw new Error(r.error || "fail");
        S.data = r;
      }
      S.screen = "ready"; render();
      if (!DEMO) loadAtt().then(render);
    } catch (err) {
      S.screen = "error"; render();
    }
  }

  if (!token) { S.screen = "no-token"; render(); }
  else { render(); load(); }
})();
