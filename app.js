(function () {
  // 구글 앱스 스크립트 웹 앱 주소. 비어 있으면 저장되지 않는 체험 버전으로 동작해요.
  const API_URL = "https://script.google.com/macros/s/AKfycbzOUjsXCYytuhh8kJXmVxfor49VkKj4Nhj3Ri8bbFmfqF4duVmuR2dofbyj_V8Y7BYb-Q/exec";
  const DEMO = !API_URL;
  const REVIEW_PAGE = "review.html"; // 다시 보기·사후조사 링크는 이 페이지로 — 카카오톡 미리보기에서 신청서 링크와 구분돼요

  const YEAR = new Date().getFullYear();
  const FREQ = ["전혀 그렇지 않다", "그렇지 않다", "그렇다", "매우 그렇다"]; // 모든 문항이 같은 표현을 써요
  const GSE = ["전혀 그렇지 않다", "그렇지 않다", "그렇다", "매우 그렇다"];
  const CONTACTS = [["사람을 세우는 사람들 더유스", "02-2247-1091", "0222471091"], ["안전한사람들", "031-898-1091", "0318981091"]];
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

  const SECTIONS = [
    { id: "rel", title: "관계", lead: "요즘 사람들과의 관계에서 느끼는 점을 골라주세요.", intro: "가족, 친구, 이웃처럼 주변 사람들과의 관계를 살펴봐요.",
      // follow: '그렇다' 이상이면 이어서 적는 칸 (req: 꼭 적어야 다음으로 넘어가요)
      items: [{ t: "요즘 외롭다고 느낀다." }, { t: "가까운 사람과 만나거나 연락하는 일이 거의 없다." },
        { t: "힘들 때 도움을 청할 수 있는 사람이 있다.", rev: true, follow: { q: "그 사람은 누구인가요?", hint: "이름 대신 나와의 관계로 적어도 괜찮아요 (예: 엄마, 고등학교 친구)", req: true } },
        { t: "경제적 어려움이 생길 때 도움이 되는 사람이 있다.", rev: true, follow: { q: "그 사람은 누구인가요?", hint: "예: 어머니, 형제, 친구, 기초수급자 지원" } },
        { t: "가족과 함께 있는 시간이 불편하거나 힘들다.", follow: { q: "어떤 점이 불편하거나 힘든지 적어주세요.", hint: "예: 부모의 간섭, 부모와의 갈등, 가족 해체 등" } },
        { t: "새로운 사람과 어울리는 것이 어렵게 느껴진다.", follow: { q: "어떤 점이 가장 어렵게 느껴지나요?", hint: "예: 낯가림, 어색함, 거절에 대한 두려움 등" } },
        { t: "집에서 내 방 말고도 머무르는 곳이 있다.", rev: true, follow: { q: "어디에 주로 머무르나요?", hint: "예: 거실, 주방, 식탁, 베란다" } }] },
    { id: "emo", title: "정서", lead: "최근 2주 동안 내 마음은 어땠나요?", intro: "최근 2주 동안 느낀 마음을 떠올려 주세요. 정답은 없어요.",
      items: ["아무것도 하기 싫고 무기력하다.", "불안하고 초조하다.", "우울하고 기분이 가라앉는다.", "충분히 쉬어도 피곤하다.", "갑자기 숨이 막히거나 가슴이 뛰는 공황 같은 느낌이 든다.", "화를 참기 어렵다.",
        "조울이 있다. (기분이 크게 들떴다가 가라앉기를 반복한다)", "결벽이 있다. (청결이나 정리에 지나치게 신경이 쓰인다)", "폭력적인 언행이 있다.", "물리적인 폭력 행동이 생긴다."].map(t => ({ t })) },
    { id: "daily", title: "일상생활", lead: "최근 2주 동안의 하루는 어땠나요?", intro: "잠, 식사, 씻기처럼 매일의 생활 리듬을 살펴봐요.",
      items: ["밤낮이 바뀐 생활을 한다.", "잠드는 시간과 깨는 시간이 들쭉날쭉하다.", "씻거나 이를 닦는 일을 자주 미룬다.", "방에 설거지거리나 쓰레기가 쌓여 있다.", "끼니를 거르거나 불규칙하게 먹는다.", "일주일 동안 집 밖에 나가는 날이 거의 없다."].map(t => ({ t })) },
    { id: "mind", title: "마음과 생각", lead: "지금, 항상 드는 나의 마음과 생각을 알려주세요.", intro: "평소 나를 둘러싼 마음과 생각을 조금 더 깊이 살펴봐요.",
      items: ["노력해도 내 상황이 나아지지 않을 것 같아 무기력하게 느껴진다.", "나에게는 남들에게 내세울 만한 장점이나 재능이 딱히 없는 것 같다.", "앞으로 특별히 해보고 싶거나 기대되는 일이 별로 없다.",
        "밖에 나가거나 낯선 사람을 마주치는 상상만 해도 긴장되고 불안하다.", "사람들이 나를 이상하게 보거나 속으로 흉볼까 봐 두려운 마음이 크다.", "누군가에게 평가받는 자리나 상황은 너무 숨 막혀서 무조건 피하고 싶다.",
        "내가 지금 이렇게 힘든 건 나를 도와주지 않은 환경이나 주변 탓도 크다고 생각한다.", "내 마음을 몰라주는 사람들을 보면 억울하고 속상해서 화가 날 때가 있다.", "세상이나 사람들에 대해 불만은 많지만, 막상 내가 직접 무언가 바꾸기는 어렵다.",
        "조금이라도 스트레스받는 일이나 부담스러운 과제가 생기면 다 피하고 싶다.", "내 방(또는 집) 안에 있을 때가 가장 안전하고, 지금 이 상태를 바꾸고 싶지 않다.", "누군가와 조금이라도 불편해지면 갈등을 풀기보다 그냥 대화를 끊고 잠수 타고 싶다.",
        "사람들이 내게 이래라저래라 간섭하는 게 싫어서 일부러 반대로 하거나 무시한 적이 있다.", "겉으로는 알겠다고 대답해 놓고, 속으로는 전혀 따를 마음이 없었던 적이 있다.", "누군가와 약속을 잡아놓고도 막상 때가 되면 핑계를 대고 안 나가는 경우가 꽤 있다."].map(t => ({ t })) },
    { id: "gse", title: "나의 힘", lead: "나에 대한 생각과 가장 가까운 것을 골라주세요.", intro: "마지막으로, 어려움을 헤쳐 나가는 나의 힘을 살펴봐요.", scale: GSE, base: 1,
      items: ["만약 내가 충분한 노력을 하면 나는 항상 문제를 해결할 수 있다.", "어떤 어려움에도 불구하고 나는 항상 나의 목표를 달성한다.", "나에게 있어 목표를 따르고 달성하는 것은 쉽다.", "어떤 상황에서도 나는 자신감이 있다.",
        "나의 능력으로 인해 예상하지 못한 어떠한 상황에서도 나는 무엇을 해야 할 지를 안다.", "만약 내가 노력을 한다면, 나는 나의 문제를 해결할 수 있다.", "나는 어려움에 부딪히더라도 항상 평정을 유지한다.",
        "어떤 문제에 처해도 나는 여러 가지 해결방법을 가지고 있다.", "어떠한 문제에 부딪혀도 나는 해결 방법을 찾아낸다.", "나는 어떤 상황이든지 그것을 다룰 수 있다."].map(t => ({ t })) }
  ];
  SECTIONS.forEach(s => s.items.forEach((it, i) => { it.id = s.id + "-" + i; }));
  const FLAT = [];
  SECTIONS.forEach((s, si) => s.items.forEach((it, ii) => FLAT.push({ si, ii })));
  const CORE = [{ key: "rel", name: "관계" }, { key: "emo", name: "정서" }, { key: "daily", name: "일상생활" }, { key: "hope", name: "앞으로에 대한 마음" }];
  const KMAP = { rel: "관계", emo: "정서", daily: "일상", hope: "무망감" };
  const CORE_MSG = {
    rel: ["기댈 수 있는 사람과 연결되어 있는 편이에요.", "사람들과의 연결이 조금 느슨해져 있어요.", "가까이 기댈 사람이 적다고 느끼고 있어요."],
    emo: ["최근 마음 상태는 비교적 안정적이에요.", "무기력하거나 불안한 날이 종종 있었어요.", "최근 마음이 많이 지치고 무거웠던 것 같아요."],
    daily: ["생활 리듬을 잘 지키고 있어요.", "잠이나 식사 같은 생활 리듬이 조금 흔들리고 있어요.", "하루의 리듬이 많이 무너져 있어요. 작은 것부터 함께 되찾아 봐요."],
    hope: ["앞으로에 대한 기대를 품고 있어요.", "앞으로가 막막하게 느껴질 때가 있어요.", "노력해도 달라지지 않을 것 같은 마음이 커요."]
  };
  const LEVEL = ["ok", "watch", "care"], LEVEL_NAME = { ok: "괜찮은 편", watch: "살펴볼 필요", care: "도움이 필요" };
  const lvIdx = a => a < 1 ? 0 : a < 1.75 ? 1 : 2;
  // 단계적 회복 서비스
  const STAGES = [
    { key: "s1", step: "1단계", name: "일상회복", prog: "1:1 일상회복 동행", desc: "활동가가 직접 찾아가 생활 리듬과 외출을 함께 되찾아요.",
      best: [["oneone", "1:1 일상회복 동행"]],
      items: ["활동가는 내 이야기를 귀 기울여 들어주고 나를 존중해 주었다.", "생활 리듬(잠, 식사, 씻기 등)을 되찾는 데 도움이 되었다.", "밖에 나가거나 사람을 만나는 일이 전보다 수월해졌다."] },
    { key: "s2", step: "2단계", name: "관계형성", prog: "자조모임 · 캠프", desc: "비슷한 경험을 가진 청년들과 모임과 캠프로 함께하며 관계를 맺어요.",
      best: [["selfhelp", "자조모임"], ["camp", "캠프"]],
      items: ["모임과 캠프의 분위기가 편안하고 안전하게 느껴졌다.", "비슷한 경험을 가진 사람들과 연결되어 있다는 느낌을 받았다.", "사람들과 관계를 맺는 데 자신감이 생겼다."] },
    { key: "s3", step: "3단계", name: "자립형성", prog: "일경험", desc: "일을 직접 경험하며 자립의 계기를 만들어요.",
      best: [["work", "일경험"]],
      items: ["일경험의 내용과 방식이 나에게 잘 맞았다.", "일하는 생활 리듬과 책임감을 경험할 수 있었다.", "앞으로의 일이나 자립에 대한 구체적인 계획이 생겼다."] }
  ];
  const SAT_COMMON = ["한 단계에서 다음 단계로 넘어갈 때 안내와 연결이 충분했다.", "내 이야기의 비밀이 지켜지고 안전하게 느껴졌다.",
    "안전한더유스의 단계적 회복 서비스에 전반적으로 만족한다.", "필요할 때 이 서비스에 다시 참여하고 싶다.", "비슷한 어려움을 겪는 사람에게 이 서비스를 추천하고 싶다."];
  // 신청할 때 한 번만 묻는 문항 (기존 「나의 마음살피기」 설문지의 보기를 그대로 써요)
  const EXTRA = [
    { group: "마음의 어려움에 대해", qs: [
      { k: "cause", t: "은둔과 고립, 혹은 혼자만의 어려움의 원인은 무엇이라고 생각하나요?", type: "text", req: true,
        hint: "학교폭력, 따돌림, 가정폭력, 부모의 무관심, 갈등 등 생각나는 대로 적어주세요" },
      { k: "startAge", t: "그 어려움이 시작되었다고 생각되는 시기는 언제인가요?", type: "radio", req: true,
        opts: ["10대 초반(초등학생 나이 정도)", "10대 중반(중학생 나이 정도)", "10대 후반(고등학생 나이 정도)", "20대 초반(대학생 나이 정도)", "20대 중반", "20대 후반", "30대 초반", "30대 중반", "30대 후반", "40대 초반", "40대 중반"], etc: true },
      { k: "duration", t: "그 어려움이 이어진 지 얼마나 되었나요?", type: "radio", req: true,
        opts: ["6개월 미만", "6개월 이상 1년 미만", "2년 이하", "3년 이하", "4년 이하", "5년 이하", "6년 이하", "7년 이하", "8년 이하", "9년 이하", "10년 이하", "10년 이상"], etc: true }
    ] },
    { group: "지금까지의 노력과 관심사", qs: [
      { k: "effort", t: "지금까지 어려움을 이겨내려고 어떤 노력을 해보았나요?", type: "text", req: true,
        hint: "상담, 정신건강의학과 진료, 약물 등 해본 것을 모두 적어주세요. 없으면 ‘없음’" },
      { k: "effortHelped", t: "그 노력이 도움이 되었나요?", type: "radio", req: true, opts: ["그렇다", "그렇지 않다"],
        why: "도움이 되었던 이유, 또는 되지 않았던 이유를 알려주세요" },
      { k: "interest", t: "지금 가장 관심이 가는 것, 또는 취미로 삼고 싶은 것 한 가지를 알려주세요.", type: "text", req: false,
        hint: "예: 유튜브, 영화, 공연, 독서, 애니메이션, 여행, 산책" }
    ] }
  ];
  const EXTRA_QS = EXTRA.flatMap(g => g.qs);
  function extraMissing() {
    const x = S.extra;
    return EXTRA_QS.filter(q => q.req).filter(q =>
      q.type === "scale" ? q.rows.some(([rk]) => x["mood_" + rk] === undefined)
      : q.type === "text" ? !(x[q.k] || "").trim()
      : !x[q.k] || (x[q.k] === "etc" && !(x[q.k + "Etc"] || "").trim())).map(q => q.k);
  }
  function extraScreen() {
    const x = S.extra, miss = S.extraErr ? extraMissing() : [];
    const er = k => miss.includes(k) ? `<span class="err">답해주세요.</span>` : "";
    const field = q => {
      if (q.type === "text") return `<div class="field"><label for="x-${q.k}">${q.t}${q.req ? "" : ` <span class="hint">(선택)</span>`}</label>
        ${q.hint ? `<span class="hint">${q.hint}</span>` : ""}<textarea id="x-${q.k}" name="${q.k}">${esc(x[q.k] || "")}</textarea>${er(q.k)}</div>`;
      if (q.type === "scale") return `<fieldset class="field"><legend>${q.t}</legend>${q.rows.map(([rk, label]) => `<fieldset class="likert"><legend class="likert-q" style="font-weight:500">${label}</legend>
        <div class="likert-opts" style="grid-template-columns:repeat(4,1fr)">${FREQ.map((l, v) => `<label style="font-size:12px;padding:8px 2px;text-align:center"><input type="radio" name="mood_${rk}" id="mood_${rk}-${v}" value="${v}" ${x["mood_" + rk] === v ? "checked" : ""}>${l}</label>`).join("")}</div></fieldset>`).join("")}${er(q.k)}</fieldset>`;
      return `<fieldset class="field"><legend>${q.t}</legend>
        <div class="choices">${q.opts.map((o, i) => `<label><input type="radio" name="${q.k}" id="x-${q.k}-${i}" value="${esc(o)}" ${x[q.k] === o ? "checked" : ""}>${o}</label>`).join("")}${q.etc ? `<label><input type="radio" name="${q.k}" id="x-${q.k}-etc" value="etc" ${x[q.k] === "etc" ? "checked" : ""}>기타</label>` : ""}</div>
        ${q.etc ? `<div id="${q.k}-etcwrap" ${x[q.k] === "etc" ? "" : "hidden"}><input type="text" id="x-${q.k}Etc" name="${q.k}Etc" placeholder="직접 적어주세요" value="${esc(x[q.k + "Etc"] || "")}"></div>` : ""}
        ${q.why ? `<label for="x-${q.k}Why" class="hint" style="margin-top:4px">${q.why} (선택)</label><textarea id="x-${q.k}Why" name="${q.k}Why">${esc(x[q.k + "Why"] || "")}</textarea>` : ""}${er(q.k)}</fieldset>`;
    };
    return `${brand()}
    <section class="result-head fade"><span class="eyebrow">마지막 단계 · 거의 다 왔어요</span>
      <h1>나에 대해 조금 더 알려주세요</h1>
      <p class="muted">더 잘 맞는 도움을 준비하려고 여쭤봐요. 3분 정도 걸려요.</p></section>
    <form class="form" id="extra-form" novalidate>
      ${EXTRA.map(g => `<section class="form"><h3>${g.group}</h3>${g.qs.map(field).join("")}</section>`).join("")}
      ${miss.length ? `<span class="err">답하지 않은 문항이 ${miss.length}개 있어요.</span>` : ""}
      <button type="submit" class="btn btn-dawn btn-block">신청 마치기</button>
      <button type="button" class="link-btn" data-act="extra-back">이전으로</button>
    </form>`;
  }

  // 참여한 단계에 따라 나오는 만족도 문항 (id는 저장 쪽과 같아요: s1-0 … c-4)
  const satItems = () => STAGES.filter(st => S.satMeta.stages.includes(st.key)).flatMap(st => st.items.map((t, i) => ({ id: st.key + "-" + i, t })))
    .concat(SAT_COMMON.map((t, i) => ({ id: "c-" + i, t })));
  const stagesHtml = () => `<section class="panel"><h3>단계적 회복 서비스</h3>
      <p class="muted" style="font-size:14px">내 속도에 맞춰 한 단계씩 함께 걸어가요.</p>
      <ol class="stage-list">${STAGES.map(st => `<li><span class="stage-no">${st.step}</span><div><b>${st.name} · ${st.prog}</b><span>${st.desc}</span></div></li>`).join("")}</ol></section>`;

  // ── 상태 ──
  const token = new URLSearchParams(location.search).get("t");
  const MODE = token ? "post" : "pre";
  const KEY = MODE === "pre" ? "msg-apply-v1" : "msg-post-v1-" + token;
  const S = {
    screen: MODE === "pre" ? "form" : "loading",
    pos: 0, secIntro: true, ans: {}, follow: {}, t0: 0, lock: false,
    apply: {}, extra: {}, extraErr: false, errors: {}, sat: {}, satOpen: {}, satMeta: { stages: [], best: "" }, satErr: "",
    name: "", result: null, revisit: false, sendErr: ""
  };
  const app = document.getElementById("app");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } },
    set() { try { localStorage.setItem(KEY, JSON.stringify({ screen: S.screen, pos: S.pos, secIntro: S.secIntro, ans: S.ans, follow: S.follow, t0: S.t0, apply: S.apply, extra: S.extra, sat: S.sat, satOpen: S.satOpen, satMeta: S.satMeta })); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} }
  };

  const CONTACT_HTML = `<div class="contacts">${CONTACTS.map(([n, p, t]) => `<a class="contact-line" href="tel:${t}"><span>${n}</span><b>${p}</b></a>`).join("")}</div>`;
  const banner = () => DEMO ? `<div class="proto"><div class="proto-row"><span class="proto-label">체험 버전 · 입력한 내용은 저장되지 않아요</span></div></div>` : "";
  const SITE_NAME = MODE === "post" ? "나의 마음 다시 살피기" : "나의 마음살피기";
  document.title = SITE_NAME;
  const brand = () => `<div class="brand"><b>안전한더유스</b><span>${SITE_NAME}</span></div>`;
  const footer = () => `<footer class="foot"><span>궁금한 점이 있으면 언제든 연락하세요.</span>${CONTACT_HTML}</footer>`;
  const guideCard = () => `<div class="guide"><h3>관리자가 확인 후 활동을 안내해 드릴게요</h3><p>언제든 문의주세요.</p>${CONTACT_HTML}</div>`;
  function windowArt() {
    return `<svg viewBox="0 0 132 104" aria-hidden="true">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent-soft)"/><stop offset="1" style="stop-color:var(--dawn-soft)"/></linearGradient>
        <clipPath id="pane"><rect x="18" y="10" width="96" height="78" rx="4"/></clipPath></defs>
      <rect x="18" y="10" width="96" height="78" rx="4" fill="url(#sky)"/>
      <g clip-path="url(#pane)"><circle cx="78" cy="86" r="20" fill="var(--dawn)"/><path d="M18 74 Q50 62 82 72 T132 68 V88 H18Z" fill="var(--accent)" opacity=".35"/></g>
      <rect x="18" y="10" width="96" height="78" rx="4" fill="none" stroke="var(--ink)" stroke-width="3"/>
      <line x1="66" y1="10" x2="66" y2="88" stroke="var(--ink)" stroke-width="3"/>
      <path d="M20 12 C30 40 26 70 34 88 L20 88Z" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>
      <rect x="10" y="88" width="112" height="7" rx="2" fill="var(--ink)"/></svg>`;
  }
  function timeline(at) {
    const steps = [["신청서와 마음 살펴보기", "기본 정보와 지금의 마음 · 15분 정도"], ["관리자 검토", "확인 후 활동을 안내해 드려요"],
      ["단계적 회복 서비스", "일상회복 → 관계형성 → 자립형성"], ["만족도와 다시 살펴보기", "참여를 마칠 때 · 10분 정도"]];
    return `<ol class="timeline">${steps.map(([b, s], i) => `<li class="${i < at ? "done" : i === at ? "now" : ""}"><div><b>${b}</b><span>${s}</span></div></li>`).join("")}</ol>`;
  }

  // ── 신청서 ──
  const isDobong = a => a.sido === "서울특별시" && a.sigungu === "도봉구";
  function eligibility() {
    const a = S.apply, y = parseInt(a.year, 10);
    if (!a.sigungu || !(y > 1900 && y <= YEAR)) return null;
    const age = YEAR - y, max = isDobong(a) ? 45 : 39;
    return { ok: age >= 19 && age <= max, max };
  }
  const eligHtml = el => el.ok ? `<p class="elig yes">신청할 수 있는 나이예요.</p>`
    : `<p class="elig no">이 사업은 만 19~${el.max}세 청년을 대상으로 해요. 다른 도움이 필요하면 아래 연락처로 물어봐 주세요.</p>`;
  function addrHtml() {
    const a = S.apply, sgg = a.sido ? REGIONS[a.sido].split(" ") : [];
    const opt = (list, cur, ph) => `<option value="">${ph}</option>` + list.map(x => `<option ${x === cur ? "selected" : ""}>${x}</option>`).join("");
    return `<div class="addr">
        <select id="sido" name="sido" aria-label="시/도">${opt(Object.keys(REGIONS), a.sido, "시/도")}</select>
        <select id="sigungu" name="sigungu" aria-label="시/군/구" ${a.sido ? "" : "disabled"}>${opt(sgg, a.sigungu, "시/군/구")}</select>
        <input type="text" id="dong" name="dong" aria-label="동" placeholder="동 직접 입력 (예: 창동)" value="${esc(a.dong || "")}">
      </div>`;
  }
  function formScreen() {
    const a = S.apply, e = S.errors, el = eligibility();
    const radio = (n, vals) => vals.map(([v, l]) => `<label><input type="radio" name="${n}" id="${n}-${v}" value="${v}" ${a[n] === v ? "checked" : ""}>${l}</label>`).join("");
    const check = (n, vals) => vals.map(([v, l]) => `<label><input type="checkbox" name="${n}" id="${n}-${v}" value="${v}" ${(a[n] || []).includes(v) ? "checked" : ""}>${l}</label>`).join("");
    const etc = (n, ph) => `<div id="${n}-etc-wrap" ${a[n] === "etc" ? "" : "hidden"}><input type="text" id="${n}Etc" name="${n}Etc" placeholder="${ph}" value="${esc(a[n + "Etc"] || "")}"></div>`;
    const er = (k, m) => e[k] ? `<span class="err">${m}</span>` : "";
    return `${brand()}
    <section class="hero fade">${windowArt()}
      <span class="eyebrow">단계적 회복을 위한 청년 지원 사업</span>
      <h1>일상회복에서 존엄한 자립을 위한 선택</h1>
      <p class="muted">기본 정보를 적고, 이어서 지금의 마음을 살펴봐요. 중간에 멈춰도 이 기기에서 다시 열면 이어서 할 수 있어요.</p>
    </section>
    ${stagesHtml()}
    ${timeline(0)}
    <form class="form" id="apply-form" novalidate>
      <div class="field"><label for="name">이름 <span class="hint">실명으로 적어주세요</span></label>
        <input type="text" id="name" name="name" autocomplete="name" value="${esc(a.name || "")}">${er("name", "이름을 적어주세요.")}</div>
      <fieldset class="field"><legend>성별</legend><div class="choices">${radio("sex", [["m", "남성"], ["f", "여성"]])}</div>${er("sex", "성별을 골라주세요.")}</fieldset>
      <div class="field"><label for="year">태어난 해</label>
        <input type="number" id="year" name="year" inputmode="numeric" placeholder="예: 1998" value="${esc(a.year || "")}">
        <span class="hint">도봉구는 만 19~45세, 그 외 지역은 만 19~39세 청년이 신청할 수 있어요.</span>${er("year", "태어난 해를 네 자리 숫자로 적어주세요.")}</div>
      <fieldset class="field"><legend>사는 곳</legend><div id="addr">${addrHtml()}</div>
        ${er("addr", "시/도와 시/군/구를 고르고, 동을 적어주세요.")}<div id="elig">${el ? eligHtml(el) : ""}</div></fieldset>
      <div class="field"><label for="phone">연락처</label>
        <input type="tel" id="phone" name="phone" autocomplete="tel" placeholder="010-0000-0000" value="${esc(a.phone || "")}">${er("phone", "010-0000-0000 형식으로 적어주세요.")}</div>
      <fieldset class="field"><legend>가장 편한 연락 방법</legend><div class="choices">${radio("contact", [["kakao", "카카오톡"], ["sms", "문자"], ["call", "전화"], ["etc", "그 밖에"]])}</div>
        ${etc("contact", "편한 연락 방법을 적어주세요 (예: 이메일)")}${er("contact", "연락 방법을 골라주세요.")}${er("contactEtc", "어떤 방법이 편한지 적어주세요.")}</fieldset>
      <fieldset class="field"><legend>함께 사는 사람</legend><div class="choices">${radio("house", [["family", "가족과 함께"], ["alone", "혼자"], ["etc", "그 밖에"]])}</div>
        ${etc("house", "누구와 함께 사는지 적어주세요")}${er("houseEtc", "누구와 함께 사는지 적어주세요.")}</fieldset>
      <fieldset class="field"><legend>지금 일을 하고 있나요?</legend><div class="choices">${radio("work", [["no", "하고 있지 않아요"], ["part", "가끔 하고 있어요"], ["yes", "하고 있어요"]])}</div></fieldset>
      <fieldset class="field"><legend>원하는 지원 <span class="hint">(여러 개 골라도 돼요)</span></legend>
        <div class="choices">${check("want", [["rhythm", "생활 리듬·외출 되찾기 (1단계)"], ["peer", "비슷한 청년들과의 만남 (2단계)"], ["job", "일·진로 경험 (3단계)"], ["talk", "마음 이야기 나누기"]])}</div></fieldset>
      <fieldset class="field"><legend>이 사업을 어떻게 알게 되었나요?</legend>
        <div class="choices">${radio("route", [["family", "가족·지인"], ["org", "관계기관"], ["sns", "인터넷·SNS"], ["poster", "홍보물"], ["etc", "그 밖에"]])}</div>
        ${etc("route", "어떻게 알게 되었는지 적어주세요")}${er("routeEtc", "어떻게 알게 되었는지 적어주세요.")}</fieldset>
      <label class="consent"><input type="checkbox" id="agree" name="agree" ${a.agree ? "checked" : ""}>
        <span><b>[필수] 개인정보 수집·이용 동의</b><br><span class="muted">이름, 성별, 태어난 해, 사는 곳, 연락처를 대상자 검토와 서비스 제공에만 쓰고, 사업 종료 후 파기해요.</span></span></label>
      ${er("agree", "신청하려면 개인정보 수집·이용 동의가 필요해요.")}
      <label class="consent"><input type="checkbox" id="research" name="research" ${a.research ? "checked" : ""}>
        <span><b>[필수] 검사 결과 활용 동의</b><br><span class="muted">지금의 마음 살펴보기와 활동 후 다시 살펴보기 결과를 대상자 검토와 서비스 효과 분석에 써요. 분석할 때는 이름과 연락처를 지워요.</span></span></label>
      ${er("research", "검사 결과 활용 동의가 필요해요.")}
      <label class="consent"><input type="checkbox" id="waitlist" name="waitlist" ${a.waitlist ? "checked" : ""}>
        <span><b>[선택] 다음 모집 연락 동의</b><br><span class="muted">이번에 함께하지 못하게 되면, 신청 내용을 보관했다가 다음 모집 때 연락드려요. 동의하지 않으면 선정되지 않았을 때 개인정보를 지워요.</span></span></label>
      ${er("elig", "신청 가능한 나이가 아니에요.")}
      <button type="submit" class="btn btn-dawn btn-block">다음 · 지금의 마음 살펴보기</button>
    </form>
    ${footer()}`;
  }

  // ── 검사 ──
  function progress() {
    const { si } = FLAT[S.pos];
    const steps = SECTIONS.map((s, i) => {
      const f = i < si ? 1 : i === si ? (S.secIntro ? 0 : FLAT[S.pos].ii / s.items.length) : 0;
      return `<span><b style="transform:scaleX(${f})"></b></span>`;
    }).join("");
    return `<div class="progress"><div class="steps">${steps}</div>
      <div class="step-label"><span>${si + 1} / ${SECTIONS.length} · ${SECTIONS[si].title}</span><span>${S.pos + 1} / ${FLAT.length}</span></div></div>`;
  }
  function secIntro() {
    const s = SECTIONS[FLAT[S.pos].si];
    return `${progress()}
    <section class="sec-intro fade">
      <span class="eyebrow">${FLAT[S.pos].si + 1}번째 · ${s.items.length}문항</span>
      <h2>${s.title}</h2><p class="muted">${s.intro}</p>
      <button class="btn btn-primary btn-block" data-act="go">시작</button>
      <div class="nav-row"><button class="link-btn" data-act="back">이전으로</button><span></span></div>
    </section>`;
  }
  const needsFollow = (it, v) => !!it.follow && v >= 2;
  const followText = id => S.follow[id] || "";
  function question() {
    const { si, ii } = FLAT[S.pos], s = SECTIONS[si], it = s.items[ii];
    const scale = s.scale || FREQ, base = s.base || 0, cur = S.ans[it.id], showFollow = needsFollow(it, cur);
    const f = it.follow, txt = followText(it.id);
    const followHtml = showFollow ? `<div class="follow fade"><label for="followText"><b>${f.q}</b>${f.req ? "" : ` <span class="hint">(선택)</span>`}</label>
        <span class="hint">${f.hint}</span>
        <input type="text" id="followText" name="followText" placeholder="적어주세요" value="${esc(txt)}">
        <button class="btn btn-primary btn-block" data-act="next" ${f.req && !txt.trim() ? "disabled" : ""}>다음</button></div>` : "";
    return `${progress()}
    <section class="q fade" aria-live="polite">
      <p class="q-lead">${s.lead}</p><h2>${it.t}</h2>
      <div class="opts" role="radiogroup">${scale.map((label, k) => `<button class="opt" role="radio" aria-checked="${cur === k + base}" data-act="answer" data-v="${k + base}"><span class="dot"></span>${label}</button>`).join("")}</div>
      ${followHtml}
      <div class="nav-row"><button class="link-btn" data-act="back">이전 문항</button>${cur !== undefined && !showFollow ? `<button class="link-btn" data-act="next">다음</button>` : "<span></span>"}</div>
    </section>`;
  }
  function score(ans) {
    const val = it => { const v = ans[it.id]; return v === undefined ? undefined : it.rev ? 3 - v : v; };
    const avg = items => { const v = items.map(val).filter(x => x !== undefined); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
    const by = id => SECTIONS.find(s => s.id === id).items, mind = by("mind");
    return { rel: avg(by("rel")), emo: avg(by("emo")), daily: avg(by("daily")), hope: avg(mind.slice(0, 3)), mindAll: avg(mind),
      gse: by("gse").reduce((a, i) => a + (ans[i.id] || 0), 0) };
  }

  // ── 신청 접수 완료 ──
  function doneScreen() {
    const o = score(S.ans);
    const myLink = S.myToken ? (location.origin + location.pathname.replace(/[^/]*$/, "") + REVIEW_PAGE + "?t=" + S.myToken) : "";
    return `${brand()}
    <section class="result-head fade"><span class="eyebrow">신청 완료</span>
      <h1>신청이 접수되었어요</h1>
      <p class="muted">천천히 한걸음씩 우리 함께 걸어가며 이야기 나눠요.</p></section>
    ${guideCard()}
    <section class="panel"><h3>지금 나의 마음</h3>
      ${CORE.map(c => { const v = o[c.key], i = lvIdx(v);
        return `<div class="dom"><div class="dom-top"><b>${c.name}</b><span class="chip ${LEVEL[i]}">${LEVEL_NAME[LEVEL[i]]}</span></div>
        <div class="track"><i class="${LEVEL[i]}" style="width:${Math.max(4, v / 3 * 100)}%"></i></div><p>${CORE_MSG[c.key][i]}</p></div>`; }).join("")}
      <p class="muted" style="margin-top:14px">‘살펴볼 필요’·‘도움이 필요’는 지금 상태를 함께 들여다보자는 뜻이지 평가가 아니에요. 담당자가 신청 내용을 보고 필요한 도움을 같이 찾아요.</p>
    </section>
    ${myLink ? `<section class="panel"><h3>이 결과 나중에 다시 보기</h3>
      <p class="muted">아래 링크를 저장해두면 언제든 이 결과를 다시 볼 수 있어요.</p>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px">
        <input id="myLinkInput" type="text" readonly value="${esc(myLink)}" onclick="this.select()" style="flex:1 1 220px;min-width:0;font-size:13px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink)">
        <button class="btn btn-ghost" data-act="copy-link" data-link="${esc(myLink)}">링크 복사하기</button>
      </div>
      <p class="hint" id="copyMsg"></p>
    </section>` : ""}
    ${timeline(1)}
    ${DEMO ? `<button class="btn btn-ghost btn-block" data-act="demo-post">체험 계속하기 · 활동을 마쳤다고 보고 마지막 단계 해보기</button>` : ""}
    ${footer()}`;
  }

  const STATUS_MSG = {
    "검토 대기": "신청서를 확인하고 있어요. 조금만 기다려 주세요.",
    "선정·서비스 중": "지금 함께 활동을 이어가고 있어요.",
    "미선정": "이번 모집에서는 함께하지 못했지만, 신청할 때 살펴본 마음은 그대로예요."
  };
  function preResultScreen() {
    const o = S.preResult || {};
    return `${brand()}
    <section class="result-head fade"><span class="eyebrow">${esc(S.pStatus || "")}</span>
      <h1>${S.name ? esc(S.name) + "님, " : ""}신청할 때 살펴본 마음이에요</h1>
      <p class="muted">${STATUS_MSG[S.pStatus] || "활동을 마칠 때 이 링크로 다시 들어오면 사후조사로 이어져요."}</p></section>
    <section class="panel"><h3>그때의 나의 마음</h3>
      ${CORE.map(c => { const v = Number(o[KMAP[c.key]]) || 0, i = lvIdx(v);
        return `<div class="dom"><div class="dom-top"><b>${c.name}</b><span class="chip ${LEVEL[i]}">${LEVEL_NAME[LEVEL[i]]}</span></div>
        <div class="track"><i class="${LEVEL[i]}" style="width:${Math.max(4, v / 3 * 100)}%"></i></div><p>${CORE_MSG[c.key][i]}</p></div>`; }).join("")}
      <p class="muted" style="margin-top:14px">‘살펴볼 필요’·‘도움이 필요’는 지금 상태를 함께 들여다보자는 뜻이지 평가가 아니에요. 담당자가 신청 내용을 보고 필요한 도움을 같이 찾아요.</p>
    </section>
    ${footer()}`;
  }

  // ── 활동 후: 만족도 → 다시 살펴보기 → 나의 변화 ──
  const who = () => esc(S.name || "");
  function postWelcome() {
    return `${brand()}
    <section class="hero fade">${windowArt()}
      <h1>${who() ? who() + "님, " : ""}그동안 정말 수고했어요</h1>
      <p class="muted">먼저 함께한 시간이 어땠는지 들려주세요. 이어서 처음에 답했던 마음 질문을 한 번 더 드리고, 다 마치면 그동안의 변화를 보여드릴게요.</p>
      <ul class="facts"><li>만족도는 참여한 단계에 따라 8~14문항, 마음 살펴보기는 ${FLAT.length}문항이에요. 10분 정도 걸려요.</li><li>중간에 멈춰도 이 링크로 다시 들어오면 이어서 할 수 있어요.</li></ul>
      <button class="btn btn-primary btn-block" data-act="to-sat">시작하기</button>
    </section>${footer()}`;
  }
  function satScreen() {
    const M = S.satMeta, chosen = STAGES.filter(st => M.stages.includes(st.key));
    let n = 0;
    const likert = it => { const i = ++n;
      return `<fieldset class="likert"><legend class="likert-q">${i}. ${it.t}</legend>
        <div class="likert-opts">${[1, 2, 3, 4, 5].map(v => `<label><input type="radio" name="${it.id}" id="${it.id}-${v}" value="${v}" ${S.sat[it.id] == v ? "checked" : ""}>${v}</label>`).join("")}</div>
        <div class="likert-ends"><span>전혀 그렇지 않다</span><span>매우 그렇다</span></div></fieldset>`; };
    const err = k => S.satErr === k ? `<span class="err">${{ stage: "함께한 단계를 하나 이상 골라주세요.", best: "가장 만족한 프로그램을 하나 골라주세요.", items: "아직 답하지 않은 문항이 있어요." }[k]}</span>` : "";
    return `${brand()}
    <section class="result-head fade"><span class="eyebrow">1 / 2 · 만족도</span>
      <h1>함께한 시간은 어땠나요?</h1><p class="muted">솔직한 의견이 다음 청년을 돕는 데 쓰여요. 활동가에게 개별 응답은 보이지 않아요.</p></section>
    <form class="form" id="sat-form" novalidate>
      <section class="form"><h3>함께한 단계</h3>
        <fieldset class="field"><legend>참여한 단계를 모두 골라주세요</legend>
          <div class="choices">${STAGES.map(st => `<label><input type="checkbox" name="satStage" id="satStage-${st.key}" value="${st.key}" ${M.stages.includes(st.key) ? "checked" : ""}>${st.step} · ${st.prog}</label>`).join("")}</div></fieldset>${err("stage")}</section>
      ${chosen.length ? `<section class="form"><h3>가장 만족한 프로그램</h3>
        <fieldset class="field"><legend>하나만 골라주세요</legend>
          <div class="choices">${chosen.flatMap(st => st.best).map(([v, l]) => `<label><input type="radio" name="satBest" id="satBest-${v}" value="${v}" ${M.best === v ? "checked" : ""}>${l}</label>`).join("")}</div></fieldset>${err("best")}
        <div class="field"><label for="bestWhy">그 프로그램이 좋았던 이유는 무엇인가요? <span class="hint">(선택)</span></label><textarea id="bestWhy" name="bestWhy">${esc(S.satOpen.bestWhy || "")}</textarea></div></section>
      ${chosen.map(st => `<section class="form"><h3>${st.step} · ${st.prog}</h3>${st.items.map((t, i) => likert({ id: st.key + "-" + i, t })).join("")}</section>`).join("")}
      <section class="form"><h3>안전한더유스 서비스 전체</h3>${SAT_COMMON.map((t, i) => likert({ id: "c-" + i, t })).join("")}</section>
      <section class="form"><h3>자유롭게 들려주세요</h3>
        <div class="field"><label for="good">가장 도움이 되었던 것은 무엇인가요? <span class="hint">(선택)</span></label><textarea id="good" name="good">${esc(S.satOpen.good || "")}</textarea></div>
        <div class="field"><label for="better">아쉬웠거나 바뀌었으면 하는 점이 있나요? <span class="hint">(선택)</span></label><textarea id="better" name="better">${esc(S.satOpen.better || "")}</textarea></div>
        <div class="field"><label for="next">앞으로 더 받고 싶은 지원이 있나요? <span class="hint">(선택)</span></label><textarea id="next" name="next">${esc(S.satOpen.next || "")}</textarea></div></section>
      ${err("items")}
      <button type="submit" class="btn btn-dawn btn-block">다음 · 마음 다시 살펴보기</button>` : `<p class="muted">참여한 단계를 고르면 그 단계에 대한 질문이 이어서 나와요.</p>`}
    </form>`;
  }
  function dumbRow(name, pre, post, max, invert) {
    const x = v => Math.max(0, Math.min(100, (v / max) * 100));
    const d = post - pre, better = invert ? d > 0 : d < 0, eps = max > 3 ? 1 : 0.2;
    const cls = Math.abs(d) < eps ? "same" : better ? "better" : "worse";
    const amt = max > 3 ? Math.abs(d).toFixed(0) + "점" : Math.abs(d).toFixed(1) + "점";
    const txt = cls === "same" ? "비슷해요" : invert ? `${amt} ${better ? "단단해졌어요" : "약해졌어요"}` : `${amt} ${better ? "가벼워졌어요" : "무거워졌어요"}`;
    const lo = Math.min(x(pre), x(post)), hi = Math.max(x(pre), x(post));
    return `<div class="dumb"><div class="dumb-top"><b>${name}</b><em class="${cls}">${txt}</em></div>
      <div class="dtrack"><span class="seg-line" style="left:${lo}%;width:${hi - lo}%"></span><span class="pre" style="left:${x(pre)}%"></span><span class="post" style="left:${x(post)}%"></span></div></div>`;
  }
  const legend = txt => `<div class="legend"><span><i class="pre"></i>처음</span><span><i class="post"></i>지금</span><span>${txt}</span></div>`;

  // ── 나의 변화: 숫자에 의미를 붙여요 ──
  // 서버와 같은 이름의 점수(관계, 정서, 일상, 무망감, 대인기피, 비난, 회피, 수동공격, 효능감)로 바꿔요.
  function keyed(ans) {
    const s = score(ans), mind = SECTIONS.find(x => x.id === "mind").items;
    const t = from => mind.slice(from, from + 3).reduce((a, it) => a + (ans[it.id] || 0), 0) / 3;
    return { 관계: s.rel, 정서: s.emo, 일상: s.daily, 무망감: s.hope, 대인기피: t(3), 비난: t(6), 회피: t(9), 수동공격: t(12), 효능감: s.gse };
  }
  const mindAll = o => (o.무망감 + o.대인기피 + o.비난 + o.회피 + o.수동공격) / 5;
  const AREAS = [
    { key: "관계", name: "관계", better: "사람과의 거리가 조금씩 가까워졌어요. 누군가와 이어져 있다는 감각은 다시 세상으로 나아가는 가장 든든한 발판이에요.",
      steady: "기댈 수 있는 관계를 잘 지켜왔어요.", hold: "관계는 천천히 변하는 영역이에요. 지금 곁에 있는 한 사람과의 연결을 소중히 이어가 보세요.",
      worse: "요즘 사람들과의 관계가 더 버겁게 느껴졌을 수 있어요. 그런 시기도 있어요. 혼자 감당하지 않도록 언제든 연락 주세요.",
      next: "일주일에 한 번, 편한 사람에게 짧은 안부 메시지 보내기" },
    { key: "정서", name: "정서", better: "마음의 무게가 가벼워졌어요. 무기력이나 불안이 줄었다는 건 스스로를 돌볼 힘이 생겼다는 뜻이에요.",
      steady: "마음을 안정적으로 지켜내고 있어요.", hold: "마음은 오르내리며 회복돼요. 지금 느끼는 감정을 알아차리는 것만으로도 이미 한 걸음이에요.",
      worse: "최근 마음이 더 무거웠던 것 같아요. 그 마음을 혼자 두지 말고 꼭 이야기 나눠 주세요.",
      next: "마음이 무거운 날, 그 마음을 한 줄로 적어 보거나 믿을 만한 사람에게 말해 보기" },
    { key: "일상", name: "일상생활", better: "하루의 리듬이 돌아오고 있어요. 잠, 식사, 씻기 같은 작은 습관은 몸과 마음이 다시 움직일 준비가 되었다는 신호예요.",
      steady: "생활 리듬을 잘 지키고 있어요.", hold: "생활 리듬은 작은 것 하나부터 바뀌어요. 오늘 할 수 있는 한 가지를 정해 보세요.",
      worse: "요즘 하루를 꾸리는 게 더 어려웠을 수 있어요. 무리하지 말고 쉬운 것 하나부터 다시 시작해요.",
      next: "매일 같은 시간에 일어나기, 하루 한 번 창문 열기처럼 쉬운 것 하나 정하기" },
    { key: "무망감", name: "앞으로에 대한 마음", better: "‘해도 안 될 거야’라는 마음이 줄었어요. 앞으로를 그려볼 여유가 생겼다는 건 아주 큰 변화예요.",
      steady: "앞으로에 대한 기대를 잘 품고 있어요.", hold: "앞날이 여전히 막막하게 느껴질 수 있어요. 큰 계획보다 다음 주에 해볼 작은 일 하나면 충분해요.",
      worse: "앞으로가 더 막막하게 느껴졌을 수 있어요. 그 마음을 꼭 누군가와 나눠 주세요.",
      next: "다음 주에 해보고 싶은 아주 작은 일 하나 적어 두기" },
    { key: "mind", name: "마음과 생각", better: "사람을 피하거나 스스로를 몰아세우던 마음이 조금 느슨해졌어요. 세상을 대하는 마음에 여유가 생겼어요.",
      steady: "흔들리지 않고 마음의 중심을 잘 지켜왔어요.", hold: "오래 쌓인 생각의 습관은 천천히 풀려요. 조급해하지 않아도 괜찮아요.",
      worse: "요즘 사람이나 상황을 피하고 싶은 마음이 커졌을 수 있어요. 그만큼 지쳤다는 뜻이니, 쉬어가도 괜찮아요.",
      next: "부담스러운 일은 작게 쪼개서 하나씩 해보기" }
  ];
  function areaState(pre, post) {
    const d = post - pre, lv = lvIdx(post);
    if (d <= -0.2) return "better";
    if (d >= 0.2) return "worse";
    return lv === 0 ? "steady" : "hold";
  }
  function changeScreen() {
    const R = S.result, P = R.pre, Q = R.post;
    const val = (o, k) => k === "mind" ? mindAll(o) : o[k];
    const rows = AREAS.map(a => ({ a, pre: val(P, a.key), post: val(Q, a.key) })).map(r => Object.assign(r, { st: areaState(r.pre, r.post), gain: r.pre - r.post }));
    const gseGain = Q.효능감 - P.효능감;
    const cands = rows.map(r => ({ name: r.a.name, gain: r.gain / 3, text: r.a.better })).concat([{ name: "나의 힘", gain: gseGain / 30, text: "‘나도 해낼 수 있다’는 믿음이 자랐어요. 함께한 시간 동안 직접 해낸 경험들이 쌓인 결과예요." }]);
    const top = cands.filter(c => c.gain > 0.05).sort((x, y) => y.gain - x.gain)[0];
    const better = rows.filter(r => r.st === "better").map(r => r.a.name);
    const needs = rows.filter(r => r.st === "worse" || lvIdx(r.post) === 2);
    const gseText = gseGain >= 3 ? "‘나도 해낼 수 있다’는 믿음이 자랐어요. 함께한 시간 동안 직접 해낸 경험들이 쌓인 결과예요."
      : gseGain <= -3 ? "요즘 스스로를 믿기 어려웠을 수 있어요. 지금까지 버텨온 것 자체가 힘이에요."
      : "스스로를 믿는 마음을 지켜왔어요. 작은 성공을 하나씩 쌓으면 더 단단해져요.";
    const name = who();
    const helperPre = esc(R.helperPre || ""), helperPost = esc(R.helperPost || "");
    return `${brand()}
    <section class="result-head fade"><span class="eyebrow">${S.revisit ? "다시 보는 나의 변화" + (R.doneAt ? " · " + esc(R.doneAt) + " 기록" : "") : "모두 마쳤어요"}</span>
      <h1>${name ? name + "님의 " : "나의 "}변화</h1>
      <p class="muted">숫자는 성적이 아니에요. 처음의 나와 지금의 나를 나란히 비춰보는 거울이에요.
        ${better.length ? `처음과 비교해 <b>${better.join(", ")}</b>에서 변화가 보여요. 그 변화는 ${name ? name + "님이" : "내가"} 직접 만들어 낸 거예요.` : "숫자로는 큰 변화가 보이지 않아도, 끝까지 함께한 시간 자체가 이미 큰 걸음이에요."}</p></section>
    ${(R.stages || []).length ? `<section class="panel"><h3>함께 걸어온 길</h3>
      <ol class="path">${STAGES.map(st => `<li class="${R.stages.includes(st.key) ? "on" : ""}"><span>${st.step}</span><b>${st.name}</b><small>${st.prog}</small></li>`).join("")}</ol>
      <p class="muted" style="font-size:14px">${R.stages.length === 3 ? "일상회복에서 자립까지 세 단계를 모두 함께 걸어왔어요. 정말 긴 걸음이었어요." : R.stages.length === 2 ? "두 단계를 함께 걸어왔어요. 한 단계씩 넘어설 때마다 새로운 문을 연 거예요." : "첫 걸음을 함께 걸어왔어요. 다음 단계가 궁금해지면 언제든 이야기해 주세요."}${R.best ? ` 가장 만족한 프로그램은 <b>${esc(R.best)}</b>였어요.` : ""}</p></section>` : ""}
    <section class="guide" style="background:var(--dawn-soft)">
      <span class="eyebrow" style="color:var(--dawn)">${top ? "가장 크게 달라진 것" : "변화보다 소중한 것"}</span>
      <h3>${top ? top.name : "멈추지 않고 끝까지 온 것"}</h3>
      <p>${top ? top.text : "회복은 직선이 아니라 오르내리며 나아가요. 활동을 시작하고 마지막까지 함께한 것 자체가 다시 움직이기 시작했다는 증거예요."}</p>
    </section>
    ${helperPost || helperPre ? `<section class="panel"><h3>힘들 때 떠오르는 사람</h3>
      <dl class="kv"><dt>처음</dt><dd>${helperPre || "떠오르는 사람이 없었어요"}</dd><dt>지금</dt><dd><b>${helperPost || "떠오르는 사람이 없어요"}</b></dd></dl>
      <p class="muted" style="font-size:14px">${helperPost && !helperPre ? "힘들 때 떠올릴 사람이 생겼어요. 숫자보다 더 큰 변화일 수 있어요." : helperPost ? "기댈 수 있는 사람이 곁에 있어요. 그 연결을 소중히 이어가 보세요." : "아직 떠오르는 사람이 없어도 괜찮아요. 더유스가 그 한 사람이 되어 드릴게요."}</p></section>` : ""}
    ${R.good ? `<section class="panel"><h3>내가 꼽은 가장 도움이 된 것</h3><p style="font-size:16px">“${esc(R.good)}”</p>
      <p class="muted" style="font-size:14px">도움이 되었던 것을 알면, 앞으로 힘들 때 무엇을 붙잡으면 될지도 알 수 있어요.</p></section>` : ""}
    <section class="panel"><h3>영역별로 보면</h3>${legend("왼쪽일수록 가벼운 상태")}
      ${rows.map(r => `${dumbRow(r.a.name, r.pre, r.post, 3)}<p class="muted" style="font-size:14px;margin-top:-6px">${r.a[r.st]}</p>`).join("")}</section>
    <section class="panel" style="background:var(--dawn-soft)"><h3>나의 힘</h3>${legend("오른쪽일수록 단단한 상태")}
      ${dumbRow("자기효능감", P.효능감 - 10, Q.효능감 - 10, 30, true)}<p class="muted" style="font-size:14px;margin-top:-6px">${gseText}</p></section>
    <section class="panel"><h3>앞으로 한 걸음</h3>
      ${needs.length ? `<p class="muted" style="font-size:14px">아직 무겁게 느껴지는 영역이 있어요. 이런 것부터 해보면 어떨까요?</p>
        <ol class="next">${needs.slice(0, 3).map(r => `<li><span><b>${r.a.name}</b> · ${r.a.next}</span></li>`).join("")}</ol>`
        : `<p class="muted" style="font-size:14px">지금의 리듬을 그대로 이어가 보세요. 힘든 날이 다시 와도, 이번에 해낸 경험이 있다는 걸 기억해 주세요.</p>`}
      <p style="font-size:14px">더 이야기 나누고 싶다면 언제든 연락 주세요.</p>${CONTACT_HTML}</section>
    <div class="review-note" style="border-style:solid"><b>이 화면을 다시 보려면</b> · 받은 링크로 언제든 다시 들어오면 돼요. 문자나 카카오톡 메시지를 지우지 말고 남겨 두세요. 휴대폰 브라우저 메뉴에서 ‘홈 화면에 추가’를 해두면 더 쉽게 열 수 있어요.</div>`;
  }
  function msgScreen(title, body) {
    return `${brand()}<section class="hero fade">${windowArt()}<h1>${title}</h1><p class="muted">${body}</p></section>${guideCard()}`;
  }
  function resumeScreen() {
    return `${brand()}<section class="hero fade">${windowArt()}
      <h1>이어서 할까요?</h1><p class="muted">${S._draft && S._draft.screen === "extra" ? "마지막 단계에서 멈췄어요." : `지난번 ${S.pos + 1}번째 문항에서 멈췄어요.`} 그동안 답한 내용은 그대로 있어요.</p>
      <button class="btn btn-primary btn-block" data-act="resume">이어서 하기</button>
      <button class="btn btn-ghost btn-block" data-act="fresh">처음부터 다시 하기</button></section>`;
  }

  // ── 렌더 ──
  function renderScreen() {
    const sc = S.screen;
    let body;
    if (sc === "form") body = formScreen();
    else if (sc === "survey") body = S.secIntro ? secIntro() : question();
    else if (sc === "extra") body = extraScreen();
    else if (sc === "sending") body = msgScreen("보내는 중이에요", "잠시만 기다려 주세요. 창을 닫지 말아 주세요.").replace(guideCard(), "");
    else if (sc === "sendError") body = `${msgScreen("보내지 못했어요", "인터넷 연결을 확인하고 다시 보내기를 눌러주세요. 답한 내용은 이 기기에 남아 있어요.")}
      <button class="btn btn-primary btn-block" data-act="retry">다시 보내기</button>`;
    else if (sc === "done") body = doneScreen();
    else if (sc === "loading") body = msgScreen("불러오는 중이에요", "잠시만 기다려 주세요.").replace(guideCard(), "");
    else if (sc === "loadError") body = `${msgScreen("불러오지 못했어요", "인터넷 연결을 확인하고 다시 시도해 주세요.")}
      <button class="btn btn-primary btn-block" data-act="reload">다시 시도</button>`;
    else if (sc === "invalid") body = msgScreen("링크를 확인해 주세요", "이 링크로는 열 수 없어요. 받은 링크를 다시 확인하거나 아래로 문의해 주세요.");
    else if (sc === "notyet") body = msgScreen("아직 열리지 않았어요", "활동을 마칠 때 관리자가 열어 드려요. 그때 이 링크로 다시 들어와 주세요.");
    else if (sc === "preResult") body = preResultScreen();
    else if (sc === "postWelcome") body = postWelcome();
    else if (sc === "resume") body = resumeScreen();
    else if (sc === "sat") body = satScreen();
    else if (sc === "finished") body = msgScreen("이미 모두 마쳤어요", "끝까지 답해줘서 고마워요. 그동안 정말 수고했어요.");
    else body = changeScreen();
    app.innerHTML = banner() + body;
  }
  function render() {
    try { renderScreen(); }
    catch (e) { app.innerHTML = banner() + msgScreen("화면을 열지 못했어요", "잠시 뒤 다시 열어 주세요. 계속 이러면 아래로 문의해 주세요."); }
  }
  const top = () => window.scrollTo(0, 0);
  const go = sc => { S.screen = sc; store.set(); render(); top(); };

  async function api(payload) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl.signal });
      return await res.json();
    } finally { clearTimeout(timer); }
  }
  async function submit() {
    const secs = Math.round((Date.now() - S.t0) / 1000);
    S.screen = "sending"; render(); top();
    if (DEMO) {
      if (MODE === "pre") { store.clear(); S.screen = "done"; }
      else {
        S.result = { pre: { 관계: 2, 정서: 2, 일상: 2, 무망감: 2.3, 대인기피: 2, 비난: 1.3, 회피: 2.3, 수동공격: 1, 효능감: 18 }, post: keyed(S.ans),
          helperPre: "", helperPost: followText("rel-2"), good: S.satOpen.good || "", stages: S.satMeta.stages, best: (STAGES.flatMap(st => st.best).find(b => b[0] === S.satMeta.best) || ["", ""])[1], doneAt: "" };
        store.clear(); S.screen = "change";
      }
      render(); top(); return;
    }
    try {
      const r = MODE === "pre"
        ? await api({ action: "apply", apply: S.apply, answers: S.ans, helper: followText("rel-2"), follow: S.follow, extra: S.extra, secs })
        : await api({ action: "post", token, answers: S.ans, helper: followText("rel-2"), follow: S.follow, sat: Object.fromEntries(satItems().map(it => [it.id, S.sat[it.id]])), satMeta: S.satMeta, satOpen: S.satOpen, secs });
      if (!r.ok) {
        if (r.error === "not_open") { store.clear(); S.screen = "notyet"; render(); return; }
        throw new Error(r.error);
      }
      store.clear();
      if (MODE === "pre") { S.myToken = r.token; S.screen = "done"; }
      else { S.result = r.result; S.screen = r.result && r.result.pre ? "change" : "finished"; }
    } catch (e) { S.screen = "sendError"; }
    render(); top();
  }
  function advance() {
    if (S.pos < FLAT.length - 1) { S.pos++; if (FLAT[S.pos].ii === 0) S.secIntro = true; store.set(); S.lock = false; render(); top(); }
    else { S.lock = false; if (MODE === "pre") go("extra"); else submit(); }
  }
  function back() {
    if (S.secIntro) {
      if (S.pos === 0) { go(MODE === "pre" ? "form" : "sat"); return; }
      S.pos--; S.secIntro = false;
    } else if (FLAT[S.pos].ii === 0) S.secIntro = true;
    else S.pos--;
    store.set(); render(); top();
  }
  function startSurvey() { S.pos = 0; S.secIntro = true; S.ans = {}; S.follow = {}; S.t0 = Date.now(); go("survey"); }

  app.addEventListener("click", ev => {
    const b = ev.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const act = b.dataset.act;
    if (act === "go") { S.secIntro = false; store.set(); render(); top(); return; }
    if (act === "back") { back(); return; }
    if (act === "next") { advance(); return; }
    if (act === "answer") {
      if (S.lock) return;
      const it = SECTIONS[FLAT[S.pos].si].items[FLAT[S.pos].ii], v = Number(b.dataset.v);
      S.ans[it.id] = v;
      if (needsFollow(it, v)) { store.set(); render(); return; }
      if (it.follow) delete S.follow[it.id];
      S.lock = true; render(); setTimeout(advance, 260); return;
    }
    if (act === "retry") { submit(); return; }
    if (act === "reload") { location.reload(); return; }
    if (act === "resume") { const d = store.get(); Object.assign(S, d || {}); if (!S.t0) S.t0 = Date.now(); render(); top(); return; }
    if (act === "extra-back") { S.pos = FLAT.length - 1; S.secIntro = false; go("survey"); return; }
    if (act === "fresh") { store.clear(); Object.assign(S, { ans: {}, follow: {}, apply: {}, extra: {}, extraErr: false, sat: {}, satOpen: {}, satMeta: { stages: [], best: "" }, pos: 0, secIntro: true }); go(MODE === "pre" ? "form" : "postWelcome"); return; }
    if (act === "to-sat") { go("sat"); return; }
    if (act === "demo-post") { location.search = "?t=demo"; return; }
    if (act === "copy-link") {
      const link = b.dataset.link, msg = app.querySelector("#copyMsg"), input = app.querySelector("#myLinkInput");
      const say = t => { if (msg) msg.textContent = t; };
      const selectFallback = () => { if (input) { input.focus(); input.select(); } say("링크를 선택했어요. 길게 눌러서 복사해 주세요."); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => say("복사했어요."), selectFallback);
      } else {
        selectFallback();
      }
      return;
    }
  });

  app.addEventListener("input", ev => {
    const t = ev.target, f = t.form;
    if (t.name === "followText") {
      const it = SECTIONS[FLAT[S.pos].si].items[FLAT[S.pos].ii];
      S.follow[it.id] = t.value;
      if (!it.follow.req) { store.set(); return; }
      t.closest(".follow").querySelector('[data-act="next"]').disabled = !t.value.trim();
      store.set(); return;
    }
    if (!f) return;
    if (f.id === "extra-form") {
      const x = S.extra;
      if (t.name.startsWith("mood_")) x[t.name] = Number(t.value);
      else x[t.name] = t.value;
      const q = EXTRA_QS.find(q => q.k === t.name);
      if (q && q.etc) { const w = f.querySelector("#" + q.k + "-etcwrap"); w.hidden = t.value !== "etc"; if (t.value === "etc") w.querySelector("input").focus(); }
      store.set(); return;
    }
    if (f.id === "apply-form") {
      const a = S.apply;
      if (t.name === "want") a.want = [...f.querySelectorAll('input[name="want"]:checked')].map(x => x.value);
      else if (t.type === "checkbox") a[t.name] = t.checked;
      else a[t.name] = t.value;
      if (t.name === "sido" || t.name === "sigungu") { if (t.name === "sido") a.sigungu = ""; f.querySelector("#addr").innerHTML = addrHtml(); }
      if (["contact", "house", "route"].includes(t.name)) { const w = f.querySelector("#" + t.name + "-etc-wrap"); w.hidden = t.value !== "etc"; if (t.value === "etc") w.querySelector("input").focus(); }
      if (["sido", "sigungu", "year"].includes(t.name)) { const el = eligibility(); f.querySelector("#elig").innerHTML = el ? eligHtml(el) : ""; }
    } else if (f.id === "sat-form") {
      const M = S.satMeta;
      if (t.name === "satStage") {
        M.stages = [...f.querySelectorAll('input[name="satStage"]:checked')].map(x => x.value);
        const allowed = STAGES.filter(st => M.stages.includes(st.key)).flatMap(st => st.best.map(b => b[0]));
        if (!allowed.includes(M.best)) M.best = "";
        if (S.satErr === "stage") S.satErr = "";
        store.set(); render(); return;
      }
      if (t.name === "satBest") M.best = t.value;
      else if (t.type === "radio") S.sat[t.name] = Number(t.value);
      else S.satOpen[t.name] = t.value;
    }
    store.set();
  });
  app.addEventListener("change", ev => { if (ev.target.tagName === "SELECT") ev.target.dispatchEvent(new Event("input", { bubbles: true })); });

  app.addEventListener("submit", ev => {
    ev.preventDefault();
    if (ev.target.id === "extra-form") {
      S.extraErr = extraMissing().length > 0;
      if (S.extraErr) { render(); const e = app.querySelector(".err"); if (e) e.scrollIntoView({ block: "center" }); return; }
      submit(); return;
    }
    if (ev.target.id === "sat-form") {
      const M = S.satMeta;
      S.satErr = !M.stages.length ? "stage" : !M.best ? "best" : satItems().some(it => !S.sat[it.id]) ? "items" : "";
      if (S.satErr) { render(); const e = app.querySelector(".err"); if (e) e.scrollIntoView({ block: "center" }); return; }
      startSurvey(); return;
    }
    const a = S.apply, e = {}, y = parseInt(a.year, 10), blank = k => !a[k] || !String(a[k]).trim();
    if (blank("name")) e.name = 1;
    if (!a.sex) e.sex = 1;
    if (!(y > 1900 && y <= YEAR)) e.year = 1;
    if (blank("sido") || blank("sigungu") || blank("dong")) e.addr = 1;
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test((a.phone || "").trim())) e.phone = 1;
    if (!a.contact) e.contact = 1;
    if (a.contact === "etc" && blank("contactEtc")) e.contactEtc = 1;
    if (a.house === "etc" && blank("houseEtc")) e.houseEtc = 1;
    if (a.route === "etc" && blank("routeEtc")) e.routeEtc = 1;
    if (!a.agree) e.agree = 1;
    if (!a.research) e.research = 1;
    const el = eligibility(); if (el && !el.ok) e.elig = 1;
    S.errors = e;
    if (Object.keys(e).length) { render(); const x = app.querySelector(".err"); if (x) x.scrollIntoView({ block: "center" }); return; }
    startSurvey();
  });

  // ── 시작 ──
  (async function boot() {
    const d = store.get();
    if (MODE === "pre") {
      if (d && (d.screen === "survey" || d.screen === "extra")) { S.pos = d.pos || 0; S.screen = "resume"; S._draft = d; }
      else if (d && d.apply) S.apply = d.apply;
      render(); return;
    }
    if (DEMO) { S.name = ""; S.screen = d && d.screen === "survey" ? "resume" : "postWelcome"; if (d) S.pos = d.pos || 0; render(); return; }
    render();
    try {
      const r = await api({ action: "postInfo", token });
      if (!r.ok) { S.screen = "invalid"; }
      else {
        S.name = r.name || "";
        S.pStatus = r.status || "";
        if (r.done) { S.result = r.result; S.revisit = true; }
        if (r.preResult) S.preResult = r.preResult;
        S.screen = r.done ? (r.result && r.result.pre ? "change" : "finished")
          : r.open ? (d && d.screen === "survey" ? "resume" : d && d.screen === "sat" ? "sat" : "postWelcome")
          : r.preResult ? "preResult" : "notyet";
        if (d && S.screen !== "postWelcome" && S.screen !== "preResult") Object.assign(S, { pos: d.pos || 0, sat: d.sat || {}, satOpen: d.satOpen || {}, satMeta: d.satMeta || { stages: [], best: "" }, ans: d.ans || {}, follow: d.follow || {}, t0: d.t0 || Date.now(), secIntro: d.secIntro !== false });
      }
    } catch (e) { S.screen = "loadError"; }
    render();
  })();
})();
