/* English Flashcards Pro (offline demo) */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// structuredClone fallback (for older browsers)
function cloneDeep(obj){
  try{
    if(typeof structuredClone === 'function') return cloneDeep(obj);
  }catch{}
  return JSON.parse(JSON.stringify(obj));
}


/* ---------- Sample data ---------- */
const SAMPLE_DATA = [
  {
    id: "common",
    name: "Common Vocabulary",
    icon: "📁",
    level: "A2 • Elementary",
    cards: [
      { word:"abundant", phonetic:"/əˈbʌndənt/", meaning:"dồi dào, phong phú", exEn:"The forest is abundant with wildlife.", exVi:"Khu rừng rất dồi dào động vật hoang dã." },
      { word:"acquire", phonetic:"/əˈkwaɪər/", meaning:"có được, đạt được", exEn:"She acquired new skills quickly.", exVi:"Cô ấy đạt được kỹ năng mới rất nhanh." },
      { word:"benefit", phonetic:"/ˈbenɪfɪt/", meaning:"lợi ích", exEn:"Exercise has many benefits.", exVi:"Tập thể dục có nhiều lợi ích." },
      { word:"curious", phonetic:"/ˈkjʊəriəs/", meaning:"tò mò", exEn:"I’m curious about your idea.", exVi:"Tôi tò mò về ý tưởng của bạn." },
      { word:"efficient", phonetic:"/ɪˈfɪʃənt/", meaning:"hiệu quả", exEn:"This method is more efficient.", exVi:"Phương pháp này hiệu quả hơn." },
      { word:"flexible", phonetic:"/ˈfleksəbəl/", meaning:"linh hoạt", exEn:"We need a flexible schedule.", exVi:"Chúng ta cần lịch trình linh hoạt." },
      { word:"gradually", phonetic:"/ˈɡrædʒuəli/", meaning:"dần dần", exEn:"Her English improved gradually.", exVi:"Tiếng Anh của cô ấy cải thiện dần dần." },
      { word:"habit", phonetic:"/ˈhæbɪt/", meaning:"thói quen", exEn:"Reading is a good habit.", exVi:"Đọc sách là một thói quen tốt." },
      { word:"improve", phonetic:"/ɪmˈpruːv/", meaning:"cải thiện", exEn:"Practice will improve your speaking.", exVi:"Luyện tập sẽ cải thiện khả năng nói của bạn." },
      { word:"justice", phonetic:"/ˈdʒʌstɪs/", meaning:"công lý", exEn:"They fought for justice.", exVi:"Họ đấu tranh vì công lý." },
      { word:"knowledge", phonetic:"/ˈnɒlɪdʒ/", meaning:"kiến thức", exEn:"Knowledge is power.", exVi:"Kiến thức là sức mạnh." },
      { word:"maintain", phonetic:"/meɪnˈteɪn/", meaning:"duy trì", exEn:"Maintain a healthy lifestyle.", exVi:"Duy trì lối sống lành mạnh." },
    ]
  },
  {
    id:"travel",
    name:"Travel Essentials",
    icon:"🧳",
    level:"A2 • Elementary",
    cards:[
      { word:"itinerary", phonetic:"/aɪˈtɪnərəri/", meaning:"lịch trình", exEn:"Here is our travel itinerary.", exVi:"Đây là lịch trình du lịch của chúng ta." },
      { word:"reservation", phonetic:"/ˌrezəˈveɪʃən/", meaning:"đặt chỗ", exEn:"I made a hotel reservation.", exVi:"Tôi đã đặt chỗ khách sạn." },
      { word:"baggage", phonetic:"/ˈbæɡɪdʒ/", meaning:"hành lý", exEn:"Please claim your baggage.", exVi:"Vui lòng nhận hành lý của bạn." },
    ]
  },
  {
    id:"business",
    name:"Business English",
    icon:"💼",
    level:"B1 • Intermediate",
    cards:[
      { word:"deadline", phonetic:"/ˈdedlaɪn/", meaning:"hạn chót", exEn:"We must meet the deadline.", exVi:"Chúng ta phải kịp hạn chót." },
      { word:"negotiate", phonetic:"/nɪˈɡəʊʃieɪt/", meaning:"đàm phán", exEn:"They negotiated a better price.", exVi:"Họ đàm phán giá tốt hơn." },
    ]
  }
];


const DECKS_KEY = "ef_pro_decks_v1";

function loadDecks(){
  try{
    const raw = localStorage.getItem(DECKS_KEY);
    if(!raw) return cloneDeep(SAMPLE_DATA);
    const decks = JSON.parse(raw);
    if(!Array.isArray(decks) || !decks.length) return cloneDeep(SAMPLE_DATA);
    return decks;
  }catch{
    return cloneDeep(SAMPLE_DATA);
  }
}

function saveDecks(){
  localStorage.setItem(DECKS_KEY, JSON.stringify(DATA));
}

let DATA = loadDecks();

