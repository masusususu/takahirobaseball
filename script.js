"use strict";

// ============================================================
// 1. ここを編集すると、名前・画像・難易度を変更できます。
// 画像は空欄なら仮キャラクター。例: portrait: "assets/takahiro.png"
// batter は後ろ姿、ending は選んだ本人が中央にいる家族の集合画像です。
// ============================================================
const PLAYERS = [
  { id: "takahiro", name: "たかひろ", easy: true,  number: "1", hair: "#c5c9bd", skin: "#f1c9a2", glasses: true, portrait: "", batter: "assets/batters/takahiro-batter.png", ending: "" },
  { id: "kumiko",   name: "くみこ",   easy: true,  number: "2", hair: "#8c8c80", skin: "#f3ccb1", glasses: true, bob: true, portrait: "", batter: "assets/batters/kumiko-batter.png", ending: "" },
  { id: "tomohiro", name: "ともひろ", easy: false, number: "3", hair: "#393c34", skin: "#eac29d", portrait: "", batter: "assets/batters/tomohiro-batter.png", ending: "" },
  { id: "kouhei",   name: "こうへい", easy: false, number: "4", hair: "#35392f", skin: "#eec6a6", portrait: "", batter: "assets/batters/kohei-batter.png", ending: "" },
  { id: "akari",    name: "あかり",   easy: false, number: "5", hair: "#795340", skin: "#f6d1b9", bob: true, portrait: "", batter: "assets/batters/akari-batter.png", ending: "" },
  { id: "ryota",    name: "りょうた", easy: false, number: "6", hair: "#424236", skin: "#edc4a0", portrait: "", batter: "assets/batters/ryota-batter.png", ending: "" },
  { id: "miho",     name: "みほ",     easy: false, number: "7", hair: "#554536", skin: "#f5cdb0", bob: true, portrait: "", batter: "assets/batters/miho-batter.png", ending: "" }
];

// プレイヤー選択カード専用の画像。空欄・読み込み失敗時は仮キャラクター。
// こうへいの保存用IDは kouhei のまま、画像名は指定された kohei を使います。
const PLAYER_SELECT_IMAGES = {
  takahiro: "assets/players/takahiro-select.png",
  kumiko: "assets/players/kumiko-select.png",
  tomohiro: "assets/players/tomohiro-select.png",
  kouhei: "assets/players/kohei-select.png",
  akari: "assets/players/akari-select.png",
  ryota: "assets/players/ryota-select.png",
  miho: "assets/players/miho-select.png"
};

// 家族7人と「ここ」の集合画像。名前などの固定文字がない画像を使用します。
// ending.png から下部の文字入りの帯を切り取り、スマホ用に軽くしたものです。
// 未配置・読み込み失敗時は、既存のキャラクターでお祝い画面を作ります。
const ENDING_IMAGE = "assets/ending/family-celebration-no-text.jpg";

// duration: ボールが打撃位置に届くまでのミリ秒。大きいほど遅い。
// curve: 左右に曲がる最大幅。0 はストレート。
// curveChance: 変化球の割合（0～1）。spread: 到達位置のばらつき（0～1）。
// homeRunTiming / homeRunDistance: 通常モードのホームラン判定幅。省略時は SETTINGS の値。
// vanishChance: 「消える魔球」を投げる確率（0～1）。1球につき1回だけ抽選します。
// ステージ4は、変更前のステージ5（おおたに）と同じ球速・変化・判定です。
const STAGES = [
  { name: "ここ",          type: "cat",   duration: 2150, curve: 0,  curveChance: 0,    spread: .24, number: "0",  image: "assets/pitchers/koko-pitcher.png", description: "ねこの ここが ごあいさつ。\nゆっくりの ボールを なげるよ。" },
  { name: "こうへい",      type: "human", duration: 1850, curve: 0,  curveChance: 0,    spread: .40, number: "4",  image: "assets/pitchers/kohei-pitcher.png", description: "かぞくの こうへいが とうじょう！\nすこし はやい ボールに ちょうせん。" },
  { name: "さいきひろと",  type: "human", duration: 1530, curve: 27, curveChance: .45,  spread: .52, number: "35", image: "assets/pitchers/saiki-hiroto-pitcher.png", description: "きれのある ストレート！\nときどき まがる ボールも くるよ。" },
  { name: "えなつゆたか",  type: "human", duration: 1080, curve: 57, curveChance: .85,  spread: .76, number: "28", image: "assets/pitchers/enatsu-yutaka-pitcher.png", description: "でんせつの とうしゅと しょうぶ！\nはやい ボールが さゆうに まがるよ。" },
  // ラスボス: 球速 約+12.5%（1080→960ms）、ホームラン判定を少し厳しく、消える魔球 50%。
  { name: "おおたにしょうへい", type: "human", duration: 960, curve: 57, curveChance: .85, spread: .76, homeRunTiming: .13, homeRunDistance: 35, vanishChance: .5, number: "16", image: "assets/pitchers/ohtani-shohei-pitcher.png", description: "いよいよ、さいごの しょうぶ！\nきえる まきゅうも なげてくるよ。" }
];

// プレイヤー別の難易度（通常モードに対する倍率）。ここにない人・書いていない項目は 1（変更なし）。
// 祖父母（イージーモード）には使いません。倍率は投球開始時に1回だけ掛けます。
// hideTarget: true で黄色の予測枠を表示しない（見た目だけ。到達位置・判定は同じ）。
// ホームラン幅の外側に、より広いヒット幅があるため、少しずれた当たりはヒットになります。
const PLAYER_DIFFICULTY = {
  kouhei: {
    hideTarget: true,
    homeRunTiming: .75,   // ホームランのタイミング幅 -25%
    homeRunDistance: .75  // ホームランに必要なバット位置の精度 25%厳しく
  },
  akari: { hideTarget: true },
  ryota: {
    hideTarget: true,
    speed: 1.2,           // 球速 +20%（到達時間 ÷1.2）
    curve: 1.15,          // 変化量 +15%
    homeRunTiming: .75 * .65,  // 以前の .75 からさらに -35%（= .4875）
    homeRunDistance: 1 * .65,  // 以前の 1 からさらに -35%（= .65）
    hitTiming: .85,       // ヒットのタイミング幅 -15%（これより外は空振り）
    hitDistance: .9       // ヒットの位置ずれ許容 -10%
  },
  miho: { hideTarget: true }
};

const SETTINGS = {
  homeRunsToClear: 3,
  outsToLose: 3,
  firstPitchWait: 1600,
  nextPitchWait: 1000,
  resultWait: 1400,
  homeRunWait: 2300,
  // 祖父母は全ステージゆっくり。ステージ5でも2.6秒以上。
  easyMinDuration: 2600,
  easySpeedFactor: 1.5,
  easyHomeRunStart: .20,
  easyHomeRunEnd: 1.24,
  normalHomeRunTiming: .15,
  normalHitTiming: .25,
  normalHomeRunDistance: 38,
  normalHitDistance: 66,
  // 消える魔球。値は投球の進み具合（0=投げた瞬間、1=打撃位置）。
  vanishStart: .50,     // ここから消え始める
  vanishEnd: .85,       // ここから再び見え始める（.90でくっきり）
  vanishFade: .05,      // 消える・現れるときの透明度アニメーションの長さ
  easyVanishEnd: .65,   // 祖父母は早めに再出現して打ちやすく
  // ファール。バットに当たった（ホームラン・ヒット判定になった）ときだけ抽選します。
  normalFoulChance: .30, // ともひろ・こうへい・あかり・りょうた・みほ
  easyFoulChance: .10,   // たかひろ・くみこ
  passedAt: 1.26,
  aimWidth: 85,
  aimHeight: 36
};

// ============================================================
// 2. ゲームのルール（描画から独立。Node.jsでもテストできます）
// ============================================================
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const freshRecord = () => ({ version: 1, cleared: 0, homeRuns: 0, outs: 0 });

function normalizeRecord(value) {
  if (!value || value.version !== 1) return freshRecord();
  const integer = (v, max) => Number.isInteger(v) ? clamp(v, 0, max) : 0;
  const cleared = integer(value.cleared, STAGES.length);
  return { version: 1, cleared, homeRuns: cleared === STAGES.length ? 0 : integer(value.homeRuns, 2), outs: cleared === STAGES.length ? 0 : integer(value.outs, 3) };
}

