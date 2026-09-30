const SONGS = [
  { id: "need", name: "needLe", artist: "Leo/need", diff: "MASTER 28" },
  { id: "from", name: "from", artist: "Leo/need", diff: "EXPERT 25" },
  { id: "night", name: "夜に駆ける", artist: "YOASOBI", diff: "MASTER 30" },
  { id: "tel", name: "テレキャスタービーボーイ", artist: "すりぃ", diff: "EXPERT 26" }
];
const CHARS = [
  { id: "ichika", name: "星乃一歌", unit: "Leo/need", line: "吉他与歌声，是她连接世界的方式。" },
  { id: "saki", name: "天马咲希", unit: "Leo/need", line: "病房里的阳光，终于回到了舞台。" },
  { id: "honami", name: "日野森志步", unit: "Leo/need", line: "鼓点沉稳，像她一直在等的那个位置。" },
  { id: "shiho", name: "望月穗波", unit: "Leo/need", line: "贝斯低鸣，把犹豫一层层按回去。" }
];
const POOL = ["一歌 · 庭院午后","一歌 · 放学后","一歌 · 舞台灯","咲希 · 晴天","志步 · 练习室","穗波 · 夜班"];
const state = load();
const $ = (id) => document.getElementById(id);
const pages = {};
["title","home","live","livePlay","result","chars","shop","cards"].forEach((id) => pages[id] = $(id));
function load() {
  try {
    const raw = localStorage.getItem("sekai-ichika");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { lv: 7, crystals: 1600, coins: 250000, energy: 5, best: 0, partner: "ichika", cards: ["一歌 · 庭院午后"], plays: 0 };
}
function save() { localStorage.setItem("sekai-ichika", JSON.stringify(state)); }
function toast(text) {
  const el = $("toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 1400);
}
function go(id) {
  Object.values(pages).forEach((p) => p.classList.remove("on"));
  pages[id].classList.add("on");
  if (id === "live") renderSongs();
  if (id === "chars") renderChars();
  if (id === "cards") renderCards();
  refreshHud();
}
function refreshHud() {
  $("playerName").textContent = CHARS.find((c) => c.id === state.partner).name;
  $("playerMeta").textContent = "Leo/need · Lv." + state.lv + " · 场次 " + state.plays;
  $("crystals").textContent = "水晶 " + state.crystals;
  $("coins").textContent = "虚拟币 " + state.coins;
  $("energy").textContent = state.energy + " / 5";
  $("bestScore").textContent = state.best;
  const hour = new Date().getHours();
  $("welcome").textContent = hour < 6 ? "还没睡吗？SEKAI 一直亮着。" : hour < 12 ? "早上好。今天的第一首歌，交给一歌。" : hour < 18 ? "欢迎回来。练习室已经开门了。" : "晚上好。舞台灯还亮着。";
}
function renderSongs() {
  $("songs").innerHTML = SONGS.map((s) => `<div class="row"><div><b>${s.name}</b><small>${s.artist} · ${s.diff}</small></div><button class="primary" data-song="${s.id}">开始</button></div>`).join("");
}
function renderChars() {
  $("charList").innerHTML = CHARS.map((c) => `<div class="row"><div><b>${c.name}</b><small>${c.unit}<br>${c.line}</small></div><button class="${state.partner===c.id?'primary':'ghost'}" data-partner="${c.id}">${state.partner===c.id?'同行中':'选择'}</button></div>`).join("");
}
function renderCards() {
  $("cardGrid").innerHTML = state.cards.map((n) => `<div class="card"><b>${n}</b><br><small>持有</small></div>`).join("");
}
let play = null;
function startLive(song) {
  if (state.energy <= 0) { toast("体力不足，去商店补给"); return; }
  state.energy -= 1; save();
  play = { song, t0: 0, combo: 0, score: 0, perfect: 0, great: 0, miss: 0, i: 0, times: [900,1600,2300,3000,3700,4400,5100,5800], running: true };
  $("playTitle").textContent = song.name;
  $("judge").textContent = "READY";
  $("playStat").textContent = "连击 0 · 分数 0";
  go("livePlay");
  requestAnimationFrame(tick);
}
function tick(now) {
  if (!play || !play.running) return;
  if (!play.t0) play.t0 = now;
  const t = now - play.t0;
  const note = $("note");
  if (play.i >= play.times.length) { finishLive(); return; }
  const dist = play.times[play.i] - t;
  const y = 200 - dist * 0.22;
  note.style.top = Math.min(210, Math.max(-20, y)) + "px";
  note.style.opacity = y < -20 ? "0" : "1";
  if (dist < -220) judge("MISS");
  requestAnimationFrame(tick);
}
function judge(kind) {
  if (!play || !play.running) return;
  if (kind === "PERFECT") { play.perfect++; play.combo++; play.score += 1000 + play.combo * 20; }
  else if (kind === "GREAT") { play.great++; play.combo++; play.score += 700 + play.combo * 10; }
  else { play.miss++; play.combo = 0; }
  $("judge").textContent = kind;
  $("playStat").textContent = "连击 " + play.combo + " · 分数 " + play.score;
  play.i += 1;
}
function tapNote() {
  if (!play || !play.running) return;
  const t = performance.now() - play.t0;
  const diff = Math.abs(play.times[play.i] - t);
  if (diff < 90) judge("PERFECT");
  else if (diff < 160) judge("GREAT");
  else judge("MISS");
}
function finishLive() {
  if (!play) return;
  play.running = false;
  const ratio = play.score / 8000;
  const rank = ratio > 0.9 ? "S" : ratio > 0.7 ? "A" : ratio > 0.5 ? "B" : "C";
  const gainM = 800 + play.score;
  state.coins += gainM;
  state.crystals += Math.floor((40 + play.perfect * 8) / 4);
  state.plays += 1;
  if (play.score > state.best) state.best = play.score;
  if (state.plays % 3 === 0) state.lv += 1;
  save();
  $("rankMark").textContent = rank;
  $("resultScore").textContent = play.score;
  $("resultDetail").textContent = "PERFECT " + play.perfect + "  GREAT " + play.great + "  MISS " + play.miss + "  ·  +" + gainM + "币";
  go("result");
}
document.getElementById("title").addEventListener("click", (e) => {
  if (e.target.closest("#titleMenu")) { toast("设置稍后开放"); return; }
  $("tap").textContent = "STARTING…";
  $("tap").style.animation = "none";
  $("flash").classList.remove("on"); void $("flash").offsetWidth; $("flash").classList.add("on");
  setTimeout(() => go("home"), 280);
});
document.body.addEventListener("click", (e) => {
  const goBtn = e.target.closest("[data-go]");
  if (goBtn) { e.stopPropagation(); go(goBtn.dataset.go); if (goBtn.dataset.go==="title"){ $("tap").textContent="TAP TO START"; $("tap").style.animation=""; } }
  const songBtn = e.target.closest("[data-song]");
  if (songBtn) startLive(SONGS.find((s) => s.id === songBtn.dataset.song));
  const partner = e.target.closest("[data-partner]");
  if (partner) { state.partner = partner.dataset.partner; save(); renderChars(); refreshHud(); toast("已选择同行角色"); }
  const buy = e.target.closest("[data-buy]");
  if (buy) {
    if (buy.dataset.buy === "energy" && state.coins >= 50 && state.energy < 5) { state.coins -= 50; state.energy += 1; toast("体力 +1"); }
    else if (buy.dataset.buy === "full" && state.coins >= 200) { state.coins -= 200; state.energy = 5; toast("体力已满"); }
    else if (buy.dataset.buy === "crystal" && state.coins >= 12000) { state.coins -= 12000; state.crystals += 300; toast("水晶 +300"); }
    else toast("余额不足或已达上限");
    save(); refreshHud();
  }
});
$("hit").addEventListener("click", tapNote);
$("giveUp").addEventListener("click", () => { if (play) play.running = false; go("live"); });
$("gacha").addEventListener("click", () => {
  if (state.crystals < 300) { toast("水晶不足"); return; }
  state.crystals -= 300;
  const got = POOL[Math.floor(Math.random() * POOL.length)];
  state.cards.push(got);
  save(); renderCards(); refreshHud(); toast("获得 " + got);
});
$("resetSave").addEventListener("click", () => {
  localStorage.removeItem("sekai-ichika");
  location.reload();
});
refreshHud();