/* ---------- Storage ---------- */
const STORAGE_KEY = "ef_pro_state_v1";
const defaultState = {

  deckId: "common",
  index: 0,
  random: false,
  auto: false,
  frontSec: 4,
  backSec: 6,
  voice: "uk",
  speakMode: "word",
  theme: "auto",

  dailyGoal: 20,
  goal: {
    streak: 0,
    lastCompleted: null, // YYYY-MM-DD (local)
    history: {} // YYYY-MM-DD -> count
  },
  marks: {
    remember: {}, // word -> true
    hard: {},
    again: {}
  },
  stats: {
    seen: {}, // word -> {count, totalMs}
  }
};

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return cloneDeep(defaultState);
    const st = JSON.parse(raw);
    return deepMerge(cloneDeep(defaultState), st);
  }catch{
    return cloneDeep(defaultState);
  }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function deepMerge(a, b){
  for(const k in b){
    if(b[k] && typeof b[k] === "object" && !Array.isArray(b[k])){
      a[k] = deepMerge(a[k] ?? {}, b[k]);
    }else{
      a[k] = b[k];
    }
  }
  return a;
}

let state = loadState();

/* ---------- DOM refs ---------- */
const pages = {
  home: $("#page-home"),
  learn: $("#page-learn"),
  review: $("#page-review"),
  library: $("#page-library"),
  settings: $("#page-settings"),
  dashboard: $("#page-dashboard"),
};

const pageTitle = $("#pageTitle");
const pageSub = $("#pageSub");
const deckList = $("#deckList");
const deckSearch = $("#deckSearch");
const globalSearch = $("#globalSearch");

const btnMenu = $("#btnMenu");
const sidebar = $("#sidebar");
const scrim = $("#scrim");

const toast = $("#toast");

/* Goal / streak */
const goalDoneEl = document.getElementById("goalDone");
const goalTargetEl = document.getElementById("goalTarget");
const goalBarFill = document.getElementById("goalBarFill");
const streakChip = document.getElementById("streakChip");
const goalHint = document.getElementById("goalHint");
const weekRow = document.getElementById("weekRow");
const weekHint = document.getElementById("weekHint");

/* Settings goal */
const dailyGoalInput = document.getElementById("dailyGoalInput");
const btnSaveGoal = document.getElementById("btnSaveGoal");
const btnResetStreak = document.getElementById("btnResetStreak");
const goalSavedHint = document.getElementById("goalSavedHint");

/* Learn */
const flash = $("#flash");
const cardWord = $("#cardWord");
const cardPhonetic = $("#cardPhonetic");
const cardMeaning = $("#cardMeaning");
const cardExampleEn = $("#cardExampleEn");
const cardExampleVi = $("#cardExampleVi");
const cardIndexEl = $("#cardIndex");
const cardTotalEl = $("#cardTotal");

const toggleAuto = $("#toggleAuto");
const toggleRandom = $("#toggleRandom");

const btnPrev = $("#btnPrev");
const btnNext = $("#btnNext");
const btnShuffle = $("#btnShuffle");
const btnPlay = $("#btnPlay");
const btnSpeak = $("#btnSpeak");
const btnSpeak2 = $("#btnSpeak2");

const btnRemember = $("#btnRemember");
const btnHard = $("#btnHard");
const btnAgain = $("#btnAgain");

/* Right panel */
const continueDeckName = $("#continueDeckName");
const continueLeft = $("#continueLeft");
const panelDeckName = $("#panelDeckName");
const panelDone = $("#panelDone");
const panelTotal = $("#panelTotal");
const panelAvg = $("#panelAvg");
const panelLevel = $("#panelLevel");
const panelPct = $("#panelPct");
const progressRing = $("#progressRing");
const btnReshuffle = $("#btnReshuffle");

const rangeFront = $("#rangeFront");
const rangeBack = $("#rangeBack");
const valFront = $("#valFront");
const valBack = $("#valBack");
const segVoiceBtns = $$(".seg__btn[data-voice]");
const btnSaveSettings = $("#btnSaveSettings");

/* Review */
const hardCount = $("#hardCount");
const againCount = $("#againCount");
const rememberCount = $("#rememberCount");
const btnStartReview = $("#btnStartReview");

/* Library */
const libraryList = $("#libraryList");

/* Dashboard */
const dashDeckSelect = document.getElementById("dashDeckSelect");
const dashLearned = document.getElementById("dashLearned");
const dashHard = document.getElementById("dashHard");
const dashAgain = document.getElementById("dashAgain");
const dashCompletion = document.getElementById("dashCompletion");
const dashCompletionBar = document.getElementById("dashCompletionBar");
const dashSummary = document.getElementById("dashSummary");
const dashChart = document.getElementById("dashChart");
const dashChartHint = document.getElementById("dashChartHint");
const topicList = document.getElementById("topicList");
const btnExportProgress = document.getElementById("btnExportProgress");

/* Settings page */
const themeBtns = $$(".seg__btn[data-theme]");
const btnReset = $("#btnReset");

/* Bottom nav */
const bottomNavBtns = $$(".bnav");
const topSettingsBtn = $(".topbar__right .iconbtn");

/* Home quick start */
$$("[data-start]").forEach(btn => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.start;
    state.auto = mode === "auto";
    saveState();
    go("learn");
    renderLearn();
    if(state.auto) startAuto();
  });
});

/* Continue buttons */
$$("[data-nav]").forEach(btn => {
  btn.addEventListener("click", () => go(btn.dataset.nav));
});

/* ---------- Navigation ---------- */
function go(name){
  Object.entries(pages).forEach(([k, el]) => {
    el.classList.toggle("page--active", k === name);
  });

  // titles
  const map = {
    home: ["Home", "Welcome back"],
    learn: ["Learn", "Keep going"],
    review: ["Review", "Focus on weak words"],
    library: ["Library", "Your decks"],
    settings: ["Settings", "Customize your study"],
    dashboard: ["Dashboard", "Track your progress"]
  };
  const [t, s] = map[name] ?? ["", ""];
  pageTitle.textContent = t;
  pageSub.textContent = s;

  // bottom nav active
  bottomNavBtns.forEach(b => b.classList.toggle("bnav--active", b.dataset.nav === name));

    renderGoalUI();
  if(name === "dashboard") renderDashboard();
  // close mobile menu if open
  sidebar.classList.remove("open");
  scrim.classList.remove("show");
}