// 速度・変化・判定幅・消える魔球は、ここ（投球開始時）で1回だけ決めて pitch に保存します。
// boost は PLAYER_DIFFICULTY の補正。イージーモードには適用しません。
function makePitch(stageIndex, easy, random = Math.random, boost = null) {
  const stage = STAGES[stageIndex];
  const factor = key => (!easy && boost && boost[key]) || 1;
  const curve = random() < stage.curveChance ? stage.curve * (random() < .5 ? -1 : 1) : 0;
  const target = { x: (random() * 2 - 1) * stage.spread, y: (random() * 2 - 1) * stage.spread * .7 };
  const vanish = stage.vanishChance > 0 && random() < stage.vanishChance;
  return {
    elapsed: 0, progress: 0, resolved: false, result: null,
    duration: easy ? Math.max(SETTINGS.easyMinDuration, stage.duration * SETTINGS.easySpeedFactor) : stage.duration / factor("speed"),
    curve: easy ? curve * .25 : curve * factor("curve"),
    target,
    homeRunTiming: (stage.homeRunTiming ?? SETTINGS.normalHomeRunTiming) * factor("homeRunTiming"),
    homeRunDistance: (stage.homeRunDistance ?? SETTINGS.normalHomeRunDistance) * factor("homeRunDistance"),
    hitTiming: SETTINGS.normalHitTiming * factor("hitTiming"),
    hitDistance: SETTINGS.normalHitDistance * factor("hitDistance"),
    vanish: vanish ? { start: SETTINGS.vanishStart, end: easy ? SETTINGS.easyVanishEnd : SETTINGS.vanishEnd } : null
  };
}

// 消える魔球の見た目だけの透明度（0～1）。位置・判定は progress のまま変わりません。
function ballOpacity(pitch) {
  const vanish = pitch && pitch.vanish;
  if (!vanish || pitch.progress < vanish.start) return 1;
  if (pitch.progress < vanish.end) return clamp(1 - (pitch.progress - vanish.start) / SETTINGS.vanishFade, 0, 1);
  return clamp((pitch.progress - vanish.end) / SETTINGS.vanishFade, 0, 1);
}

function judgeSwing(pitch, aim, easy) {
  const p = pitch.progress;
  if (easy) {
    if (p >= SETTINGS.easyHomeRunStart && p <= SETTINGS.easyHomeRunEnd) return "homeRun";
    return p >= .10 && p < SETTINGS.easyHomeRunStart ? "hit" : "miss";
  }
  const timing = Math.abs(p - 1);
  const distance = Math.hypot((aim.x - pitch.target.x) * SETTINGS.aimWidth, (aim.y - pitch.target.y) * SETTINGS.aimHeight);
  if (timing <= (pitch.homeRunTiming ?? SETTINGS.normalHomeRunTiming) && distance <= (pitch.homeRunDistance ?? SETTINGS.normalHomeRunDistance)) return "homeRun";
  if (timing <= (pitch.hitTiming ?? SETTINGS.normalHitTiming) && distance <= (pitch.hitDistance ?? SETTINGS.normalHitDistance)) return "hit";
  return "miss";
}

// ---- 打球の方向とファール ----
// 球場の絵のファウルライン: ホーム(210, 0.84h) から (-40, 0.56h) と (460, 0.56h) へ。
// x は球場の横幅420の座標、y は高さに対する割合。ライン上はフェア。
const FIELD = { homeX: 210, homeY: .84, lineReach: 250, lineDrop: .28 };
const FAIR_DIRECTIONS = ["left", "leftCenter", "center", "rightCenter", "right"];
function isFairLanding(x, y) {
  return y < FIELD.homeY && Math.abs(x - FIELD.homeX) <= FIELD.lineReach * (FIELD.homeY - y) / FIELD.lineDrop;
}

// 打球の飛び先。結果が決まったときに1回だけ作り、飛行中は乱数を使いません。
// 右打者なので、早いスイング・内角はレフト、遅いスイング・外角はライトへ。
function makeFlight(result, pitch, aim, easy, random = Math.random) {
  const jitter = (random() * 2 - 1) * (easy ? .7 : .35);
  const timing = easy ? (pitch.progress - .72) / .52 : (pitch.progress - 1) / (pitch.hitTiming ?? SETTINGS.normalHitTiming);
  const bat = easy ? 0 : (aim.x - pitch.target.x) * .6;
  const lean = clamp(clamp(timing, -1, 1) * .7 + pitch.target.x * .5 + bat + jitter, -1, 1);
  const vary = random(), spread = (random() * 2 - 1) * 15;
  if (result === "foul") {
    // 必ず左右どちらかのファウルラインの外（画面の外）へ。
    const side = lean < 0 ? -1 : 1;
    return { direction: side < 0 ? "foulLeft" : "foulRight", x: side < 0 ? -30 : 450, y: .62 + vary * .1, lift: .08 + vary * .06, duration: 950 };
  }
  const direction = FAIR_DIRECTIONS[Math.round((lean + 1) * 2)];
  const index = FAIR_DIRECTIONS.indexOf(direction);
  if (result === "homeRun") {
    // どの方向でも外野スタンド（フェンスより奥）へ。高さ・飛距離を少し変える。
    return { direction, x: [30, 120, 210, 300, 390][index] + spread, y: .25 - vary * .08, lift: .34 + vary * .12, duration: 1800 };
  }
  // ヒットはフェンス手前の外野の芝まで。
  return { direction, x: [40, 120, 210, 300, 380][index] + spread, y: .52 - vary * .1, lift: .07 + vary * .07, duration: 1050 };
}

// スイングの結果を1回だけ決める: ①当たったか → ②当たったときだけファール抽選 → ③打球を決める。
function decideSwing(pitch, aim, easy, random = Math.random) {
  const contact = judgeSwing(pitch, aim, easy);
  if (contact === "miss") return { result: "miss", flight: null };
  const foul = random() < (easy ? SETTINGS.easyFoulChance : SETTINGS.normalFoulChance);
  const result = foul ? "foul" : contact;
  return { result, flight: makeFlight(result, pitch, aim, easy, random) };
}

// 重要: スイング・見逃しの両方が必ずこの関数を通ります。
// resolved を最初に立てるため、1球につき確定は1回だけです。
function resolvePitch(pitch, result) {
  if (!pitch || pitch.resolved) return false;
  pitch.resolved = true;
  pitch.result = result;
  return true;
}

function applyResult(record, result, easy) {
  const next = { ...record };
  if (next.cleared >= STAGES.length) return { record: next, outcome: "champion" };
  if (result === "homeRun") next.homeRuns += 1;
  if (!easy && (result === "miss" || result === "look")) next.outs += 1;
  if (next.homeRuns >= SETTINGS.homeRunsToClear) {
    next.cleared += 1;
    next.homeRuns = 0;
    next.outs = 0;
    return { record: next, outcome: next.cleared === STAGES.length ? "champion" : "stageClear" };
  }
  return { record: next, outcome: next.outs >= SETTINGS.outsToLose ? "gameOver" : "continue" };
}

function retryRecord(record) {
  return { ...record, homeRuns: 0, outs: 0 };
}

class SaveStore {
  constructor(storage, onError = () => {}) {
    this.storage = storage;
    this.onError = onError;
    this.memory = new Map();
    this.prefix = "family-homerun:v1:";
  }
  has(id) {
    if (this.memory.has(id)) return true;
    try { return this.storage.getItem(this.prefix + id) !== null; }
    catch { return false; }
  }
  read(id) {
    // localStorageが使えない場合も、このタブの中では進行を保持します。
    if (this.memory.has(id)) return { ...this.memory.get(id) };
    try {
      const value = this.storage.getItem(this.prefix + id);
      return normalizeRecord(value ? JSON.parse(value) : null);
    } catch { this.onError(); return freshRecord(); }
  }
  write(id, record) {
    const clean = normalizeRecord(record);
    this.memory.set(id, clean);
    try { this.storage.setItem(this.prefix + id, JSON.stringify(clean)); }
    catch { this.onError(); }
  }
}

