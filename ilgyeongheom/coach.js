(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycby3FN9AR9b-2Q8Kzj0vmMtEIFqGLE0Vlq8LJA19VaavcNEfk2hpd2vXBKuMvw5_Us7SyA/exec";
  const DEMO = !API_URL;

  const qs = new URLSearchParams(location.search);
  const token = qs.get("t") || "";
  const app = document.getElementById("app");
  const e = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

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

  function participantCard(p) {
    return '<div class="coach-card" id="p-' + e(p.code) + '">' +
      '<div class="coach-top"><b>' + e(p.code) + ' · ' + e(p.name) + '</b><span class="chip ' + (p.met ? "ok" : "watch") + '">' + p.thisWeekHours + 'h / 10h' + (p.met ? " 충족" : "") + '</span></div>' +
      '<div class="coach-meta">단계: ' + e(p.stage) + (p.pendingCount ? ' · 인증 대기 ' + p.pendingCount + '건' : '') + '</div>' +
      '<textarea placeholder="이번 주 코멘트를 남겨주세요." data-code="' + e(p.code) + '">' + e(p.comment) + '</textarea>' +
      '<button class="btn btn-ghost btn-sm coach-save" data-code="' + e(p.code) + '">코멘트 저장</button>' +
      '<div class="save-msg" id="msg-' + e(p.code) + '"></div>' +
      '</div>';
  }

  function dashboard() {
    const d = S.data;
    const cards = d.participants.length
      ? d.participants.map(participantCard).join("")
      : '<p class="empty">담당하고 있는 참여자가 없어요.</p>';
    return '<div class="brand"><b>일경험 코치 화면</b><span>' + e(d.coachName) + ' 코치님</span></div>' +
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

  function bind() {
    document.querySelectorAll(".coach-save").forEach(btn => btn.addEventListener("click", () => saveComment(btn.dataset.code)));
  }

  async function saveComment(code) {
    const ta = document.querySelector('textarea[data-code="' + code + '"]');
    const msg = document.getElementById("msg-" + code);
    const comment = ta.value.trim();
    msg.textContent = "저장하는 중…";
    try {
      if (!DEMO) {
        const r = await api({ action: "coachComment", token, code, weekStart: S.data.weekStart, comment });
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
        S.data = { coachName: "체험", weekStart: "2026-01-01", participants: [] };
      } else {
        const r = await api({ action: "coachStatus", token });
        if (!r.ok) throw new Error(r.error || "fail");
        S.data = r;
      }
      S.screen = "ready"; render();
    } catch (err) {
      S.screen = "error"; render();
    }
  }

  if (!token) { S.screen = "no-token"; render(); }
  else { render(); load(); }
})();