bottomNavBtns.forEach(b => b.addEventListener("click", () => go(b.dataset.nav)));

/* Mobile menu */
btnMenu?.addEventListener("click", () => {
  sidebar.classList.add("open");
  scrim.classList.add("show");
});
scrim?.addEventListener("click", () => {
  sidebar.classList.remove("open");
  scrim.classList.remove("show");
});

/* ---------- Deck list ---------- */
function currentDeck(){
  return DATA.find(d => d.id === state.deckId) ?? DATA[0];
}

function renderDeckList(filter=""){
  const q = (filter || "").toLowerCase().trim();
  deckList.innerHTML = "";

  DATA
    .filter(d => d.name.toLowerCase().includes(q))
    .forEach(d => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "deckBtn" + (d.id === state.deckId ? " active" : "");
      btn.innerHTML = `
        <div class="deckLeft">
          <div class="deckIcon" aria-hidden="true">${d.icon}</div>
          <div class="deckName" title="${escapeHtml(d.name)}">${escapeHtml(d.name)}</div>
        </div>
        <div class="deckCount">${d.cards.length}</div>
      `;
      btn.addEventListener("click", () => {
        state.deckId = d.id;
        state.index = 0;
        saveState();
        renderDeckList(deckSearch.value);
        renderHome();
        renderLearn();
        renderLibrary();
        showToast("Switched deck: " + d.name);
      });
      deckList.appendChild(btn);
    });
}

deckSearch?.addEventListener("input", () => renderDeckList(deckSearch.value));

/* ---------- Flashcard ---------- */
let order = [];
let autoTimer = null;
let autoPhase = "front"; // front/back
let cardStartTs = performance.now();

function buildOrder(){
  const d = currentDeck();
  order = d.cards.map((_, i) => i);
  if(state.random) shuffle(order);
  if(state.index >= order.length) state.index = 0;
}

function getCard(){
  const d = currentDeck();
  if(!order.length) buildOrder();
  const idx = order[state.index] ?? 0;
  return d.cards[idx];
}

function renderCard(){
  const d = currentDeck();
  if(!order.length) buildOrder();
  const c = getCard();

  cardWord.textContent = c.word;
  cardPhonetic.textContent = c.phonetic || "";
  cardMeaning.textContent = c.meaning || "";
  cardExampleEn.textContent = c.exEn || "";
  cardExampleVi.textContent = c.exVi || "";

  cardIndexEl.textContent = String(state.index + 1);
  cardTotalEl.textContent = String(order.length);

  // ensure front showing on render
  flash.classList.remove("isFlipped");
  autoPhase = "front";

  // stats start time
  cardStartTs = performance.now();

  updatePanel();
}

function nextCard(){
  commitTime();
    bumpTodayCount(1);
  if(!order.length) buildOrder();
  state.index = (state.index + 1) % order.length;
  saveState();
  renderCard();
}

function prevCard(){
  commitTime();
  if(!order.length) buildOrder();
  state.index = (state.index - 1 + order.length) % order.length;
  saveState();
  renderCard();
}

function reshuffle(){
  buildOrder();
  state.index = 0;
  saveState();
  renderCard();
  showToast("Reshuffled");
}

function flip(){
  flash.classList.toggle("isFlipped");
}

/* Commit time spent on card */
function commitTime(){
  const c = getCard();
  const dt = Math.max(0, performance.now() - cardStartTs);
  const entry = state.stats.seen[c.word] || {count:0, totalMs:0};
  entry.count += 1;
  entry.totalMs += dt;
  state.stats.seen[c.word] = entry;
}

/* Marking */
function mark(type){
  const c = getCard();
    bumpTodayCount(1);
  state.marks[type][c.word] = true;
  // unmark other buckets for clarity
  if(type !== "remember") delete state.marks.remember[c.word];
  if(type !== "hard") delete state.marks.hard[c.word];
  if(type !== "again") delete state.marks.again[c.word];
  saveState();
  renderReviewCounts();
  showToast(type === "remember" ? "Đã nhớ ✅" : type === "hard" ? "Từ khó ⭐" : "Chưa nhớ 🔁");
}

/* Controls */
flash?.addEventListener("click", () => flip());
btnPrev?.addEventListener("click", () => prevCard());
btnNext?.addEventListener("click", () => nextCard());
btnShuffle?.addEventListener("click", () => reshuffle());
btnReshuffle?.addEventListener("click", () => reshuffle());

btnRemember?.addEventListener("click", (e) => { e.stopPropagation(); mark("remember"); });
btnHard?.addEventListener("click", (e) => { e.stopPropagation(); mark("hard"); });
btnAgain?.addEventListener("click", (e) => { e.stopPropagation(); mark("again"); });

/* Auto */
toggleAuto.checked = !!state.auto;
toggleRandom.checked = !!state.random;

toggleAuto.addEventListener("change", () => {
  state.auto = toggleAuto.checked;
  saveState();
  if(state.auto) startAuto(); else stopAuto();
});