// ============================================================
// 3. 仮キャラクターと球場。画像なし・ネット接続なしでも描画。
// ============================================================
function portraitSVG(person, cat = false) {
  const background = '<circle cx="60" cy="60" r="56" fill="#e4ead7"/>';
  if (cat) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" aria-hidden="true">${background}<path d="M31 110Q21 77 39 65H81Q99 82 89 110" fill="#ffdc35" stroke="#263329" stroke-width="3"/><path d="M29 45L25 12 48 30Q60 25 72 30L95 12 91 45Q103 86 60 88Q17 86 29 45" fill="#b79669" stroke="#263329" stroke-width="3"/><path d="M31 24L43 35 32 39M88 24L78 35 89 39" fill="#e5b6a4"/><path d="M51 30L55 43M62 28V42M73 31L68 44M28 56L40 59M27 66L39 67M92 56L80 59M93 66L81 67" stroke="#62503c" stroke-width="4" stroke-linecap="round"/><path d="M42 56Q47 50 51 56M69 56Q74 50 78 56" fill="none" stroke="#263329" stroke-width="3" stroke-linecap="round"/><path d="M56 65L60 69 64 65M60 69V73M60 73Q54 79 49 73M60 73Q66 79 71 73" fill="none" stroke="#263329" stroke-width="2.5"/><ellipse cx="40" cy="67" rx="7" ry="4" fill="#dca087"/><ellipse cx="80" cy="67" rx="7" ry="4" fill="#dca087"/><path d="M47 90V109M73 90V109" stroke="#263329" stroke-width="2"/></svg>`;
  const p = person;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" aria-hidden="true">${background}
    <path d="M22 116Q23 83 44 80H76Q97 83 98 116" fill="#fffdf5" stroke="#263329" stroke-width="3"/>
    <path d="M37 90V116M49 86V118M71 86V118M83 90V116" stroke="#59604d" stroke-width="1.5"/>
    <path d="M43 81L60 94 77 81" fill="#ffdc35" stroke="#263329" stroke-width="3"/>
    ${p.bob ? `<path d="M29 48Q26 18 60 18Q96 17 92 56L96 82H25Z" fill="${p.hair}"/>` : ""}
    <circle cx="31" cy="57" r="7" fill="${p.skin}"/><circle cx="89" cy="57" r="7" fill="${p.skin}"/>
    <path d="M31 41Q31 20 60 20Q89 20 89 41V58Q89 83 60 85Q31 83 31 58Z" fill="${p.skin}" stroke="#263329" stroke-width="2.5"/>
    <path d="M31 47V34Q36 14 61 17Q87 16 90 39L87 49 81 35Q57 44 44 34L37 49Z" fill="${p.hair}"/>
    <path d="M29 32Q30 10 60 10Q88 10 90 32Z" fill="#263329"/><path d="M28 31H92Q88 40 71 38H28Z" fill="#ffdc35" stroke="#263329" stroke-width="2"/>
    <path d="M57 18H66M61 18V27" stroke="#ffdc35" stroke-width="3"/>
    <path d="M43 54Q47 50 51 54M69 54Q73 50 77 54" fill="none" stroke="#263329" stroke-width="2.5" stroke-linecap="round"/>
    ${p.glasses ? '<rect x="37" y="45" width="22" height="17" rx="6" fill="none" stroke="#4d5149" stroke-width="2"/><rect x="63" y="45" width="22" height="17" rx="6" fill="none" stroke="#4d5149" stroke-width="2"/><path d="M59 51H63" stroke="#4d5149" stroke-width="2"/>' : ""}
    <ellipse cx="39" cy="65" rx="7" ry="4" fill="#e7a38e" opacity=".7"/><ellipse cx="81" cy="65" rx="7" ry="4" fill="#e7a38e" opacity=".7"/>
    <path d="M51 68Q60 79 69 68" fill="#fffdf5" stroke="#874f3c" stroke-width="2" stroke-linejoin="round"/>
    <text x="60" y="111" text-anchor="middle" font-size="15" font-family="sans-serif" font-weight="900" fill="#263329">${p.number || ""}</text></svg>`;
}

function makePortrait(person, src = "", cat = false) {
  const wrapper = document.createElement("span");
  wrapper.className = "portrait";
  wrapper.innerHTML = portraitSVG(person, cat);
  if (src) {
    const img = new Image();
    img.alt = "";
    img.onload = () => { wrapper.querySelector("svg").style.visibility = "hidden"; };
    img.onerror = () => img.remove();
    img.src = src;
    wrapper.append(img);
  }
  return wrapper;
}

const imageCache = new Map();
function cachedImage(src) {
  if (!src) return null;
  if (!imageCache.has(src)) {
    const img = new Image();
    imageCache.set(src, img);
    img.onload = () => { if (window.derby?.screen === "title") window.derby.drawTitle(); };
    img.src = src;
  }
  const img = imageCache.get(src);
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function ellipse(ctx, x, y, rx, ry, fill, stroke = null) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
function path(ctx, points, fill, stroke = null, close = true) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawStadium(ctx, w, h) {
  const horizon = h * .29;
  ctx.fillStyle = "#c4e5d4"; ctx.fillRect(0, 0, w, h);
  ellipse(ctx, 70, horizon * .28, 36, 10, "#eff5dc");
  ellipse(ctx, 350, horizon * .43, 42, 11, "#eff5dc");
  // スタンド、照明、スコアボード。
  [27, w - 27].forEach(x => {
    ctx.fillStyle = "#607c67"; ctx.fillRect(x - 2, horizon * .18, 4, horizon * .85);
    ctx.fillStyle = "#f4f1d5"; ctx.fillRect(x - 17, horizon * .16, 34, 12);
    ctx.strokeStyle = "#607c67"; ctx.lineWidth = 2; ctx.strokeRect(x - 17, horizon * .16, 34, 12);
  });
  path(ctx, [[0, horizon * .72], [w * .18, horizon * .56], [w * .82, horizon * .56], [w, horizon * .72], [w, horizon + 20], [0, horizon + 20]], "#66836b");
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 36; col++) {
      const x = col * 12 + (row % 2) * 5;
      const y = horizon * .72 + row * 7;
      ctx.fillStyle = (row + col) % 5 === 0 ? "#ffdc35" : (row + col) % 3 === 0 ? "#bcd2ad" : "#e2e7c5";
      ctx.fillRect(x, y, 5, 4);
    }
  }
  ctx.fillStyle = "#223d32"; ctx.fillRect(w / 2 - 49, horizon * .3, 98, horizon * .43);
  ctx.strokeStyle = "#d4dbaa"; ctx.lineWidth = 2; ctx.strokeRect(w / 2 - 45, horizon * .3 + 4, 90, horizon * .43 - 8);
  ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffdc35";
  ctx.fillText("H O M E  R U N", w / 2, horizon * .48);
  ctx.fillStyle = "#d2dfb2"; ctx.font = "8px sans-serif"; ctx.fillText("1  2  3  4  5     ★", w / 2, horizon * .62);
  ctx.fillStyle = "#2e6248"; ctx.fillRect(0, horizon + 12, w, 24);
  ctx.fillStyle = "#ffdc35"; ctx.fillRect(0, horizon + 10, w, 4);
  ctx.fillStyle = "#709d57"; ctx.fillRect(0, horizon + 36, w, h - horizon);
  // 芝の縞。
  for (let i = -3; i < 8; i++) {
    path(ctx, [[w / 2 + i * 40, horizon + 36], [w / 2 + (i + .5) * 40, horizon + 36], [w / 2 + (i + .5) * 110, h], [w / 2 + i * 110, h]], "#7da761");
  }
  // 甲子園を思わせる土の内野。
  const plateY = h * .84;
  path(ctx, [[w / 2, h * .42], [w + 45, h * .79], [w + 50, h], [-50, h], [-45, h * .79]], "#c7aa79");
  path(ctx, [[w / 2, h * .48], [w * .86, h * .73], [w / 2, plateY], [w * .14, h * .73]], "#87a96b");
  ellipse(ctx, w / 2, h * .52, 36, 12, "#c7aa79");
  ctx.lineWidth = 2.5;
  path(ctx, [[-40, h * .56], [w / 2, plateY], [w + 40, h * .56]], null, "#fff5d5", false);
  path(ctx, [[w / 2 - 14, plateY - 5], [w / 2 + 14, plateY - 5], [w / 2 + 14, plateY + 3], [w / 2, plateY + 13], [w / 2 - 14, plateY + 3]], "#fffdf1");
  ctx.fillStyle = "#fff3d3"; ctx.fillRect(w / 2 - 9, h * .52, 18, 3);
  [[w * .16, h * .73], [w * .84, h * .73]].forEach(([x, y]) => path(ctx, [[x - 7, y], [x, y - 3], [x + 7, y], [x, y + 3]], "#fff5d9"));
  ctx.strokeStyle = "#f9edca"; ctx.lineWidth = 2;
  ctx.strokeRect(w / 2 - 84, plateY - 29, 47, 57);
  ctx.strokeRect(w / 2 + 37, plateY - 29, 47, 57);
}

function drawCharacter(ctx, x, feetY, height, person, options = {}) {
  const src = options.back ? person.batter : person.image || person.portrait;
  const custom = cachedImage(src);
  if (custom) {
    const width = height * custom.naturalWidth / custom.naturalHeight;
    const rotation = options.rotation || 0;
    // 回転しても画像の下端が足元より下にはみ出さないように補正。
    const lift = Math.abs(Math.sin(rotation)) * width / 2;
    ctx.save();
    ctx.translate(x, feetY - lift);
    ctx.rotate(rotation);
    ctx.drawImage(custom, -width / 2, -height, width, height);
    ctx.restore();
    return true; // 画像を描いたときだけtrue（バットの二重描画防止用）。
  }
  ctx.save(); ctx.translate(x, feetY); ctx.scale(height / 120, height / 120);
  ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
  ellipse(ctx, 0, -1, 30, 7, "#4b432f33");
  if (options.cat) {
    ctx.strokeStyle = "#65533e"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(23, -22); ctx.quadraticCurveTo(43, -14, 33, -44); ctx.stroke();
    path(ctx, [[-24, -5], [-23, -45], [-14, -60], [14, -60], [23, -45], [24, -5]], "#ffdc35", "#263329");
    path(ctx, [[-29, -80], [-31, -110], [-10, -98], [10, -98], [31, -110], [29, -80]], "#b79669", "#263329");
    ellipse(ctx, 0, -79, 32, 29, "#b79669", "#263329");
    ctx.strokeStyle = "#65533e"; ctx.lineWidth = 4;
    [[-12, -103, -8, -92], [0, -106, 0, -92], [12, -103, 8, -92], [-29, -83, -20, -80], [29, -83, 20, -80]].forEach(([a,b,c,d]) => path(ctx, [[a,b],[c,d]], null, "#65533e", false));
    ellipse(ctx, -12, -80, 2.4, 3.3, "#263329"); ellipse(ctx, 12, -80, 2.4, 3.3, "#263329");
    path(ctx, [[-4,-71],[0,-67],[4,-71]], "#704539");
    ctx.lineWidth = 2; path(ctx, [[-5,-61],[0,-64],[5,-61]], null, "#263329", false);
    ellipse(ctx, -19, -31, 13, 16, "#8e6039", "#263329");
    ellipse(ctx, 20, -28, 7, 8, "#b79669", "#263329");
    ctx.restore(); return;
  }
  // 足、ユニフォーム、頭の順。バッターは後ろ向き。
  path(ctx, [[-22, -5], [-18, -42], [0, -39], [-5, -5]], "#f7f4dc", "#263329");
  path(ctx, [[5, -5], [0, -39], [18, -42], [23, -5]], "#f7f4dc", "#263329");
  ellipse(ctx, -15, -3, 13, 5, "#263329"); ellipse(ctx, 17, -3, 13, 5, "#263329");
  path(ctx, [[-23, -39], [-25, -72], [-14, -82], [14, -82], [25, -72], [23, -39]], "#fffbea", "#263329");
  [-15, -6, 6, 15].forEach(s => path(ctx, [[s,-77],[s,-40]], null, "#8b8e71", false));
  ctx.fillStyle = "#263329"; ctx.fillRect(-23, -41, 46, 5);
  ellipse(ctx, 0, -91, 24, 24, person.skin || "#efc7a5", "#263329");
  if (options.back) {
    ellipse(ctx, 0, -96, 24, 20, person.hair || "#464238");
    path(ctx, [[-24,-94],[-24,-106],[-16,-117],[14,-119],[24,-108],[24,-94]], "#263329");
    ctx.fillStyle = "#ffdc35"; ctx.fillRect(-23, -96, 47, 6);
    ctx.fillStyle = "#fffbea"; ctx.fillRect(-10, -69, 20, 22);
    ctx.fillStyle = "#263329"; ctx.font = "bold 19px sans-serif"; ctx.textAlign = "center"; ctx.fillText(person.number || "1", 0, -50);
  } else {
    path(ctx, [[-24,-96],[-24,-106],[-14,-118],[14,-118],[24,-105],[24,-96]], "#263329");
    path(ctx, [[-26,-98],[29,-98],[23,-91],[-24,-91]], "#ffdc35", "#263329");
    ellipse(ctx, -8, -85, 2, 2.5, "#263329"); ellipse(ctx, 8, -85, 2, 2.5, "#263329");
    path(ctx, [[-5,-77],[0,-74],[5,-77]], null, "#80513c", false);
    ctx.fillStyle = "#ffdc35"; ctx.fillRect(-4, -110, 8, 3);
    ellipse(ctx, -18, -60, 14, 15, "#99623b", "#263329");
  }
  if (options.back) {
    path(ctx, [[15,-71],[29,-65],[35,-77]], null, "#263329", false);
    ellipse(ctx, 33, -77, 7, 7, person.skin || "#efc7a5", "#263329");
  } else { ellipse(ctx, 23, -55 + (options.throwing ? -16 : 0), 7, 8, person.skin || "#efc7a5", "#263329"); }
  ctx.restore();
}

function drawBall(ctx, x, y, radius) {
  ctx.save(); ctx.lineWidth = 1.5;
  ellipse(ctx, x + 1, y + 2, radius + 1, radius + 1, "#26332933");
  ellipse(ctx, x, y, radius, radius, "#fffdf5", "#394439");
  ctx.strokeStyle = "#ce6552"; ctx.lineWidth = Math.max(1, radius * .12);
  ctx.beginPath(); ctx.arc(x - radius * .85, y, radius * .72, -.9, .9); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + radius * .85, y, radius * .72, Math.PI - .9, Math.PI + .9); ctx.stroke();
  ctx.restore();
}

// Web Audioで短い打球音を合成。音声ファイルは不要です。
class GameAudio {
  constructor() { this.context = null; this.enabled = true; }
  unlock() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.context) this.context = new AudioContextClass();
      if (this.context.state === "suspended") this.context.resume().catch(() => {});
    } catch { /* 音が使えない環境でもゲームは続ける */ }
  }
  tone(frequency, start, duration, volume = .12, type = "sine") {
    if (!this.enabled || !this.context || this.context.state !== "running") return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const time = this.context.currentTime + start;
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(volume, time); gain.gain.exponentialRampToValueAtTime(.001, time + duration);
    oscillator.connect(gain); gain.connect(this.context.destination);
    oscillator.start(time); oscillator.stop(time + duration);
  }
  hit(homeRun) {
    this.tone(1550, 0, .38, .18, "triangle");
    this.tone(2380, .015, .30, .07);
    if (homeRun) [523, 659, 784, 1047].forEach((note, i) => this.tone(note, .18 + i * .11, .26, .075));
  }
  // ファール: こすったような短い「カツッ」と、下がる2音。
  foul() {
    this.tone(980, 0, .12, .14, "triangle");
    this.tone(440, .16, .14, .06); this.tone(330, .30, .18, .06);
  }
  celebrate() { [523, 659, 784, 659, 784, 1047].forEach((note, i) => this.tone(note, i * .13, .28, .08)); }
  // エンディング用の短いファンファーレ（約1.8秒）。タタタ・ターン、タ・ジャーン！
  fanfare() {
    [[392, 0, .12], [392, .14, .12], [392, .28, .12], [523, .42, .32], [392, .78, .12]].forEach(([note, start, length]) => this.tone(note, start, length, .08, "triangle"));
    [523, 659, 784, 1047].forEach(note => this.tone(note, .94, .9, .05, "triangle"));
  }
}

// ============================================================
// 4. 画面・入力・ゲーム進行。ゲーム用setTimeoutは使わず、
// 1本のrequestAnimationFrameとphaseで管理します。
// ready → pitching → result → 次の球 / クリア / ゲームオーバー
// ============================================================
class HomeRunGame {
  constructor() {
    this.$ = id => document.getElementById(id);
    this.screen = "title";
    this.player = PLAYERS[0];
    this.selectedPlayerId = null;
    this.record = freshRecord();
    this.audio = new GameAudio();
    this.aim = { x: 0, y: 0 };
    this.pointerId = null;
    this.paused = false;
    this.frameId = null;
    this.lastFrame = null;
    this.world = { w: 420, h: 480 };
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let storage;
    try { storage = window.localStorage; } catch { storage = null; }
    this.store = new SaveStore(storage, () => { this.$("storage-warning").hidden = false; });
    this.bindEvents();
    this.renderPlayers();
    this.drawTitle();
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.$("arena"));
    this.resizeObserver.observe(this.$("title-canvas"));
    PLAYERS.forEach(p => { cachedImage(p.batter); });
    STAGES.forEach(s => { cachedImage(s.image); });
    cachedImage(ENDING_IMAGE); // エンディングで仮画面が一瞬見えないよう先に読み込む
  }

  bindEvents() {
    document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => this.showScreen(button.dataset.go)));
    this.$("start-button").addEventListener("click", () => { this.audio.unlock(); this.showScreen("players"); });
    this.$("continue-button").addEventListener("click", () => this.record.cleared === STAGES.length ? this.showEnding() : this.showRules());
    this.$("restart-button").addEventListener("click", () => { this.record = freshRecord(); this.save(); this.showRules(); });
    this.$("rules-next").addEventListener("click", () => this.record.outs >= SETTINGS.outsToLose && !this.player.easy ? this.showGameOver() : this.showStageIntro());
    this.$("play-button").addEventListener("click", () => this.startStage());
    this.$("swing-button").addEventListener("click", () => this.swing());
    this.$("next-stage-button").addEventListener("click", () => this.showStageIntro());
    this.$("retry-button").addEventListener("click", () => { this.record = retryRecord(this.record); this.save(); this.showStageIntro(); });
    this.$("ending-players").addEventListener("click", () => this.showScreen("players"));
    this.$("ending-replay").addEventListener("click", () => {
      if (this.screen !== "ending") return;
      // 「さいしょから」と同じ保存処理。選択中の人だけをリセットする。
      this.audio.unlock(); this.record = freshRecord(); this.save(); this.showStageIntro();
    });
    this.$("pause-button").addEventListener("click", () => this.pause());
    this.$("unpause-button").addEventListener("click", () => this.unpause());
    this.$("leave-button").addEventListener("click", () => this.showScreen("players"));
    this.$("sound-button").addEventListener("click", () => {
      this.audio.unlock(); this.audio.enabled = !this.audio.enabled;
      this.$("sound-button").textContent = `おと：${this.audio.enabled ? "オン" : "オフ"}`;
      this.$("sound-button").setAttribute("aria-pressed", String(this.audio.enabled));
    });
    const pad = this.$("bat-pad");
    pad.addEventListener("pointerdown", event => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0) || this.player.easy || this.paused || this.screen !== "game" || this.pointerId !== null || this.state.phase === "result") return;
      event.preventDefault(); this.audio.unlock(); this.pointerId = event.pointerId;
      pad.setPointerCapture(event.pointerId); pad.classList.add("dragging"); this.updateAim(event);
    });
    pad.addEventListener("pointermove", event => {
      if (event.pointerId !== this.pointerId) return;
      event.preventDefault(); this.updateAim(event);
    });
    pad.addEventListener("pointerup", event => {
      if (event.pointerId !== this.pointerId) return;
      event.preventDefault(); this.updateAim(event); this.releasePointer(); this.swing();
    });
    ["pointercancel", "lostpointercapture"].forEach(type => pad.addEventListener(type, () => this.releasePointer()));
    pad.addEventListener("contextmenu", event => event.preventDefault());
    document.addEventListener("keydown", event => this.onKey(event));
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.pause(); });
    window.addEventListener("blur", () => this.pause());
    window.addEventListener("pagehide", () => { if (this.screen === "game") this.save(); });
  }

  showScreen(name) {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null; this.lastFrame = null; this.releasePointer();
    this.screen = name; this.paused = false;
    this.$("pause-overlay").hidden = true;
    this.setGameInert(false);
    document.querySelectorAll(".screen").forEach(section => { section.hidden = section.id !== `screen-${name}`; });
    document.body.classList.toggle("playing", name === "game");
    if (name === "players") this.renderPlayers();
    if (name === "title") this.drawTitle();
    window.scrollTo(0, 0);
    const heading = this.$(`screen-${name}`).querySelector("h2[tabindex]");
    if (heading) heading.focus({ preventScroll: true });
  }

  renderPlayers() {
    this.$("easy-players").replaceChildren(); this.$("normal-players").replaceChildren();
    PLAYERS.forEach(player => {
      const record = this.store.read(player.id);
      const card = document.createElement("button"); card.className = "player-card";
      card.type = "button";
      card.dataset.playerId = player.id;
      card.setAttribute("aria-pressed", String(this.selectedPlayerId === player.id));
      card.append(makePortrait(player, PLAYER_SELECT_IMAGES[player.id] || player.portrait));
      const name = document.createElement("span"); name.className = "player-name"; name.textContent = player.name; card.append(name);
      const progress = document.createElement("span"); progress.className = "player-record";
      progress.textContent = record.cleared === 5 ? "★ ホームラン王！" : this.store.has(player.id) ? `ステージ ${record.cleared + 1} まで` : "はじめて あそぶ";
      card.append(progress); card.addEventListener("click", () => this.selectPlayer(player));
      this.$(player.easy ? "easy-players" : "normal-players").append(card);
    });
  }

  selectPlayer(player) {
    this.selectedPlayerId = player.id;
    document.querySelectorAll(".player-card").forEach(card => {
      card.setAttribute("aria-pressed", String(card.dataset.playerId === player.id));
    });
    this.player = player; this.record = this.store.read(player.id); this.audio.unlock();
    if (this.store.has(player.id)) {
      this.$("resume-portrait").replaceChildren(makePortrait(player, player.portrait));
      this.$("resume-heading").textContent = `${player.name}、おかえり！`;
      this.$("resume-summary").textContent = this.record.cleared === STAGES.length ? "ぜんぶのステージを クリアしているよ！" : `ステージ ${this.record.cleared + 1} / 5　ホームラン ${this.record.homeRuns}/3${player.easy ? "" : `　アウト ${this.record.outs}/3`}`;
      this.$("restart-note").textContent = `「さいしょから」は ${player.name}の きろくだけを リセットするよ。`;
      this.showScreen("resume");
    } else this.showRules();
  }

  showRules() {
    const selected = this.$("rules-player"); selected.replaceChildren(makePortrait(this.player, this.player.portrait));
    const label = document.createElement("div"); label.textContent = this.player.name;
    const mode = document.createElement("small"); mode.textContent = this.player.easy ? "かんたんモード" : "かぞくモード"; label.append(mode); selected.append(label);
    const rules = this.player.easy ? [
      ["ボールを まとう", "おくの とうしゅが、ゆっくり なげるよ。"],
      ["「うつ！」を タップ", "ボールが きたら、おおきな きいろいボタンを おそう。"],
      ["3ぼんで クリア！", "ホームランを 3ぼん。5にんの とうしゅと あそぼう。"]
    ] : (PLAYER_DIFFICULTY[this.player.id] || {}).hideTarget ? [
      // 黄色の予測枠がない人向けの説明
      ["バットを ひっぱろう", "したのエリアで ゆびを うごかして、＋を ボールが くる ところに あわせよう。"],
      ["ボールが きたら はなす！", "ボールが ＋に とどくタイミングで ゆびを はなすと スイング。"],
      ["ホームラン 3ぼんで クリア", "ヒットは きろくそのまま。からぶり・みのがしは 1アウトだよ。"]
    ] : [
      ["バットを ひっぱろう", "したのエリアで ゆびを うごかして、＋を きいろの わくに あわせよう。"],
      ["ボールが きたら はなす！", "ボールが わくに とどくタイミングで ゆびを はなすと スイング。"],
      ["ホームラン 3ぼんで クリア", "ヒットは きろくそのまま。からぶり・みのがしは 1アウトだよ。"]
    ];
    const content = this.$("rules-content"); content.replaceChildren();
    rules.forEach(([title, text], i) => {
      const row = document.createElement("div"); row.className = "rule-card";
      row.innerHTML = `<span class="rule-step">${i + 1}</span><div><strong>${title}</strong><p>${text}</p></div>`; content.append(row);
    });
    const reassurance = document.createElement("p"); reassurance.className = "rule-reassurance";
    reassurance.textContent = this.player.easy ? "からぶりしても、みのがしても だいじょうぶ。なんどでも うてるよ！" : "3アウトで ゲームオーバー。でも、いまのステージから なんどでも やりなおせるよ！"; content.append(reassurance);
    this.showScreen("rules");
  }

  showStageIntro() {
    if (this.record.cleared >= STAGES.length) { this.showEnding(); return; }
    const index = this.record.cleared, stage = STAGES[index];
    this.$("stage-number").textContent = `ステージ ${index + 1} / 5`;
    this.$("stage-heading").textContent = stage.name;
    this.$("pitcher-portrait").replaceChildren(makePortrait(this.pitcherPerson(index), stage.image || (index === 1 ? PLAYERS[3].portrait : ""), stage.type === "cat"));
    this.$("stage-description").style.whiteSpace = "pre-line";
    this.$("stage-description").textContent = this.player.easy ? (index === 0 ? "ねこの ここが ごあいさつ。" : `${stage.name}と しょうぶ！`) + "\nあわてず、ゆっくり うってね。" : stage.description;
    this.$("stage-progress").innerHTML = STAGES.map((s, i) => `<span class="stage-dot ${i < index ? "done" : i === index ? "current" : ""}" aria-label="ステージ${i + 1}${i < index ? 'クリア' : i === index ? 'これから' : ''}">${i < index ? "✓" : i + 1}</span>`).join("");
    this.$("stage-goal").textContent = this.record.homeRuns || this.record.outs ? `ホームラン ${this.record.homeRuns}/3${this.player.easy ? "" : `・アウト ${this.record.outs}/3`} から つづけるよ` : "ホームラン 3ぼんで クリア！";
    this.showScreen("stage");
  }

  pitcherPerson(index) {
    if (index === 1) return { ...PLAYERS[3], image: STAGES[index].image };
    return { ...PLAYERS[2], number: STAGES[index].number, image: STAGES[index].image, portrait: "" };
  }

  startStage() {
    if (this.record.cleared >= STAGES.length) { this.showEnding(); return; }
    if (!this.player.easy && this.record.outs >= SETTINGS.outsToLose) { this.showGameOver(); return; }
    this.audio.unlock(); this.save(); this.aim = { x: 0, y: 0 };
    this.state = { phase: "ready", age: 0, wait: SETTINGS.firstPitchWait, pitch: null, outcome: "continue", stageIndex: this.record.cleared, homeRuns: this.record.homeRuns, outs: this.record.outs, swingAge: 1000 };
    this.$("game-stage").textContent = `${this.state.stageIndex + 1} / 5　${STAGES[this.state.stageIndex].name}`;
    this.$("batter-name").textContent = `${this.player.name}の ばん！`;
    this.$("easy-controls").hidden = !this.player.easy; this.$("normal-controls").hidden = this.player.easy;
    this.$("out-box").hidden = this.player.easy; this.$("easy-badge").hidden = !this.player.easy;
    this.$("shot-result").hidden = true;
    this.updateScore(); this.updateHandle(); this.setPitchMessage("ボールが くるよ！");
    this.showScreen("game"); this.resizeCanvas(); this.updateControls();
    this.$("game-canvas").focus({ preventScroll: true });
    this.frameId = requestAnimationFrame(now => this.loop(now));
  }

  save() { this.store.write(this.player.id, this.record); }

  updateScore() {
    this.$("home-score").innerHTML = `${this.state.homeRuns}<span>/3</span>`;
    this.$("out-score").textContent = `${this.state.outs}/3`;
  }

  setPitchMessage(text, ready = false) {
    if (this.$("pitch-message").textContent !== text) this.$("pitch-message").textContent = text;
    this.$("pitch-message").classList.toggle("hit-now", ready);
  }

  beginPitch() {
    this.state.phase = "pitching"; this.state.age = 0;
    this.state.pitch = makePitch(this.state.stageIndex, this.player.easy, Math.random, PLAYER_DIFFICULTY[this.player.id]);
    this.$("shot-result").hidden = true; this.setPitchMessage("ボールを よくみてね"); this.updateControls();
  }

  swing() {
    if (this.screen !== "game" || this.paused || this.state.phase !== "pitching" || this.state.pitch.resolved) return;
    this.audio.unlock(); this.state.swingAge = 0;
    const { result, flight } = decideSwing(this.state.pitch, this.aim, this.player.easy);
    this.finishPitch(result, flight);
  }

  finishPitch(result, flight = null) {
    const state = this.state;
    if (!resolvePitch(state.pitch, result)) return;
    // 打球の飛び先は結果確定時に1回だけ決めて保存（描画中は再抽選しない）。
    state.pitch.flight = ["homeRun", "hit", "foul"].includes(result) ? flight || makeFlight(result, state.pitch, this.aim, this.player.easy) : null;
    this.releasePointer();
    const change = applyResult(this.record, result, this.player.easy);
    if (result === "homeRun") state.homeRuns += 1;
    if (!this.player.easy && (result === "miss" || result === "look")) state.outs += 1;
    this.record = change.record; this.save();
    state.outcome = change.outcome; state.phase = "result"; state.age = 0;
    this.updateScore(); this.updateControls();
    this.$("shot-result").hidden = false;
    this.$("shot-result").classList.toggle("miss", result === "miss" || result === "look");
    const messages = {
      homeRun: ["カキーン！", "ホームラン！！", `${state.homeRuns}ぼんめ！ ${state.homeRuns === 3 ? "やったね！" : "そのちょうし！"}`],
      hit: ["カンッ！", "ヒット！", "いいね！ つぎも うとう"],
      foul: ["カツッ！", "ファール！", "アウトには ならないよ"],
      miss: ["", "からぶり！", this.player.easy ? "だいじょうぶ！ もういっかい" : `アウト ${state.outs}/3`],
      look: ["", "みのがし！", this.player.easy ? "あわてなくて だいじょうぶ" : `アウト ${state.outs}/3`]
    };
    const [sound, title, detail] = messages[result];
    this.$("result-sound").textContent = sound; this.$("result-title").textContent = title; this.$("result-detail").textContent = detail;
    this.setPitchMessage(result === "homeRun" ? "おおきい！ どこまで とぶかな？" : result === "hit" ? "ナイス バッティング！" : "つぎの ボールも いこう！");
    if (result === "homeRun" || result === "hit") this.audio.hit(result === "homeRun");
    else if (result === "foul") this.audio.foul();
  }

  afterResult() {
    if (this.state.outcome === "champion") { this.showEnding(); return; }
    if (this.state.outcome === "stageClear") {
      this.$("clear-stage").textContent = `ステージ ${this.state.stageIndex + 1} / 5`;
      this.$("clear-message").textContent = `${this.player.name}、ナイスバッティング！`;
      this.audio.celebrate(); this.showScreen("clear"); return;
    }
    if (this.state.outcome === "gameOver") { this.showGameOver(); return; }
    this.state.phase = "ready"; this.state.age = 0; this.state.wait = SETTINGS.nextPitchWait;
    this.$("shot-result").hidden = true; this.setPitchMessage("つぎの ボールが くるよ！"); this.updateControls();
  }

  showGameOver() {
    this.$("gameover-stage").textContent = `ステージ ${Math.min(this.record.cleared + 1, 5)} / 5`;
    this.showScreen("gameover");
  }

  showEnding() {
    const player = this.player;
    this.$("ending-heading").replaceChildren();
    this.$("ending-heading").append(document.createTextNode(`${player.name}、`), document.createElement("br"));
    const champion = document.createElement("span"); champion.textContent = "ホームラン王！"; this.$("ending-heading").append(champion);
    this.$("ending-player-icon").replaceChildren(makePortrait(player, PLAYER_SELECT_IMAGES[player.id] || player.portrait));
    const group = this.$("family-celebration"); group.replaceChildren();
    group.classList.remove("has-artwork");
    PLAYERS.forEach(person => {
      const member = document.createElement("div"); member.className = `family-member${person.id === player.id ? " hero" : ""}`;
      member.append(makePortrait(person, PLAYER_SELECT_IMAGES[person.id] || person.portrait));
      const name = document.createElement("span"); name.textContent = person.name; member.append(name); group.append(member);
    });
    const pet = document.createElement("div"); pet.className = "family-pet";
    pet.append(makePortrait(this.pitcherPerson(0), STAGES[0].image, true));
    const petName = document.createElement("span"); petName.textContent = "ここ"; pet.append(petName); group.append(pet);

    // 画像を読み込めるまでは仮のお祝い画面を残す。別の人の画面への遅延反映も防ぐ。
    const request = {}; this.endingImageRequest = request;
    const img = new Image(); img.alt = "かぞく7にんと、ねこの ここが やきゅうじょうで おいわい"; img.className = "ending-art";
    const showArtwork = () => { group.replaceChildren(img); group.classList.add("has-artwork"); };
    img.onload = () => {
      if (this.screen !== "ending" || this.endingImageRequest !== request) return;
      showArtwork();
    };
    img.onerror = () => { /* 仮の家族7人と「ここ」をそのまま表示する */ };
    img.src = player.ending || ENDING_IMAGE;
    if (img.complete && img.naturalWidth > 0) showArtwork(); // 読み込み済みなら最初から画像を出す

    // 24枚のCSSアニメーションだけ。終了した紙吹雪は取り除く。
    const confetti = this.$("ending-confetti"); confetti.replaceChildren();
    if (!this.reducedMotion) {
      for (let i = 0; i < 24; i++) {
        const piece = document.createElement("span");
        piece.style.left = `${(i * 43) % 100}%`;
        piece.style.backgroundColor = ["#e6a900", "#26734d", "#ea7756", "#fffdf5"][i % 4];
        piece.style.animationDuration = `${2.8 + (i % 5) * .3}s`;
        piece.style.animationDelay = `${(i % 6) * .12}s`;
        piece.style.setProperty("--drift", `${(i % 2 ? 1 : -1) * (22 + i * 2)}px`);
        piece.style.setProperty("--turn", `${(i % 2 ? 1 : -1) * 540}deg`);
        piece.addEventListener("animationend", () => piece.remove(), { once: true });
        confetti.append(piece);
      }
    }
    // 既存の音設定を尊重。タップ操作で解錠済みのAudioContextが再生可能な場合だけ音が鳴る。
    this.audio.fanfare(); this.showScreen("ending");
  }

  updateAim(event) {
    const box = this.$("bat-pad").getBoundingClientRect();
    this.aim = { x: clamp((event.clientX - box.left) / box.width * 2 - 1, -1, 1), y: clamp((event.clientY - box.top) / box.height * 2 - 1, -1, 1) };
    this.updateHandle();
  }
  updateHandle() {
    // 端でもハンドル全体が見えるよう、表示だけ内側に寄せます。
    this.$("bat-handle").style.left = `${50 + this.aim.x * 38}%`;
    this.$("bat-handle").style.top = `${50 + this.aim.y * 24}%`;
  }
  releasePointer() {
    const id = this.pointerId; this.pointerId = null;
    const pad = this.$("bat-pad"); pad.classList.remove("dragging");
    if (id !== null && pad.hasPointerCapture(id)) pad.releasePointerCapture(id);
  }
  updateControls() {
    const enabled = this.state.phase === "pitching" && !this.paused;
    this.$("swing-button").disabled = !enabled;
    this.$("bat-pad").classList.toggle("inactive", this.state.phase === "result" || this.paused);
    this.$("easy-hint").textContent = enabled ? "ボールが きたら タップ！" : "つぎの ボールを まってね";
  }

  onKey(event) {
    if (this.screen !== "game") return;
    if (this.paused) {
      if (event.code === "Escape") { event.preventDefault(); this.unpause(); }
      if (event.code === "Tab") {
        const first = this.$("unpause-button"), last = this.$("leave-button");
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (event.code === "Escape") { event.preventDefault(); this.pause(); return; }
    if (event.code === "Space") {
      if (document.activeElement.tagName === "BUTTON" && document.activeElement.id !== "swing-button") return;
      event.preventDefault(); if (!event.repeat) this.swing();
    }
    if (!this.player.easy && event.code.startsWith("Arrow")) {
      event.preventDefault();
      if (event.code === "ArrowLeft") this.aim.x -= .12;
      if (event.code === "ArrowRight") this.aim.x += .12;
      if (event.code === "ArrowUp") this.aim.y -= .16;
      if (event.code === "ArrowDown") this.aim.y += .16;
      this.aim.x = clamp(this.aim.x, -1, 1); this.aim.y = clamp(this.aim.y, -1, 1); this.updateHandle();
    }
  }

  setGameInert(value) {
    this.$("screen-game").querySelectorAll(".game-header, .arena, .game-controls").forEach(el => { el.inert = value; });
  }
  pause() {
    if (this.screen !== "game" || this.paused) return;
    this.paused = true; this.releasePointer(); this.save();
    this.$("pause-overlay").hidden = false; this.setGameInert(true); this.updateControls();
    this.$("unpause-button").focus();
  }
  unpause() {
    if (!this.paused) return;
    this.paused = false; this.lastFrame = null; this.$("pause-overlay").hidden = true;
    this.setGameInert(false); this.audio.unlock(); this.updateControls();
    this.$(this.player.easy ? "game-canvas" : "bat-pad").focus({ preventScroll: true });
  }

  loop(now) {
    if (this.screen !== "game") return;
    // 復帰時や重い端末でボールが突然通過しないよう、1回の進行を制限。
    const delta = this.lastFrame === null ? 0 : clamp(now - this.lastFrame, 0, 60);
    this.lastFrame = now;
    if (!this.paused) this.update(delta);
    if (this.screen !== "game") return;
    this.drawGame(); this.frameId = requestAnimationFrame(time => this.loop(time));
  }
  update(delta) {
    const state = this.state; state.age += delta; state.swingAge += delta;
    if (state.phase === "ready" && state.age >= state.wait) this.beginPitch();
    else if (state.phase === "pitching") {
      const pitch = state.pitch; pitch.elapsed += delta; pitch.progress = pitch.elapsed / pitch.duration;
      const ready = this.player.easy ? pitch.progress >= SETTINGS.easyHomeRunStart : pitch.progress >= .84;
      if (ready) this.setPitchMessage(this.player.easy ? "いま！「うつ！」を おそう！" : "いま！ はなそう！", true);
      else if (pitch.vanish && pitch.progress >= pitch.vanish.start) this.setPitchMessage("きえる まきゅう！？");
      if (pitch.progress >= SETTINGS.passedAt) this.finishPitch("look");
    } else if (state.phase === "result" && state.age >= (state.pitch.result === "homeRun" ? SETTINGS.homeRunWait : SETTINGS.resultWait)) this.afterResult();
  }

  resizeCanvas() {
    if (this.screen === "title") { this.drawTitle(); return; }
    if (this.screen !== "game") return;
    const canvas = this.$("game-canvas"), rect = this.$("arena").getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    this.world = { w: 420, h: rect.height / rect.width * 420 };
    this.drawGame();
  }

  drawTitle() {
    const canvas = this.$("title-canvas"), ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const w = 420, h = 270;
    canvas.width = 840; canvas.height = 540; ctx.setTransform(2, 0, 0, 2, 0, 0);
    drawStadium(ctx, w, h);
    drawCharacter(ctx, 210, h * .52, 62, { ...this.pitcherPerson(0), image: "" }, { cat: true });
    // タイトルは既存の仮イラストを使用。
    drawCharacter(ctx, 145, h * .93, 116, { ...PLAYERS[0], batter: "" }, { back: true });
    ctx.strokeStyle = "#263329"; ctx.lineWidth = 13; ctx.lineCap = "round";
    path(ctx, [[171, 194], [155, 139]], null, "#263329", false);
    ctx.lineWidth = 8; path(ctx, [[171, 194], [155, 139]], null, "#dc9e51", false);
    drawBall(ctx, 220, 167, 9);
  }

  drawGame() {
    const canvas = this.$("game-canvas"), ctx = canvas.getContext("2d");
    const { w, h } = this.world, state = this.state;
    if (!state) return;
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    ctx.clearRect(0, 0, w, h); drawStadium(ctx, w, h);
    // pitcherHeightは従来のボール出発位置にも使うため、変更しない。
    const pitcherHeight = Math.min(80, h * .19);
    const pitcher = this.pitcherPerson(state.stageIndex);
    const hasPitcherImage = !!cachedImage(pitcher.image);
    // 画像だけ見やすくする。縦横比はdrawCharacterで維持する。
    const displayHeight = hasPitcherImage ? Math.min(124, h * .28) : pitcherHeight;
    const throwing = state.phase === "pitching" && state.pitch.progress < .2;
    const step = hasPitcherImage && throwing
      ? Math.sin(state.pitch.progress / .2 * Math.PI) * (this.reducedMotion ? 2 : 6)
      : 0;
    // 胸元を従来のボール出発位置に合わせ、投球時に画像だけ少し前へ動かす。
    const displayFeet = h * .52 + (displayHeight - pitcherHeight) / 2 + step;
    drawCharacter(ctx, w / 2, displayFeet, displayHeight, pitcher, { cat: state.stageIndex === 0, throwing });
    const zoneY = h * .77;
    const target = state.pitch && state.phase === "pitching" ? state.pitch.target : { x: 0, y: 0 };
    const targetX = w / 2 + target.x * SETTINGS.aimWidth, targetY = zoneY + target.y * SETTINGS.aimHeight;
    // 黄色の輪は打撃位置。白い＋が自分のバット位置。
    // hideTarget の人は輪を描かないだけ（targetX/Y はボールの軌道に引き続き使う）。
    ctx.save(); ctx.strokeStyle = "#ffdf35"; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
    if (!(PLAYER_DIFFICULTY[this.player.id] || {}).hideTarget) ellipse(ctx, targetX, targetY, 29, 22, "#ffdc3518", "#ffe45b");
    ctx.setLineDash([]);
    if (!this.player.easy) {
      const aimX = w / 2 + this.aim.x * SETTINGS.aimWidth, aimY = zoneY + this.aim.y * SETTINGS.aimHeight;
      ctx.lineWidth = 5; ctx.strokeStyle = "#263329";
      path(ctx, [[aimX - 11, aimY], [aimX + 11, aimY]], null, "#263329", false);
      path(ctx, [[aimX, aimY - 11], [aimX, aimY + 11]], null, "#263329", false);
      ctx.lineWidth = 2.5;
      path(ctx, [[aimX - 11, aimY], [aimX + 11, aimY]], null, "#fffdf5", false);
      path(ctx, [[aimX, aimY - 11], [aimX, aimY + 11]], null, "#fffdf5", false);
    }
    ctx.restore();
    // 打者の大きさは低い画面でも球が見えるように調整。
    const batterHeight = Math.min(136, h * .38), batterX = w * .29, batterFeet = h * .96;
    // 既存のスイング経過時間で350msだけ回転し、元の姿勢に戻す。
    const swing = state.swingAge < 350 ? Math.sin(state.swingAge / 350 * Math.PI) : 0;
    const hasBatterImage = drawCharacter(ctx, batterX, batterFeet, batterHeight, this.player, {
      back: true, rotation: swing * (this.reducedMotion ? .08 : .30)
    });
    // 用意した画像にはバットが含まれる。仮描画のときだけ従来のバットを重ねる。
    if (!hasBatterImage) this.drawBat(ctx, batterX, batterFeet, batterHeight);
    if (state.phase === "pitching") {
      const p = state.pitch.progress, depth = p * p;
      const x = w / 2 + (targetX - w / 2) * depth + Math.sin(Math.PI * Math.min(p, 1)) * state.pitch.curve;
      const startY = h * .52 - pitcherHeight * .5;
      const y = startY + (targetY - startY) * depth;
      const radius = 3 + 10 * depth;
      // 消える魔球でも位置は毎フレーム計算し続け、透明度だけを変える。
      const opacity = ballOpacity(state.pitch);
      if (opacity > 0) {
        ctx.save(); ctx.globalAlpha = opacity;
        ellipse(ctx, x, y + 21 + 9 * p, radius * .8, radius * .28, "#35472e28");
        drawBall(ctx, x, y, radius); ctx.restore();
      }
    }
    if (state.phase === "result" && state.pitch.flight) this.drawFlight(ctx, w, h);
  }

  drawBat(ctx, x, feet, height) {
    const swing = this.state.swingAge < 350 ? Math.sin(this.state.swingAge / 350 * Math.PI) : 0;
    ctx.save(); ctx.translate(x + height * .29, feet - height * .64);
    ctx.rotate(-.4 + swing * 2.2 + (this.player.easy ? 0 : this.aim.x * .18));
    ctx.lineCap = "round"; ctx.lineWidth = 12;
    path(ctx, [[0, 0], [0, -height * .5]], null, "#263329", false);
    ctx.lineWidth = 8; path(ctx, [[0, 0], [0, -height * .5]], null, "#d69b54", false);
    ctx.lineWidth = 9; path(ctx, [[0, 0], [0, -12]], null, "#f4ebcc", false); ctx.restore();
  }

  drawFlight(ctx, w, h) {
    const state = this.state, homeRun = state.pitch.result === "homeRun", shot = state.pitch.flight;
    const t = clamp(state.age / shot.duration, 0, 1);
    if (t >= 1 && !homeRun) return;
    const startX = w / 2 + state.pitch.target.x * SETTINGS.aimWidth;
    const startY = h * .77 + state.pitch.target.y * SETTINGS.aimHeight;
    // 着地点は makeFlight で決めた値（x: 横幅420の座標、y・高さ: 画面の高さの割合）。
    const endX = shot.x / 420 * w, endY = h * shot.y;
    const flight = n => ({ x: startX + (endX - startX) * n, y: startY + (endY - startY) * n - Math.sin(n * Math.PI) * h * shot.lift });
    const point = flight(t);
    if (!this.reducedMotion) {
      ctx.lineWidth = 3; ctx.strokeStyle = "#fff7dcb0"; ctx.beginPath();
      for (let n = Math.max(0, t - .16); n <= t; n += .015) { const p = flight(n); n === Math.max(0, t - .16) ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); } ctx.stroke();
    }
    drawBall(ctx, point.x, point.y, 12 * (1 - t) + 3);
    if (homeRun && !this.reducedMotion) {
      for (let i = 0; i < 20; i++) {
        const px = (i * 83 + state.age * .025 * (i % 2 ? 1 : -1) + w * 2) % w;
        const py = (state.age * .085 + i * 29) % h;
        ctx.save(); ctx.translate(px, py); ctx.rotate(i + state.age * .002);
        ctx.fillStyle = ["#ffdc35", "#fffdf5", "#e47748"][i % 3]; ctx.fillRect(-3, -5, 6, 10); ctx.restore();
      }
    }
  }
}

// ブラウザでは起動。Node.jsでは純粋なルールだけを読み込んで検証。
if (typeof document !== "undefined") window.derby = new HomeRunGame();
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PLAYERS, STAGES, SETTINGS, PLAYER_DIFFICULTY, freshRecord, normalizeRecord, makePitch, ballOpacity, judgeSwing, decideSwing, makeFlight, isFairLanding, FAIR_DIRECTIONS, resolvePitch, applyResult, retryRecord, SaveStore };
}
