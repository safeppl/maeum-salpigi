(function () {
  // 마음살피기와는 다른, 새 구글 시트에 연결된 웹 앱 주소예요. 시트를 만든 뒤 여기를 채워주세요.
  const API_URL = "https://script.google.com/macros/s/AKfycby3FN9AR9b-2Q8Kzj0vmMtEIFqGLE0Vlq8LJA19VaavcNEfk2hpd2vXBKuMvw5_Us7SyA/exec";
  const DEMO = !API_URL;
  const CONTACTS = [["사람을 세우는 사람들 더유스", "02-2247-1091", "tel:0222471091"], ["안전한사람들", "031-898-1091", "tel:0318981091"]];

  const qs = new URLSearchParams(location.search);
  const token = qs.get("t") || "";
  const app = document.getElementById("app");
  const won = n => new Intl.NumberFormat("ko-KR").format(Math.round(n || 0)) + "원";
  const e = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  const S = { screen: "loading", status: null, form: { date: todayStr(), type: "출근", timeIn: "", timeOut: "", note: "" }, sending: false, err: "" };

  async function api(payload) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl.signal });
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  function contacts() {
    return '<div class="contacts">' + CONTACTS.map(c => '<a class="contact-line" href="' + c[2] + '"><span>' + c[0] + '</span><b>' + c[1] + '</b></a>').join("") + "</div>";
  }

  function noTokenScreen() {
    return '<div class="sec-intro"><p class="eyebrow">자기주도적 일경험</p><h2>개인 링크로 들어와 주세요</h2>' +
      '<p class="muted">코치나 담당자에게 받은 링크로 다시 들어와 주시면 내 출퇴근 현황과 보상금을 볼 수 있어요.</p></div>' + contacts();
  }
  function errorScreen() {
    return '<div class="sec-intro"><p class="eyebrow">자기주도적 일경험</p><h2>불러오지 못했어요</h2>' +
      '<p class="muted">' + e(S.err || "잠시 뒤 다시 열어 주세요.") + '</p>' +
      '<button class="btn btn-primary btn-block" onclick="location.reload()">다시 시도하기</button></div>' + contacts();
  }

  function kpis(st) {
    const left = Math.max(0, st.weeklyMinHours - st.thisWeekHours);
    return '<div class="kpis">' +
      '<div class="kpi"><small>이번 주 (월~일)</small><b>' + st.thisWeekHours + 'h</b></div>' +
      '<div class="kpi' + (left > 0 ? ' alert' : '') + '"><small>주 최소 ' + st.weeklyMinHours + '시간</small><b>' + (left > 0 ? left + 'h 남음' : '충족') + '</b></div>' +
      '<div class="kpi"><small>이번 달 예상 보상금</small><b style="font-size:18px">' + won(st.monthEstimate) + '</b></div>' +
      '<div class="kpi"><small>다음 지급일</small><b style="font-size:16px">' + e(st.nextPayDate) + '</b></div>' +
      '</div>';
  }

  function checkinForm() {
    const f = S.form;
    return '<div class="panel"><h3>오늘 체크인</h3><div class="form">' +
      '<div class="field"><label>날짜</label><input type="date" id="f-date" value="' + e(f.date) + '" max="' + todayStr() + '"></div>' +
      '<div class="field"><label>활동</label><div class="choices">' +
      ["출근", "교육"].map(t => '<label><input type="radio" name="f-type" value="' + t + '" ' + (f.type === t ? "checked" : "") + '>' + t + '</label>').join("") +
      '</div></div>' +
      '<div class="field"><label>출근 시각</label><input type="time" id="f-in" value="' + e(f.timeIn) + '"></div>' +
      '<div class="field"><label>퇴근 시각</label><input type="time" id="f-out" value="' + e(f.timeOut) + '"></div>' +
      '<div class="field"><label>오늘 소감</label><span class="hint">오늘 있었던 일이나 느낀 점을 적어주세요. 관리자가 확인해요.</span><textarea id="f-note">' + e(f.note) + '</textarea></div>' +
      (S.err ? '<p class="err">' + e(S.err) + '</p>' : '') +
      '<button class="btn btn-primary btn-block" id="f-submit" ' + (S.sending ? "disabled" : "") + '>' + (S.sending ? "보내는 중…" : "체크인 제출하기") + '</button>' +
      '</div></div>';
  }

  function recentList(st) {
    if (!st.recent.length) return '<div class="panel"><h3>최근 체크인</h3><p class="empty">아직 체크인 기록이 없어요.</p></div>';
    const rows = st.recent.map(r => '<div class="list-item"><div class="list-top"><b>' + e(r.date) + ' · ' + e(r.type) + ' (' + e(r.hours) + '시간)</b>' +
      '<span class="chip ' + (r.verified ? "ok" : "muted") + '">' + (r.verified ? "인증됨" : "인증 대기") + '</span></div>' +
      '<p class="list-note">' + e(r.note || "—") + '</p></div>').join("");
    return '<div class="panel"><h3>최근 체크인</h3>' + rows + '</div>';
  }

  function payList(st) {
    if (!st.payments.length) return '<div class="panel"><h3>지급 내역</h3><p class="empty">아직 지급 내역이 없어요. 매월 말일에 그 달 보상금이 정리돼요.</p></div>';
    const rows = st.payments.map(p => '<div class="list-item"><div class="list-top"><b>' + e(p.month) + ' · ' + e(p.hours) + '시간</b>' +
      '<span class="chip ' + (p.status === "지급완료" ? "ok" : "info") + '">' + e(p.status) + '</span></div>' +
      '<p class="list-note">' + won(p.amount) + ' · 지급일 ' + e(p.payDate) + '</p></div>').join("");
    return '<div class="panel"><h3>지급 내역</h3>' + rows + '</div>';
  }

  function dashboard() {
    const st = S.status;
    return '<div class="brand"><b>자기주도적 일경험</b><span>안전한더유스</span></div>' +
      '<div class="result-head"><h1>' + e(st.name) + '님</h1><span class="chip info">' + e(st.stage) + '</span></div>' +
      (st.thisWeekHours < st.weeklyMinHours
        ? '<div class="banner warn"><b>이번 주 ' + (st.weeklyMinHours - st.thisWeekHours) + '시간 더 필요해요.</b> 주 최소 ' + st.weeklyMinHours + '시간을 채워야 그 주가 보상금 계산에 들어가요.</div>'
        : '<div class="banner"><b>이번 주 목표를 채웠어요.</b> 수고하셨어요!</div>') +
      kpis(st) + checkinForm() + recentList(st) + payList(st) + contacts();
  }

  function render() {
    let body;
    if (S.screen === "loading") body = '<div class="sec-intro"><p class="eyebrow">자기주도적 일경험</p><h2>불러오는 중…</h2></div>';
    else if (S.screen === "no-token") body = noTokenScreen();
    else if (S.screen === "error") body = errorScreen();
    else body = dashboard();
    app.innerHTML = body;
    bind();
  }

  function bind() {
    const btn = document.getElementById("f-submit");
    if (!btn) return;
    document.querySelectorAll('input[name="f-type"]').forEach(r => r.addEventListener("change", () => { S.form.type = r.value; }));
    btn.addEventListener("click", submit);
  }

  async function submit() {
    const date = document.getElementById("f-date").value;
    const timeIn = document.getElementById("f-in").value;
    const timeOut = document.getElementById("f-out").value;
    const note = document.getElementById("f-note").value.trim();
    const type = document.querySelector('input[name="f-type"]:checked').value;
    if (!date || !timeIn || !timeOut) { S.err = "날짜와 시각을 모두 입력해 주세요."; render(); return; }
    if (!note) { S.err = "오늘 소감을 적어주세요."; render(); return; }
    if (timeOut <= timeIn) { S.err = "퇴근 시각이 출근 시각보다 늦어야 해요."; render(); return; }
    S.err = ""; S.sending = true; S.form = { date, type, timeIn, timeOut, note }; render();
    try {
      if (DEMO) { await new Promise(r => setTimeout(r, 400)); }
      else {
        const r = await api({ action: "checkin", token, date, timeIn, timeOut, type, note });
        if (!r.ok) throw new Error(r.error || "fail");
      }
      S.form = { date: todayStr(), type: "출근", timeIn: "", timeOut: "", note: "" };
      await load();
    } catch (err) {
      S.err = "저장하지 못했어요. 다시 시도해 주세요.";
      S.sending = false; render();
    }
  }

  async function load() {
    try {
      if (DEMO) {
        S.status = { name: "체험", stage: "일경험 진행", thisWeekHours: 6, weeklyMinHours: 10, hourlyRate: 12000,
          monthEstimate: 240000, nextPayDate: todayStr(), recent: [], payments: [] };
      } else {
        const r = await api({ action: "status", token });
        if (!r.ok) throw new Error(r.error || "fail");
        S.status = r;
      }
      S.sending = false; S.screen = "ready"; render();
    } catch (err) {
      S.err = "불러오지 못했어요."; S.screen = "error"; render();
    }
  }

  if (!token) { S.screen = "no-token"; render(); }
  else { render(); load(); }
})();