toggleRandom.addEventListener("change", () => {
  state.random = toggleRandom.checked;
  buildOrder();
  state.index = 0;
  saveState();
  renderCard();
  showToast(state.random ? "Random on" : "Random off");
});

btnPlay?.addEventListener("click", () => {
  state.auto = !state.auto;
  toggleAuto.checked = state.auto;
  saveState();
  if(state.auto) startAuto(); else stopAuto();
});

function startAuto(){
  stopAuto();
  btnPlay.textContent = "❚❚";
  // schedule phase changes
  autoPhase = flash.classList.contains("isFlipped") ? "back" : "front";
  autoTimer = setTimeout(autoTick, 50);
}

function stopAuto(){
  if(autoTimer) clearTimeout(autoTimer);
  autoTimer = null;
  btnPlay.textContent = "▶";
}

function autoTick(){
  if(!state.auto) return;
  if(autoPhase === "front"){
    // speak word if desired
    if(getSpeakMode() === "word") speak(false);
    flip();
    autoPhase = "back";
    autoTimer = setTimeout(autoTick, state.backSec * 1000);
  }else{
    // speak full content if desired
    if(getSpeakMode() !== "word") speak(true);
    nextCard();
    autoPhase = "front";
    autoTimer = setTimeout(autoTick, state.frontSec * 1000);
  }
}

/* Timers */
rangeFront.value = String(state.frontSec);
rangeBack.value = String(state.backSec);
valFront.textContent = state.frontSec + "s";
valBack.textContent = state.backSec + "s";

rangeFront.addEventListener("input", () => {
  state.frontSec = Number(rangeFront.value);
  valFront.textContent = state.frontSec + "s";
  saveState();
});
rangeBack.addEventListener("input", () => {
  state.backSec = Number(rangeBack.value);
  valBack.textContent = state.backSec + "s";
  saveState();
});

/* Voice segment */
function setVoice(v){
  state.voice = v;
  segVoiceBtns.forEach(b => b.classList.toggle("seg__btn--active", b.dataset.voice === v));
  saveState();
}
setVoice(state.voice);

segVoiceBtns.forEach(b => b.addEventListener("click", () => setVoice(b.dataset.voice)));

btnSaveSettings?.addEventListener("click", () => {
  showToast("Saved");
});

/* Speak */
btnSpeak?.addEventListener("click", (e) => { e.stopPropagation(); speak(false); });
btnSpeak2?.addEventListener("click", () => speak(true));

function getSpeakMode(){
  return (document.querySelector('input[name="speak"]:checked')?.value) || state.speakMode || "word";
}
$$('input[name="speak"]').forEach(r => r.addEventListener("change", () => {
  state.speakMode = getSpeakMode();
  saveState();
}));

function pickVoice(){
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const want = state.voice === "us" ? ["en-US", "en_US"] : ["en-GB", "en_GB", "en-UK", "en_UK"];
  const byLocale = voices.find(v => want.some(w => (v.lang || "").includes(w)));
  const fallback = voices.find(v => (v.lang || "").startsWith("en")) || voices[0];
  return byLocale || fallback || null;
}

function speak(includeExample){
  if(!("speechSynthesis" in window)) {
    showToast("Speech not supported");
    return;
  }
  const c = getCard();
  const parts = [c.word];
  if(includeExample && c.exEn) parts.push(c.exEn);
  const text = parts.join(". ");

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if(v) u.voice = v;
  u.rate = 0.95;
  u.pitch = 1.0;
  window.speechSynthesis.speak(u);
}

/* Keyboard shortcuts */
window.addEventListener("keydown", (e) => {
  const inInput = ["INPUT","TEXTAREA"].includes(document.activeElement?.tagName);
  if(inInput) return;

  if(e.code === "Space"){
    e.preventDefault();
    flip();
  }else if(e.code === "ArrowRight"){
    e.preventDefault();
    nextCard();
  }else if(e.code === "ArrowLeft"){
    e.preventDefault();
    prevCard();
  }else if(e.key.toLowerCase() === "r"){
    reshuffle();
  }else if(e.key.toLowerCase() === "p"){
    state.auto = !state.auto;
    toggleAuto.checked = state.auto;
    saveState();
    if(state.auto) startAuto(); else stopAuto();
  }
});

/* ---------- Home / Panel / Review / Library ---------- */
function renderHome(){
  const d = currentDeck();
  continueDeckName.textContent = d.name;
  const left = Math.max(0, d.cards.length - (state.index + 1));
  continueLeft.textContent = `${left} cards left`;
  const cm = document.getElementById("continueMode");
  if(cm) cm.textContent = state.auto ? "Auto Mode" : "Manual Mode";

  // Today's focus (simple demo)
  $("#newWordsCount").textContent = `${Math.min(10, d.cards.length)} words`;
  $("#reviewWordsCount").textContent = `${Object.keys(state.marks.hard).length + Object.keys(state.marks.again).length} to review`;
  renderGoalUI();
}

function calcProgress(){
  const d = currentDeck();
  // consider "remember" as done
  const done = d.cards.filter(c => state.marks.remember[c.word]).length;
  const total = d.cards.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return {done, total, pct};
}

function calcAvgTime(){
  const d = currentDeck();
  const seen = d.cards.map(c => state.stats.seen[c.word]).filter(Boolean);
  if(!seen.length) return 0;
  const totalMs = seen.reduce((s, x) => s + (x.totalMs || 0), 0);
  const totalCount = seen.reduce((s, x) => s + (x.count || 0), 0);
  const ms = totalCount ? totalMs / totalCount : 0;
  return ms / 1000;
}

