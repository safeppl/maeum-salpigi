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
      '<div class="coach-meta">코치: ' + e(p.coach || "—") + ' · 단계: ' + e(p.stage) + (p.pendingCount ? ' · 인증 대기 ' + p.pendingCount + '건' : '') + '</div>' +
      '<div class="coach-meta">누적 활동 ' + p.cumulativeHours + '시간 · 누적 지급액 ' + won(p.cumulativeAmount) + '</div>' +
      planChip(p.planStatus) +
      '</div>';
  }

  function dashboard() {
    const d = S.data;
    const rows = d.participants.length ? d.participants.map(participantRow).join("") : '<p class="empty">진행중인 참여자가 없어요.</p>';
    return '<div class="brand"><b>일경험 관리자 대시보드</b><span>' + e(d.weekStart) + ' 주 시작 기준</span></div>' + rows;
  }

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
    } catch (err) {
      S.err = "불러오지 못했어요."; S.screen = "error"; render();
    }
  }

  if (!token) { S.screen = "no-token"; render(); }
  else { render(); load(); }
})();
