(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbxMM5tEf9X_rOPmpwlOg9MOBW6Q1VEICBxd5GJe7SKUQ9WHW7Cx1OVbFuP4phEA9wzs/exec";
  const CONTACTS = [["사람을 세우는 사람들 더유스", "02-2247-1091", "0222471091"], ["안전한사람들", "031-898-1091", "0318981091", "경기도 용인시 수지구 용구대로2753번길 37-30, 401호 (죽전동)"]];
  // [입력필드 id, 화면에 보일 라벨, 서버에 저장할 서류종류 — Code.gs의 DOC_TYPES와 철자가 같아야 파일명에 종류가 붙어요]
  const DOC_TYPES = [["resume", "이력서", "이력서"], ["cert", "자격증(있으면)", "자격증"], ["id", "신분증 사본", "신분증사본"], ["bank", "통장 사본", "통장사본"], ["contract", "계약서", "계약서"]];
  const MAX_FILE_MB = 15;

  const qs = new URLSearchParams(location.search);
  const TOKEN = qs.get("t") || "";
  const app = document.getElementById("app");
  const e = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const S = { screen: "loading", name: "", sending: false, err: "" };

  async function api(payload) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 60000);
    try {
      const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl.signal });
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  function contacts() {
    return '<div class="contacts">' + CONTACTS.map(([n, p, t, addr]) =>
      '<a class="contact-line" href="tel:' + t + '"><span>' + n + '</span><b>' + p + '</b></a>' + (addr ? '<p class="contact-addr">' + addr + '</p>' : "")
    ).join("") + '<p class="privacy-note">제출한 서류는 활동가·코치 관리 목적으로만 쓰고, 안전하게 보관해요.</p></div>';
  }

  function invalidScreen() {
    return '<div class="brand"><b>서류 제출</b><span>안전한더유스</span></div>' +
      '<div class="sec-intro"><h2>링크를 확인해 주세요</h2><p class="muted">유효하지 않거나 만료된 링크예요. 담당자에게 다시 문의해 주세요.</p></div>' + contacts();
  }

  function formScreen() {
    return '<div class="brand"><b>서류 제출</b><span>안전한더유스</span></div>' +
      '<div class="sec-intro"><p class="eyebrow">양성교육 이수</p><h2>' + e(S.name) + '님, 서류를 올려주세요</h2>' +
      '<p class="muted">실전 투입 전 확인이 필요한 서류예요. 해당하는 것만 올리셔도 돼요. 파일 하나당 ' + MAX_FILE_MB + 'MB까지 올릴 수 있어요.</p></div>' +
      '<div class="form">' +
      DOC_TYPES.map(([id, label]) => '<div class="field"><label for="f-' + id + '">' + e(label) + '</label><input type="file" id="f-' + id + '" accept=".pdf,.jpg,.jpeg,.png,.heic"></div>').join("") +
      (S.err ? '<p class="err">' + e(S.err) + '</p>' : '') +
      '<button class="btn btn-primary btn-block" id="f-submit" ' + (S.sending ? "disabled" : "") + '>' + (S.sending ? "올리는 중…" : "제출하기") + '</button>' +
      '</div>' + contacts();
  }

  function doneScreen() {
    return '<div class="sec-intro"><p class="eyebrow">서류 제출</p><h2>제출됐어요</h2>' +
      '<p class="muted">확인해 주셔서 고마워요. 추가로 필요한 서류가 있으면 담당자가 따로 연락드릴게요.</p></div>' + contacts();
  }

  function render() {
    app.innerHTML = S.screen === "loading" ? '<div class="sec-intro"><h2>불러오는 중이에요</h2></div>'
      : S.screen === "invalid" ? invalidScreen()
      : S.screen === "done" ? doneScreen()
      : formScreen();
    const btn = document.getElementById("f-submit");
    if (btn) btn.addEventListener("click", submit);
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = () => reject(new Error("read_fail"));
      r.readAsDataURL(file);
    });
  }

  async function submit() {
    const picked = DOC_TYPES.map(([id, label, type]) => ({ label, type, file: document.getElementById("f-" + id).files[0] })).filter(x => x.file);
    if (!picked.length) { S.err = "서류를 하나 이상 올려주세요."; render(); return; }
    const tooBig = picked.find(x => x.file.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) { S.err = tooBig.label + " 파일이 " + MAX_FILE_MB + "MB를 넘어요. 더 작은 파일로 올려주세요."; render(); return; }

    S.err = ""; S.sending = true; render();
    try {
      const files = await Promise.all(picked.map(async x => ({ type: x.type, name: x.file.name, mime: x.file.type, data: await fileToBase64(x.file) })));
      const r = await api({ action: "uploadDocs", token: TOKEN, files });
      if (!r.ok) throw new Error(r.error || "fail");
      S.screen = "done"; S.sending = false; render();
    } catch (err) {
      S.err = "제출하지 못했어요: " + err.message; S.sending = false; render(); // 임시로 실제 에러를 보여줘요(원인 확인되면 되돌릴 예정)
    }
  }

  async function init() {
    if (!TOKEN) { S.screen = "invalid"; render(); return; }
    try {
      const res = await fetch(API_URL + "?token=" + encodeURIComponent(TOKEN));
      const json = await res.json();
      if (!json.ok) throw new Error("invalid");
      S.name = json.name; S.screen = "form"; render();
    } catch (err) {
      S.screen = "invalid"; render();
    }
  }

  render();
  init();
})();
