(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycby3FN9AR9b-2Q8Kzj0vmMtEIFqGLE0Vlq8LJA19VaavcNEfk2hpd2vXBKuMvw5_Us7SyA/exec";
  const qs = new URLSearchParams(location.search);
  const sid = qs.get("s") || "", key = qs.get("k") || "";
  const app = document.getElementById("app");
  const e = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ERR = {
    bad_link: "링크가 올바르지 않아요. 현장에서 QR을 다시 찍어 주세요.", closed: "이 출석은 마감됐어요. 스태프에게 말씀해 주세요.",
    bad_onsite: "현장 코드가 맞지 않아요. 스태프가 알려 준 4자리 숫자를 확인해 주세요.",
    mismatch: "이름과 연락처 뒤 4자리가 등록된 정보와 맞지 않아요. 확인 후 다시 입력하거나 스태프에게 말씀해 주세요.",
    already: "이미 서명하셨어요. 고쳐야 하면 스태프에게 말씀해 주세요.", missing_field: "이름과 연락처 뒤 4자리를 입력해 주세요.", bad_sign: "서명이 올바르지 않아요. 다시 서명해 주세요."
  };
  async function api(payload) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl.signal });
      return await r.json();
    } finally { clearTimeout(t); }
  }
  function box(h, body) { app.innerHTML = '<div class="sec-intro"><p class="eyebrow">집체코칭 출석 서명</p><h2>' + h + '</h2>' + body + '</div>'; }

  async function start() {
    box("불러오는 중…", "");
    let info;
    for (let i = 0; i < 3; i++) { // Apps Script가 가끔 첫 요청에 응답을 못 줘서 재시도해요
      try { info = await api({ action: "attendInfo", sid, key }); break; } catch (err) { if (i === 2) { box("불러오지 못했어요", '<button class="btn btn-primary btn-block" onclick="location.reload()">다시 시도하기</button>'); return; } }
    }
    if (!info.ok) { box("열 수 없어요", '<p class="muted">' + e(ERR[info.error] || info.error) + '</p>'); return; }
    if (!info.open) { box("마감됐어요", '<p class="muted">' + e(ERR.closed) + '</p>'); return; }
    form(info);
  }

  function form(info) {
    app.innerHTML = '<div class="sec-intro"><p class="eyebrow">' + e(info.biz) + ' · ' + e(info.date) + '</p><h2>' + e(info.title) + '</h2>' +
      '<p class="muted">출석 확인을 위해 서명해 주세요.</p>' +
      '<label>이름<input id="nm" autocomplete="name" placeholder="홍길동"></label>' +
      '<label>연락처 뒤 4자리<input id="p4" inputmode="numeric" maxlength="4" placeholder="1234"></label>' +
      '<label>현장 코드 <span class="muted">(스태프가 알려 준 숫자 4자리)</span><input id="os" inputmode="numeric" maxlength="4"></label>' +
      '<p class="muted" style="margin:10px 0 4px">서명 — 손가락으로 아래 칸에 서명해 주세요 <button type="button" id="clr" style="width:auto;padding:2px 10px;margin-left:6px">지우기</button></p>' +
      '<canvas id="pad" style="width:100%;height:170px;border:2px dashed #888;border-radius:10px;background:#fff;touch-action:none"></canvas>' +
      '<button class="btn btn-primary btn-block" id="go" style="margin-top:12px">서명 제출</button><p id="msg" class="muted" style="color:#b33"></p></div>';
    const cv = document.getElementById("pad"), r = window.devicePixelRatio || 1;
    cv.width = Math.round(cv.clientWidth * r); cv.height = Math.round(cv.clientHeight * r);
    const c = cv.getContext("2d"); c.lineWidth = 3 * r; c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = "#111";
    let drawing = false, signed = false;
    const pos = ev => { const b = cv.getBoundingClientRect(); return [(ev.clientX - b.left) * cv.width / b.width, (ev.clientY - b.top) * cv.height / b.height]; };
    cv.addEventListener("pointerdown", ev => { drawing = true; cv.setPointerCapture(ev.pointerId); c.beginPath(); c.moveTo.apply(c, pos(ev)); });
    cv.addEventListener("pointermove", ev => { if (!drawing) return; c.lineTo.apply(c, pos(ev)); c.stroke(); signed = true; });
    ["pointerup", "pointercancel"].forEach(t => cv.addEventListener(t, () => { drawing = false; }));
    document.getElementById("clr").onclick = () => { c.clearRect(0, 0, cv.width, cv.height); signed = false; };
    const msg = document.getElementById("msg"), go = document.getElementById("go");
    go.onclick = async () => {
      const name = document.getElementById("nm").value.trim(), p4 = document.getElementById("p4").value.trim(), os = document.getElementById("os").value.trim();
      if (!name || !/^\d{4}$/.test(p4)) { msg.textContent = ERR.missing_field; return; }
      if (!/^\d{4}$/.test(os)) { msg.textContent = "현장 코드 4자리를 입력해 주세요."; return; }
      if (!signed) { msg.textContent = "서명을 해 주세요."; return; }
      const d = c.getImageData(0, 0, cv.width, cv.height).data; let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const w = x1 - x0 + 1, h = y1 - y0 + 1, k = Math.min(1, 400 / w);
      const out = document.createElement("canvas"); out.width = Math.max(1, Math.round(w * k)); out.height = Math.max(1, Math.round(h * k));
      out.getContext("2d").drawImage(cv, x0, y0, w, h, 0, 0, out.width, out.height);
      go.disabled = true; go.textContent = "제출 중…"; msg.textContent = "";
      try {
        const res = await api({ action: "attendSign", sid, key, name, phone4: p4, onsite: os, signData: out.toDataURL("image/png") });
        if (!res.ok) { msg.textContent = ERR[res.error] || ("제출하지 못했어요: " + res.error); go.disabled = false; go.textContent = "서명 제출"; return; }
        box("출석이 확인됐어요 ✓", '<p class="muted">' + e(name) + '님, 서명이 제출됐어요. 이 화면을 닫으셔도 돼요.</p>');
      } catch (err) { msg.textContent = "제출 중 연결이 끊겼어요. 다시 눌러 주세요. (이미 제출됐다면 '이미 서명하셨어요'가 떠요)"; go.disabled = false; go.textContent = "서명 제출"; }
    };
  }
  if (!sid || !key) box("열 수 없어요", '<p class="muted">' + e(ERR.bad_link) + '</p>'); else start();
})();