function updateRing(pct){
  const deg = Math.round((pct / 100) * 360);
  progressRing.style.background = `conic-gradient(var(--ring) ${deg}deg, rgba(148, 163, 184, .20) ${deg}deg)`;
}

function updatePanel(){
  const d = currentDeck();
  panelDeckName.textContent = d.name;
  panelLevel.textContent = d.level || "A2 • Elementary";

  const {done, total, pct} = calcProgress();
  panelDone.textContent = done;
  panelTotal.textContent = total;
  panelPct.textContent = pct + "%";
  updateRing(pct);

  const avg = calcAvgTime();
  panelAvg.textContent = avg ? (avg.toFixed(1) + "s") : "—";
}

function renderReviewCounts(){
  hardCount.textContent = String(Object.keys(state.marks.hard).length);
  againCount.textContent = String(Object.keys(state.marks.again).length);
  rememberCount.textContent = String(Object.keys(state.marks.remember).length);
}

btnStartReview?.addEventListener("click", () => {
  // naive review: shuffle hard+again list then switch deck order temporarily
  const d = currentDeck();
  const targets = d.cards
    .map((c, idx) => ({c, idx}))
    .filter(x => state.marks.hard[x.c.word] || state.marks.again[x.c.word])
    .map(x => x.idx);

  if(!targets.length){
    showToast("No review items yet");
    return;
  }

  order = targets.slice();
  shuffle(order);
  state.index = 0;
  saveState();
  go("learn");
  renderCard();
  showToast("Review set loaded");
});


function renderLibrary(){
  libraryList.innerHTML = "";
  DATA.forEach(d => {
    const el = document.createElement("div");
    el.className = "libItem";
    const learned = d.cards.filter(c => state.marks.remember[c.word]).length;
    const pct = d.cards.length ? Math.round((learned / d.cards.length) * 100) : 0;

    el.innerHTML = `
      <div class="libItem__top">
        <div>
          <div class="libItem__name">${escapeHtml(d.icon)} ${escapeHtml(d.name)}</div>
          <div class="libItem__meta">
            <span>${d.cards.length} cards</span>
            <span>${learned} learned</span>
            <span>${pct}%</span>
            <span>${escapeHtml(d.level || "")}</span>
          </div>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" data-deck="${escapeHtml(d.id)}">Study</button>
      </div>

      <div class="prog" role="progressbar" aria-label="Progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="prog__bar" style="width:${pct}%"></div>
      </div>
    `;

    el.querySelector("[data-deck]")?.addEventListener("click", () => {
      state.deckId = d.id;
      state.index = 0;
      saveState();
      buildOrder();
      renderHome();
      renderLearn();
      go("learn");
      showToast("Switched deck: " + d.name);
    });

    libraryList.appendChild(el);
  });
}


/* Theme */
function setTheme(t){
  state.theme = t;
  saveState();
  themeBtns.forEach(b => b.classList.toggle("seg__btn--active", b.dataset.theme === t));
  if(t === "auto"){
    document.documentElement.removeAttribute("data-theme");
  }else{
    document.documentElement.setAttribute("data-theme", t);
  }
}
setTheme(state.theme || "auto");

themeBtns.forEach(b => b.addEventListener("click", () => setTheme(b.dataset.theme)));


/* Daily goal settings */
btnSaveGoal?.addEventListener("click", () => {
  const v = Math.max(1, Math.min(500, Number(dailyGoalInput?.value || 20)));
  state.dailyGoal = v;
  saveState();
  renderGoalUI();
  showToast("Goal saved");
});
btnResetStreak?.addEventListener("click", () => {
  if(!confirm("Reset streak?")) return;
  if(!state.goal) state.goal = {streak:0,lastCompleted:null,history:{}};
  state.goal.streak = 0;
  state.goal.lastCompleted = null;
  state.goal.history = {};
  saveState();
  renderGoalUI();
  renderReviewCounts();
  renderHome();
  showToast("Streak reset");
});


/* Reset */
btnReset?.addEventListener("click", () => {
  if(!confirm("Reset progress?")) return;
  state = cloneDeep(defaultState);
  DATA = cloneDeep(SAMPLE_DATA);
  saveDecks();
  saveState();
  init();
  showToast("Reset done");
});

/* Global search */
globalSearch?.addEventListener("input", () => {
  const q = globalSearch.value.toLowerCase().trim();
  if(!q) return;
  const d = currentDeck();
  const idx = d.cards.findIndex(c =>
    (c.word || "").toLowerCase().includes(q) ||
    (c.meaning || "").toLowerCase().includes(q) ||
    (c.exEn || "").toLowerCase().includes(q)
  );
  if(idx >= 0){
    // map real index to order index
    const pos = order.indexOf(idx);
    state.index = pos >= 0 ? pos : 0;
    saveState();
    renderCard();
    showToast("Jumped to: " + d.cards[idx].word);
  }else{
    showToast("Not found");
  }
});

/* Toast */
let toastTimer = null;
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1400);
}

/* Utilities */
function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}


