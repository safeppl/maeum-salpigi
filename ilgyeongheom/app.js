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

  const MOODS = ["힘들었다", "즐거웠다", "할만했다", "유익했다"];
  const S = { screen: "loading", status: null,
    form: { date: todayStr(), type: "출근", timeIn: "", timeOut: "", location: "", task: "", mood: "", note: "" },
    photo: null, photoName: "", sending: false, err: "",
    planForm: { goal: "", startDate: "", endDate: "", location: "", content: "", weeklyHours: "" },
    planSending: false, planErr: "" };

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
      '<div class="field"><label>활동 장소</label><input type="text" id="f-location" value="' + e(f.location) + '" placeholder="예: OO카페, OO센터"></div>' +
      '<div class="field"><label>출근 시각</label><input type="time" id="f-in" value="' + e(f.timeIn) + '"></div>' +
      '<div class="field"><label>퇴근 시각</label><input type="time" id="f-out" value="' + e(f.timeOut) + '"></div>' +
      '<div class="field"><label>오늘 한 일</label><textarea id="f-task" placeholder="오늘 맡은 일이 무엇이었는지 적어주세요">' + e(f.task) + '</textarea></div>' +
      '<div class="field"><label>사진 인증</label><span class="hint">오늘 활동 모습이나 결과물 사진을 한 장 올려주세요.</span>' +
      '<input type="file" id="f-photo" accept="image/*">' +
      (S.photoName ? '<span class="hint">선택됨: ' + e(S.photoName) + '</span>' : '') + '</div>' +
      '<div class="field"><label>오늘의 기분</label><div class="choices">' +
      MOODS.map(m => '<label><input type="radio" name="f-mood" value="' + m + '" ' + (f.mood === m ? "checked" : "") + '>' + m + '</label>').join("") +
      '</div></div>' +
      '<div class="field"><label>오늘 소감</label><span class="hint">오늘 있었던 일이나 느낀 점을 적어주세요. 관리자가 확인해요.</span><textarea id="f-note">' + e(f.note) + '</textarea></div>' +
      (S.err ? '<p class="err">' + e(S.err) + '</p>' : '') +
      '<button class="btn btn-primary btn-block" id="f-submit" ' + (S.sending ? "disabled" : "") + '>' + (S.sending ? "보내는 중…" : "체크인 제출하기") + '</button>' +
      '</div></div>';
  }

  // 사진을 너무 크게 안 보내게 줄여서 base64로 바꿔요.
  function resizePhoto(file, maxSize) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read_fail"));
      reader.onload = ev => {
        const img = new Image();
        img.onerror = () => reject(new Error("decode_fail"));
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function recentList(st) {
    if (!st.recent.length) return '<div class="panel"><h3>최근 체크인</h3><p class="empty">아직 체크인 기록이 없어요.</p></div>';
    const rows = st.recent.map(r => '<div class="list-item"><div class="list-top"><b>' + e(r.date) + ' · ' + e(r.type) + ' (' + e(r.hours) + '시간)</b>' +
      '<span class="chip ' + (r.verified ? "ok" : "muted") + '">' + (r.verified ? "인증됨" : "인증 대기") + '</span></div>' +
      '<p class="list-note">' + e(r.location || "—") + (r.mood ? " · " + e(r.mood) : "") + '</p>' +
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

  function planSummary(plan) {
    return '<div class="panel"><h3>제출한 활동 계획서</h3>' +
      '<p class="list-note"><b>목표</b> ' + e(plan.goal) + '</p>' +
      '<p class="list-note"><b>기간</b> ' + e(plan.startDate) + ' ~ ' + e(plan.endDate) + '</p>' +
      '<p class="list-note"><b>장소</b> ' + e(plan.location) + '</p>' +
      '<p class="list-note"><b>주요 활동</b> ' + e(plan.content) + '</p>' +
      '<p class="list-note"><b>주당 희망 시간</b> ' + e(plan.weeklyHours) + '시간</p></div>';
  }

  function planForm(plan) {
    const f = S.planForm;
    return '<div class="panel"><h3>활동 계획서 작성</h3>' +
      (plan && plan.status === "반려" ? '<div class="banner warn"><b>코치님이 반려했어요.</b><br>' + e(plan.comment || "") + '</div>' : "") +
      '<div class="form">' +
      '<div class="field"><label>활동 목표</label><textarea id="p-goal" placeholder="이 일경험을 통해 이루고 싶은 것을 적어주세요">' + e(f.goal) + '</textarea></div>' +
      '<div class="field"><label>활동 시작일</label><input type="date" id="p-start" value="' + e(f.startDate) + '"></div>' +
      '<div class="field"><label>활동 종료일</label><input type="date" id="p-end" value="' + e(f.endDate) + '"></div>' +
      '<div class="field"><label>활동 장소</label><input type="text" id="p-location" value="' + e(f.location) + '" placeholder="예: OO카페, OO센터"></div>' +
      '<div class="field"><label>주요 활동 내용</label><textarea id="p-content" placeholder="어떤 일을 할 계획인지 적어주세요">' + e(f.content) + '</textarea></div>' +
      '<div class="field"><label>주당 희망 활동 시간</label><input type="number" id="p-hours" min="1" max="40" value="' + e(f.weeklyHours) + '"></div>' +
      (S.planErr ? '<p class="err">' + e(S.planErr) + '</p>' : "") +
      '<button class="btn btn-primary btn-block" id="p-submit" ' + (S.planSending ? "disabled" : "") + '>' + (S.planSending ? "보내는 중…" : "계획서 제출하기") + '</button>' +
      '</div></div>';
  }

  function planScreen() {
    const st = S.status, plan = st.plan;
    return '<div class="brand"><b>자기주도적 일경험</b><span>안전한더유스</span></div>' +
      '<div class="result-head"><h1>' + e(st.name) + '님</h1><span class="chip info">' + e(st.stage) + '</span></div>' +
      (plan && plan.status === "대기"
        ? '<div class="banner"><b>계획서를 제출했어요.</b> 코치님이 확인하고 있어요.</div>' + planSummary(plan)
        : planForm(plan)) + contacts();
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
    else body = S.status.checkinAllowed ? dashboard() : planScreen();
    app.innerHTML = body;
    bind();
  }

  function bind() {
    const btn = document.getElementById("f-submit");
    if (btn) {
      document.querySelectorAll('input[name="f-type"]').forEach(r => r.addEventListener("change", () => { S.form.type = r.value; }));
      document.querySelectorAll('input[name="f-mood"]').forEach(r => r.addEventListener("change", () => { S.form.mood = r.value; }));
      const photo = document.getElementById("f-photo");
      if (photo) photo.addEventListener("change", () => {
        const f = photo.files[0];
        S.photoName = f ? f.name : "";
        S.photo = f || null;
      });
      btn.addEventListener("click", submit);
    }
    const pbtn = document.getElementById("p-submit");
    if (pbtn) pbtn.addEventListener("click", submitPlan);
  }

  async function submitPlan() {
    const goal = document.getElementById("p-goal").value.trim();
    const startDate = document.getElementById("p-start").value;
    const endDate = document.getElementById("p-end").value;
    const location = document.getElementById("p-location").value.trim();
    const content = document.getElementById("p-content").value.trim();
    const weeklyHours = Number(document.getElementById("p-hours").value);
    if (!goal) { S.planErr = "활동 목표를 적어주세요."; render(); return; }
    if (!startDate || !endDate) { S.planErr = "활동 기간을 입력해 주세요."; render(); return; }
    if (endDate < startDate) { S.planErr = "종료일이 시작일보다 늦어야 해요."; render(); return; }
    if (!location) { S.planErr = "활동 장소를 적어주세요."; render(); return; }
    if (!content) { S.planErr = "주요 활동 내용을 적어주세요."; render(); return; }
    if (!(weeklyHours > 0 && weeklyHours <= 40)) { S.planErr = "주당 희망 활동 시간을 1~40 사이로 입력해 주세요."; render(); return; }

    S.planErr = ""; S.planSending = true; S.planForm = { goal, startDate, endDate, location, content, weeklyHours }; render();
    try {
      if (!DEMO) {
        const r = await api({ action: "submitPlan", token, goal, startDate, endDate, location, content, weeklyHours });
        if (!r.ok) throw new Error(r.error || "fail");
      }
      await load();
    } catch (err) {
      S.planErr = "제출하지 못했어요. 다시 시도해 주세요.";
      S.planSending = false; render();
    }
  }

  async function submit() {
    const date = document.getElementById("f-date").value;
    const timeIn = document.getElementById("f-in").value;
    const timeOut = document.getElementById("f-out").value;
    const location = document.getElementById("f-location").value.trim();
    const task = document.getElementById("f-task").value.trim();
    const note = document.getElementById("f-note").value.trim();
    const type = document.querySelector('input[name="f-type"]:checked').value;
    const moodEl = document.querySelector('input[name="f-mood"]:checked');
    const mood = moodEl ? moodEl.value : "";
    if (!date || !timeIn || !timeOut) { S.err = "날짜와 시각을 모두 입력해 주세요."; render(); return; }
    if (timeOut <= timeIn) { S.err = "퇴근 시각이 출근 시각보다 늦어야 해요."; render(); return; }
    if (!location) { S.err = "활동 장소를 적어주세요."; render(); return; }
    if (!task) { S.err = "오늘 한 일을 적어주세요."; render(); return; }
    if (!mood) { S.err = "오늘의 기분을 골라주세요."; render(); return; }
    if (!S.photo) { S.err = "사진을 한 장 올려주세요."; render(); return; }
    if (!note) { S.err = "오늘 소감을 적어주세요."; render(); return; }

    S.err = ""; S.sending = true; S.form = { date, type, timeIn, timeOut, location, task, mood, note }; render();
    try {
      let photoBase64 = "";
      if (!DEMO) photoBase64 = await resizePhoto(S.photo, 1280);
      if (DEMO) { await new Promise(r => setTimeout(r, 400)); }
      else {
        const r = await api({ action: "checkin", token, date, timeIn, timeOut, type, location, task, mood, note, photo: photoBase64 });
        if (!r.ok) throw new Error(r.error || "fail");
      }
      S.form = { date: todayStr(), type: "출근", timeIn: "", timeOut: "", location: "", task: "", mood: "", note: "" };
      S.photo = null; S.photoName = "";
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
          monthEstimate: 240000, nextPayDate: todayStr(), recent: [], payments: [],
          checkinAllowed: true, plan: { status: "승인", goal: "데모", startDate: todayStr(), endDate: todayStr(), location: "데모", content: "데모", weeklyHours: 10 } };
      } else {
        const r = await api({ action: "status", token });
        if (!r.ok) throw new Error(r.error || "fail");
        S.status = r;
        if (r.plan) S.planForm = { goal: r.plan.goal || "", startDate: r.plan.startDate || "", endDate: r.plan.endDate || "",
          location: r.plan.location || "", content: r.plan.content || "", weeklyHours: r.plan.weeklyHours || "" };
      }
      S.sending = false; S.planSending = false; S.screen = "ready"; render();
    } catch (err) {
      S.err = "불러오지 못했어요."; S.screen = "error"; render();
    }
  }

  if (!token) { S.screen = "no-token"; render(); }
  else { render(); load(); }
})();
