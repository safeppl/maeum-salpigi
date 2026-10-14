(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbxMM5tEf9X_rOPmpwlOg9MOBW6Q1VEICBxd5GJe7SKUQ9WHW7Cx1OVbFuP4phEA9wzs/exec";
  const DEMO = !API_URL;
  const CONTACTS = [["사람을 세우는 사람들 더유스", "02-2247-1091", "tel:0222471091"], ["안전한사람들", "031-898-1091", "tel:0318981091"]];
  const REGIONS = {
    "서울특별시": "종로구 중구 용산구 성동구 광진구 동대문구 중랑구 성북구 강북구 도봉구 노원구 은평구 서대문구 마포구 양천구 강서구 구로구 금천구 영등포구 동작구 관악구 서초구 강남구 송파구 강동구",
    "부산광역시": "중구 서구 동구 영도구 부산진구 동래구 남구 북구 해운대구 사하구 금정구 강서구 연제구 수영구 사상구 기장군",
    "대구광역시": "중구 동구 서구 남구 북구 수성구 달서구 달성군 군위군",
    "인천광역시": "제물포구 영종구 미추홀구 연수구 남동구 부평구 계양구 서구 검단구 강화군 옹진군",
    "광주광역시": "동구 서구 남구 북구 광산구",
    "대전광역시": "동구 중구 서구 유성구 대덕구",
    "울산광역시": "중구 남구 동구 북구 울주군",
    "세종특별자치시": "세종시",
    "경기도": "수원시 성남시 의정부시 안양시 부천시 광명시 평택시 동두천시 안산시 고양시 과천시 구리시 남양주시 오산시 시흥시 군포시 의왕시 하남시 용인시 파주시 이천시 안성시 김포시 화성시 광주시 양주시 포천시 여주시 연천군 가평군 양평군",
    "강원특별자치도": "춘천시 원주시 강릉시 동해시 태백시 속초시 삼척시 홍천군 횡성군 영월군 평창군 정선군 철원군 화천군 양구군 인제군 고성군 양양군",
    "충청북도": "청주시 충주시 제천시 보은군 옥천군 영동군 증평군 진천군 괴산군 음성군 단양군",
    "충청남도": "천안시 공주시 보령시 아산시 서산시 논산시 계룡시 당진시 금산군 부여군 서천군 청양군 홍성군 예산군 태안군",
    "전북특별자치도": "전주시 군산시 익산시 정읍시 남원시 김제시 완주군 진안군 무주군 장수군 임실군 순창군 고창군 부안군",
    "전라남도": "목포시 여수시 순천시 나주시 광양시 담양군 곡성군 구례군 고흥군 보성군 화순군 장흥군 강진군 해남군 영암군 무안군 함평군 영광군 장성군 완도군 진도군 신안군",
    "경상북도": "포항시 경주시 김천시 안동시 구미시 영주시 영천시 상주시 문경시 경산시 의성군 청송군 영양군 영덕군 청도군 고령군 성주군 칠곡군 예천군 봉화군 울진군 울릉군",
    "경상남도": "창원시 진주시 통영시 사천시 김해시 밀양시 거제시 양산시 의령군 함안군 창녕군 고성군 남해군 하동군 산청군 함양군 거창군 합천군",
    "제주특별자치도": "제주시 서귀포시"
  };

  const qs = new URLSearchParams(location.search);
  const app = document.getElementById("app");
  const e = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const S = { screen: "form", sido: "", sigungu: "", roles: [], sending: false, err: "" };

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

  function sigunguOptions() {
    if (!S.sido || !REGIONS[S.sido]) return '<option value="">시도를 먼저 골라주세요</option>';
    return '<option value="">선택</option>' + REGIONS[S.sido].split(" ").map(g => '<option value="' + e(g) + '"' + (g === S.sigungu ? " selected" : "") + ">" + e(g) + "</option>").join("");
  }

  function formScreen() {
    return '<div class="brand"><b>코치·활동가 신청</b><span>안전한더유스</span></div>' +
      '<div class="sec-intro"><p class="eyebrow">상시 접수</p><h2>함께해 주실 분을 찾아요</h2>' +
      '<p class="muted">코치는 자기주도적 일경험 참여자를, 활동가는 1:1 일상회복 동행 참여자를 만나요. 둘 다 지원하셔도 돼요.</p></div>' +
      '<div class="form">' +
      '<div class="field"><label>이름</label><input type="text" id="f-name"></div>' +
      '<div class="field"><label>연락처</label><input type="tel" id="f-phone" placeholder="010-0000-0000"></div>' +
      '<div class="field"><label>거주 시도</label><select id="f-sido"><option value="">선택</option>' +
      Object.keys(REGIONS).map(s => '<option value="' + e(s) + '"' + (s === S.sido ? " selected" : "") + ">" + e(s) + "</option>").join("") + '</select></div>' +
      '<div class="field"><label>거주 시군구</label><select id="f-sigungu">' + sigunguOptions() + '</select></div>' +
      '<div class="field"><label>성별</label><div class="choices">' +
      ["남", "여"].map(v => '<label><input type="radio" name="f-sex" value="' + v + '">' + v + '</label>').join("") + '</div></div>' +
      '<div class="field"><label>나이</label><input type="number" id="f-age" min="14" max="100"></div>' +
      '<div class="field"><label>소속 <span class="hint">(학교·직장·단체 등, 없으면 비워두세요)</span></label><input type="text" id="f-org"></div>' +
      '<div class="field"><label>희망 역할 <span class="hint">(중복 선택 가능)</span></label><div class="choices">' +
      ["코치", "활동가"].map(v => '<label><input type="checkbox" class="f-role" value="' + v + '">' + v + '</label>').join("") + '</div></div>' +
      '<div class="field"><label>활동 경력 <span class="hint">(선택)</span></label><textarea id="f-exp" placeholder="관련 활동이나 경력이 있다면 적어주세요"></textarea></div>' +
      '<div class="field"><label>참여 동기</label><textarea id="f-motive" placeholder="지원 동기를 적어주세요"></textarea></div>' +
      '<label class="consent"><input type="checkbox" id="f-agree"><span>개인정보 수집·이용에 동의해요. 신청서 검토와 연락을 위해서만 써요.</span></label>' +
      (S.err ? '<p class="err">' + e(S.err) + '</p>' : '') +
      '<button class="btn btn-primary btn-block" id="f-submit" ' + (S.sending ? "disabled" : "") + '>' + (S.sending ? "보내는 중…" : "신청하기") + '</button>' +
      '</div>' + contacts();
  }

  function doneScreen() {
    return '<div class="sec-intro"><p class="eyebrow">코치·활동가 신청</p><h2>신청이 접수됐어요</h2>' +
      '<p class="muted">검토 후 담당자가 연락드릴게요. 함께해 주셔서 고마워요.</p></div>' + contacts();
  }

  function render() {
    app.innerHTML = S.screen === "done" ? doneScreen() : formScreen();
    bind();
  }

  function bind() {
    const sido = document.getElementById("f-sido");
    if (sido) sido.addEventListener("change", () => { S.sido = sido.value; S.sigungu = ""; render(); });
    const sigungu = document.getElementById("f-sigungu");
    if (sigungu) sigungu.addEventListener("change", () => { S.sigungu = sigungu.value; });
    const btn = document.getElementById("f-submit");
    if (btn) btn.addEventListener("click", submit);
  }

  async function submit() {
    const name = document.getElementById("f-name").value.trim();
    const phone = document.getElementById("f-phone").value.trim();
    const sido = document.getElementById("f-sido").value;
    const sigungu = document.getElementById("f-sigungu").value;
    const sex = (document.querySelector('input[name="f-sex"]:checked') || {}).value || "";
    const age = document.getElementById("f-age").value;
    const org = document.getElementById("f-org").value.trim();
    const roles = Array.from(document.querySelectorAll(".f-role:checked")).map(r => r.value);
    const exp = document.getElementById("f-exp").value.trim();
    const motive = document.getElementById("f-motive").value.trim();
    const agree = document.getElementById("f-agree").checked;

    if (!name || !phone) { S.err = "이름과 연락처를 입력해 주세요."; render(); return; }
    if (!sido || !sigungu) { S.err = "거주 지역을 선택해 주세요."; render(); return; }
    if (!roles.length) { S.err = "희망 역할을 하나 이상 골라주세요."; render(); return; }
    if (!motive) { S.err = "참여 동기를 적어주세요."; render(); return; }
    if (!agree) { S.err = "개인정보 수집·이용에 동의해 주셔야 신청할 수 있어요."; render(); return; }

    S.err = ""; S.sending = true; render();
    try {
      if (!DEMO) {
        const r = await api({ action: "apply", apply: { name, phone, sido, sigungu, sex, age, org, roles, exp, motive, agree } });
        if (!r.ok) throw new Error(r.error || "fail");
      }
      S.screen = "done"; S.sending = false; render();
    } catch (err) {
      S.err = "접수하지 못했어요. 다시 시도해 주세요."; S.sending = false; render();
    }
  }

  render();
})();