/* ---------- Daily Goal / Streak ---------- */
function todayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}
function getCountForDay(key){
  return Number(state.goal?.history?.[key] || 0);
}
function setCountForDay(key, n){
  if(!state.goal) state.goal = {streak:0,lastCompleted:null,history:{}};
  if(!state.goal.history) state.goal.history = {};
  state.goal.history[key] = n;
}
function bumpTodayCount(delta=1){
  const k = todayKey();
  const cur = getCountForDay(k);
  const next = Math.max(0, cur + delta);
  setCountForDay(k, next);
  checkGoalCompletion();
  saveState();
  renderGoalUI();
}
function checkGoalCompletion(){
  if(!state.goal) state.goal = {streak:0,lastCompleted:null,history:{}};
  const k = todayKey();
  const done = getCountForDay(k);
  const target = Number(state.dailyGoal || 20);

  // completed today?
  if(done >= target){
    if(state.goal.lastCompleted !== k){
      // streak update based on yesterday completion
      const y = new Date();
      y.setDate(y.getDate()-1);
      const yk = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,"0")}-${String(y.getDate()).padStart(2,"0")}`;
      if(state.goal.lastCompleted === yk){
        state.goal.streak = (state.goal.streak || 0) + 1;
      }else{
        state.goal.streak = 1;
      }
      state.goal.lastCompleted = k;
      showToast("Goal completed! 🔥");
    }
  }else{
    // if user missed days, we don't auto-reset until a new day check
  }
}
function normalizeStreakOnLoad(){
  if(!state.goal) state.goal = {streak:0,lastCompleted:null,history:{}};
  const last = state.goal.lastCompleted;
  if(!last) return;
  // If lastCompleted is before yesterday and streak hasn't been reset, show as 0 until next completion.
  const t = new Date();
  const y = new Date(); y.setDate(t.getDate()-1);
  const yk = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,"0")}-${String(y.getDate()).padStart(2,"0")}`;
  const tk = todayKey();
  if(last !== tk && last !== yk){
    // streak is broken; keep value but UI will show "streak paused"
    // We won't mutate streak here to avoid surprising users; they can reset in Settings.
  }
}
function weekKeysMonStart(){
  const d = new Date();
  const day = d.getDay(); // 0 Sun..6 Sat
  const diffToMon = (day + 6) % 7; // Mon=0
  const mon = new Date(d);
  mon.setDate(d.getDate() - diffToMon);
  const keys = [];
  for(let i=0;i<7;i++){
    const x = new Date(mon);
    x.setDate(mon.getDate()+i);
    keys.push(`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`);
  }
  return keys;
}
function isStreakBroken(){
  const last = state.goal?.lastCompleted;
  if(!last) return true;
  const tk = todayKey();
  const y = new Date(); y.setDate(y.getDate()-1);
  const yk = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,"0")}-${String(y.getDate()).padStart(2,"0")}`;
  return !(last === tk || last === yk);
}
function renderGoalUI(){
  if(!goalDoneEl || !goalTargetEl || !goalBarFill || !streakChip) return;
  const k = todayKey();
  const done = getCountForDay(k);
  const target = Number(state.dailyGoal || 20);
  goalDoneEl.textContent = String(done);
  goalTargetEl.textContent = String(target);
  const pct = target ? Math.min(100, Math.round((done/target)*100)) : 0;
  goalBarFill.style.width = pct + "%";

  const streak = Number(state.goal?.streak || 0);
  const broken = isStreakBroken();
  streakChip.textContent = `🔥 ${streak} day streak` + (broken ? " (paused)" : "");
  if(goalHint){
    goalHint.textContent = done >= target ? "Done for today. Great work!" : `You need ${Math.max(0, target-done)} more cards today.`;
  }
  if(weekHint){
    weekHint.textContent = done >= target ? "Goal completed today ✅" : "Complete your goal today to keep the streak.";
  }

  if(weekRow){
    const keys = weekKeysMonStart();
    weekRow.innerHTML = "";
    keys.forEach(key => {
      const dDone = getCountForDay(key);
      const dot = document.createElement("div");
      dot.className = "dayDot" + (dDone >= target ? " on" : "");
      dot.title = `${key}: ${dDone}/${target}`;
      weekRow.appendChild(dot);
    });
  }
  // Settings input
  if(dailyGoalInput){
    dailyGoalInput.value = String(target);
  }
}



/* ---------- Dashboard ---------- */
function deckProgress(deck){
  const total = deck.cards.length;
  let learned=0, hard=0, again=0;
  deck.cards.forEach(c => {
    if(state.marks.remember[c.word]) learned++;
    if(state.marks.hard[c.word]) hard++;
    if(state.marks.again[c.word]) again++;
  });
  const pct = total ? Math.round((learned/total)*100) : 0;
  return {total, learned, hard, again, pct};
}

function renderDashDeckSelect(){
  if(!dashDeckSelect) return;
  dashDeckSelect.innerHTML = "";
  DATA.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.icon || "📘"} ${d.name}`;
    dashDeckSelect.appendChild(opt);
  });
  dashDeckSelect.value = state.deckId;
}

dashDeckSelect?.addEventListener("change", () => {
  const id = dashDeckSelect.value;
  state.deckId = id;
  state.index = 0;
  saveState();
  renderDeckList(deckSearch.value);
  renderHome();
  renderLearn();
  renderLibrary();
  renderDashboard();
});

btnExportProgress?.addEventListener("click", () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    dailyGoal: state.dailyGoal,
    goal: state.goal,
    marks: state.marks,
    stats: state.stats,
    deckId: state.deckId
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "progress.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
});

function renderDashboard(){
  if(!dashLearned || !topicList) return;
  renderDashDeckSelect();
  const deck = currentDeck();
  const p = deckProgress(deck);

  dashLearned.textContent = String(p.learned);
  dashHard.textContent = String(p.hard);
  dashAgain.textContent = String(p.again);
  dashCompletion.textContent = p.pct + "%";
  if(dashCompletionBar) dashCompletionBar.style.width = p.pct + "%";
  if(dashSummary) dashSummary.textContent = `${p.learned} learned out of ${p.total} cards in “${deck.name}”.`;

  renderDashChart();
  renderTopicProgress();
}

function renderDashChart(){
  if(!dashChart) return;
  const ctx = dashChart.getContext("2d");
  const W = dashChart.width, H = dashChart.height;
  ctx.clearRect(0,0,W,H);

  // Build last 14 days keys
  const keys = [];
  for(let i=13;i>=0;i--){
    const d = new Date();
    d.setDate(d.getDate()-i);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    keys.push(k);
  }
  const vals = keys.map(k => Number(state.goal?.history?.[k] || 0));
  const maxV = Math.max(5, ...vals);
  const pad = 18;
  const innerW = W - pad*2;
  const innerH = H - pad*2;

  // axes baseline
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(148,163,184,0.35)";
  ctx.beginPath();
  ctx.moveTo(pad, H - pad);
  ctx.lineTo(W - pad, H - pad);
  ctx.stroke();

  // bars
  const barW = innerW / vals.length;
  vals.forEach((v, i) => {
    const x = pad + i * barW + barW*0.2;
    const w = barW*0.6;
    const h = (v / maxV) * (innerH - 8);
    const y = (H - pad) - h;
    // bar fill
    ctx.fillStyle = "rgba(59,130,246,0.85)";
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();

    // tiny goal marker
    const goal = Number(state.dailyGoal || 20);
    const gy = (H - pad) - Math.min(innerH-8, (goal/maxV)*(innerH-8));
    ctx.fillStyle = "rgba(34,197,94,0.85)";
    ctx.fillRect(x, gy, w, 2);
  });

  // label hint
  if(dashChartHint){
    const today = todayKey();
    const tval = Number(state.goal?.history?.[today] || 0);
    const goal = Number(state.dailyGoal || 20);
    dashChartHint.textContent = `Cards studied per day (14d). Today: ${tval}/${goal}`;
  }
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

function renderTopicProgress(){
  if(!topicList) return;

  // If the imported 35 topics are separate decks, show all decks progress here.
  // We'll show per-deck completion, sorted desc.
  const rows = DATA.map(d => {
    const total = d.cards.length;
    const learned = d.cards.filter(c => state.marks.remember[c.word]).length;
    const pct = total ? Math.round((learned/total)*100) : 0;
    return {id:d.id, name:d.name, icon:d.icon || "📘", total, learned, pct};
  }).sort((a,b) => b.pct - a.pct);

  topicList.innerHTML = "";
  rows.forEach(r => {
    const el = document.createElement("div");
    el.className = "topicRow";
    el.innerHTML = `
      <div class="topicName" title="${escapeHtml(r.name)}">${escapeHtml(r.icon)} ${escapeHtml(r.name)}</div>
      <div class="topicBar" aria-label="progress">
        <div class="topicBar__fill" style="width:${r.pct}%"></div>
      </div>
      <div class="topicPct">${r.pct}%</div>
    `;
    el.addEventListener("click", () => {
      state.deckId = r.id;
      state.index = 0;
      saveState();
      renderDeckList(deckSearch.value);
      renderHome(); renderLearn(); renderLibrary();
      renderDashboard();
      showToast("Selected: " + r.name);
    });
    topicList.appendChild(el);
  });
}


/* Init */
function renderLearn(){
  toggleAuto.checked = !!state.auto;
  toggleRandom.checked = !!state.random;
  buildOrder();
  renderCard();
  if(state.auto) startAuto(); else stopAuto();
}

function init(){
  renderDeckList("");
  buildOrder();
  renderHome();
  renderLearn();
  renderReviewCounts();
  renderLibrary();
  updatePanel();
  normalizeStreakOnLoad();
  renderGoalUI();
  renderDashboard();
}

/* ---------- PWA Install ---------- */
let deferredPrompt = null;
const btnInstall = document.getElementById("btnInstall");
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstall?.classList.add("show");
});
btnInstall?.addEventListener("click", async () => {
  if(!deferredPrompt){
    showToast("Use browser menu to install");
    return;
  }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
});

/* Register service worker (GitHub Pages friendly) */
if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

/* ---------- Add Deck / Add Card ---------- */
const modalDeck = document.getElementById("modalDeck");
const formDeck = document.getElementById("formDeck");
const deckNameInput = document.getElementById("deckNameInput");
const deckIconInput = document.getElementById("deckIconInput");

const modalCard = document.getElementById("modalCard");
const formCard = document.getElementById("formCard");
const cardWordInput = document.getElementById("cardWordInput");
const cardPhoneticInput = document.getElementById("cardPhoneticInput");
const cardMeaningInput = document.getElementById("cardMeaningInput");
const cardExEnInput = document.getElementById("cardExEnInput");
const cardExViInput = document.getElementById("cardExViInput");

document.getElementById("btnAddDeck")?.addEventListener("click", () => {
  deckNameInput.value = "";
  deckIconInput.value = "📘";
  modalDeck?.showModal();
});

formDeck?.addEventListener("submit", (e) => {
  const v = e.submitter?.value || "cancel";
  if(v !== "ok") return;
  const name = (deckNameInput.value || "").trim();
  if(!name) return;
  const icon = (deckIconInput.value || "📘").trim() || "📘";
  const id = "deck_" + Math.random().toString(16).slice(2, 10);
  DATA.unshift({ id, name, icon, level:"Custom", cards: [] });
  state.deckId = id;
  state.index = 0;
  saveDecks(); saveState();
  renderDeckList(deckSearch.value);
  renderHome(); renderLearn(); renderLibrary();
  showToast("Deck created");
});

document.getElementById("btnAddCard")?.addEventListener("click", () => {
  const d = currentDeck();
  if(!d){
    showToast("No deck");
    return;
  }
  cardWordInput.value = "";
  cardPhoneticInput.value = "";
  cardMeaningInput.value = "";
  cardExEnInput.value = "";
  cardExViInput.value = "";
  modalCard?.showModal();
});

formCard?.addEventListener("submit", (e) => {
  const v = e.submitter?.value || "cancel";
  if(v !== "ok") return;
  const d = currentDeck();
  const w = (cardWordInput.value || "").trim();
  const m = (cardMeaningInput.value || "").trim();
  if(!w || !m) return;
  d.cards.push({
    word: w,
    phonetic: (cardPhoneticInput.value || "").trim(),
    meaning: m,
    exEn: (cardExEnInput.value || "").trim(),
    exVi: (cardExViInput.value || "").trim(),
  });
  saveDecks();
  buildOrder();
  state.index = Math.min(state.index, Math.max(0, d.cards.length - 1));
  saveState();
  renderDeckList(deckSearch.value);
  renderHome(); renderLearn(); renderLibrary();
  showToast("Card added");
});

/* ---------- Export / Import ---------- */
const btnExport = document.getElementById("btnExport");
const fileImport = document.getElementById("fileImport");

btnExport?.addEventListener("click", () => {
  const d = currentDeck();
  const blob = new Blob([JSON.stringify(d, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  const safe = (d.name || "deck").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  a.href = URL.createObjectURL(blob);
  a.download = `${safe || "deck"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
});

fileImport?.addEventListener("change", async () => {
  const file = fileImport.files?.[0];
  if(!file) return;
  try{
    const text = await file.text();
    const deck = JSON.parse(text);
    if(!deck || typeof deck !== "object") throw new Error("bad");
    if(!Array.isArray(deck.cards)) throw new Error("missing cards");
    deck.id = deck.id || ("deck_" + Math.random().toString(16).slice(2, 10));
    deck.icon = deck.icon || "📘";
    deck.level = deck.level || "Imported";
    DATA.unshift(deck);
    state.deckId = deck.id;
    state.index = 0;
    saveDecks(); saveState();
    renderDeckList(deckSearch.value);
    renderHome(); renderLearn(); renderLibrary();
    showToast("Imported deck");
  }catch{
    showToast("Import failed");
  }finally{
    fileImport.value = "";
  }
});

/* init moved to bootstrap */






async function buildDecksFromPackJson(json){
  if(!json || !Array.isArray(json.packs) || !json.packs.length) return null;
  const pack = json.packs[0];
  const topics = Array.isArray(pack.topics) ? pack.topics : [];
  const items = Array.isArray(pack.items) ? pack.items : [];

  const topicNameById = Object.fromEntries(topics.map(t => [t.id, t.ten || t.id]));
  // group items by topicId
  const byTopic = new Map();
  for(const it of items){
    const tid = it.topicId || "unknown";
    if(!byTopic.has(tid)) byTopic.set(tid, []);
    byTopic.get(tid).push(it);
  }

  const decks = [];
  for(const t of topics){
    const list = byTopic.get(t.id) || [];
    const cards = list.map(i => ({
      word: i.term || "",
      phonetic: i.ipa || "",
      meaning: i.meaning_vi || "",
      exEn: i.example || "",
      exVi: i.example_vi || "",
    })).filter(c => c.word.trim().length);
    if(!cards.length) continue;
    decks.push({
      id: t.id,
      name: t.ten || t.id,
      icon: "📚",
      level: pack.ten || "",
      cards
    });
  }

  // fallback: if topics missing but items exist, build single deck
  if(!decks.length && items.length){
    const cards = items.map(i => ({
      word: i.term || "",
      phonetic: i.ipa || "",
      meaning: i.meaning_vi || "",
      exEn: i.example || "",
      exVi: i.example_vi || "",
    })).filter(c => c.word.trim().length);
    decks.push({
      id: pack.id || "pack",
      name: pack.ten || "Vocabulary Pack",
      icon: "📚",
      level: pack.ten || "",
      cards
    });
  }
  return decks.length ? decks : null;
}

async function ensureBuiltInData(){
  // Only seed from data.json if user doesn't already have decks saved
  const hasSaved = !!localStorage.getItem(DECKS_KEY);
  if(hasSaved) return;

  try{
    const res = await fetch("./data.json", {cache:"no-store"});
    if(!res.ok) return;
    const json = await res.json();
    const decks = await buildDecksFromPackJson(json);
    if(!decks) return;

    DATA = decks;
    saveDecks();

    // make sure selected deck exists
    if(!DATA.find(d => d.id === state.deckId)){
      state.deckId = DATA[0].id;
      state.index = 0;
      saveState();
    }
  }catch(e){
    console.warn("Could not load built-in data.json", e);
  }
}

async function bootstrap(){
  await ensureBuiltInData();
  init();
}
bootstrap();

