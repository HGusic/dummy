(function () {
  const VF = window.VF;
  const KEY = "voltzfire.mvp.v1";
  const FEELS = ["not so good", "ok", "solid", "dialed in"];
  const PLANS = ["Go for it", "Lay up", "Away from trouble"];

  let state;
  let ui = { sheet: null, rule: null, toast: "", keepScroll: false, caption: "" };
  let toastTimer = 0;

  function fresh() {
    return {
      feel: "solid",
      voice: "rex",
      fitting: "rec",
      practiceDays: 5,
      lastPractice: null,
      week: [true, true, false, false, false, false, false],
      progress: {},
      custom: [],
      lab: {},
      notes: [],
      setup: { friends: ["Maya Chen"], contests: ["putts", "driveAcc"], random: false },
      round: null,
      rounds: [
        {
          id: "seed-41",
          date: "2026-09-27",
          total: 41,
          putts: 16,
          toPar: 5,
          played: 9,
          mode: "solo",
          holes: [6, 5, 3, 5, 6, 4, 4, 4, 4].map((strokes, i) => ({
            strokes,
            putts: [2, 2, 1, 2, 2, 2, 1, 2, 2][i],
            plan: null,
            yards: VF.holes[i].approach,
            values: {},
          })),
        },
        { id: "seed-43", date: "2026-09-18", total: 43, putts: 17, toPar: 7, played: 9, mode: "solo", holes: null },
        { id: "seed-44", date: "2026-09-12", total: 44, putts: 18, toPar: 8, played: 9, mode: "solo", holes: null },
      ],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        state = fresh();
        return;
      }
      const saved = JSON.parse(raw);
      const base = fresh();
      state = Object.assign(base, saved, {
        setup: Object.assign(base.setup, saved.setup || {}),
        week: saved.week || base.week,
      });
    } catch (err) {
      state = fresh();
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function parse() {
    const raw = (location.hash || "#/home").slice(1);
    const cut = raw.indexOf("?");
    const path = (cut === -1 ? raw : raw.slice(0, cut)) || "/home";
    const q = Object.fromEntries(new URLSearchParams(cut === -1 ? "" : raw.slice(cut + 1)));
    return { path, q };
  }

  function today() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function weekdayIndex() {
    return (new Date().getDay() + 6) % 7;
  }

  function rel(n) {
    if (n == null || Number.isNaN(n)) return "–";
    if (n === 0) return "E";
    return n > 0 ? "+" + n : String(n);
  }

  function shuffle(list, seed) {
    const copy = list.slice();
    let s = Math.abs(seed % 2147483646) + 1;
    for (let i = copy.length - 1; i > 0; i--) {
      s = (s * 48271) % 2147483647;
      const j = s % (i + 1);
      const hold = copy[i];
      copy[i] = copy[j];
      copy[j] = hold;
    }
    return copy;
  }

  function contestById(id) {
    return VF.contests.find((item) => item.id === id);
  }

  function drillById(id) {
    return VF.drills.find((item) => item.id === id) || state.custom.find((item) => item.id === id);
  }

  function dailyDrill() {
    const day = Math.floor(Date.now() / 86400000);
    return drillById(VF.dailies[day % VF.dailies.length]);
  }

  function prog(id) {
    if (!state.progress[id]) state.progress[id] = { marks: [], posted: null };
    return state.progress[id];
  }

  function makesOf(id) {
    return (prog(id).marks || []).filter(Boolean).length;
  }

  function playersOf(round) {
    return [VF.player.name].concat(round.friends || []);
  }

  function bump(spec, value, dir) {
    if (value == null || Number.isNaN(value)) return spec.start;
    const next = value + dir * spec.step;
    return Math.max(spec.min, Math.min(spec.max, next));
  }

  function summarize(round) {
    let total = 0;
    let putts = 0;
    let par = 0;
    let played = 0;
    (round.holes || []).forEach((hole, index) => {
      if (hole.strokes == null) return;
      played += 1;
      total += hole.strokes;
      putts += hole.putts || 0;
      par += VF.holes[index].par;
    });
    return { total, putts, par, played, toPar: played ? total - par : null };
  }

  function notePractice() {
    if (state.lastPractice === today()) return;
    state.lastPractice = today();
    state.practiceDays += 1;
    state.week[weekdayIndex()] = true;
  }

  function toast(message) {
    ui.toast = message;
    ui.keepScroll = true;
    render();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      ui.toast = "";
      ui.keepScroll = true;
      render();
    }, 2200);
  }

  function icon(name) {
    const paths = {
      home: "M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1z",
      flag: "M6 21V4m0 0h11l-2.2 4 2.2 4H6",
      bolt: "M13 2 4 14h7l-1 8 10-12h-7z",
      lab: "M9 3h6M10 3v5.5L5.2 20h13.6L14 8.5V3",
      user: "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM5 21a7 7 0 0 1 14 0",
    };
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="' + paths[name] + '"/></svg>';
  }

  function holeSvg(hole) {
    const paths = {
      left: "M100 258 C102 190 62 168 74 112 C84 64 124 52 118 30",
      right: "M100 258 C98 190 146 170 134 112 C124 64 86 52 100 30",
      straight: "M100 258 C104 180 96 120 100 30",
    };
    const pins = { left: [118, 30], right: [100, 30], straight: [100, 30] };
    const bunkers = {
      left: [[64, 52], [146, 64]],
      right: [[52, 150], [148, 48]],
      straight: [[62, 78], [140, 86]],
    };
    const pin = pins[hole.shape];
    const sand = bunkers[hole.shape].map((spot) => '<ellipse cx="' + spot[0] + '" cy="' + spot[1] + '" rx="18" ry="10" fill="#ff7a14"/>').join("");
    return '<svg class="map" viewBox="0 0 200 280" role="img" aria-label="Sketch of hole ' + hole.n + '">' +
      '<rect width="200" height="280" fill="#12151c"/>' +
      '<path d="' + paths[hole.shape] + '" fill="none" stroke="#1e6cff" stroke-width="34" stroke-linecap="round" opacity="0.38"/>' +
      sand +
      '<circle cx="100" cy="250" r="5" fill="#f4f6fb"/>' +
      '<text x="110" y="254" fill="#9aa3b5" font-size="12" font-family="Barlow,sans-serif">Tee</text>' +
      '<circle cx="' + pin[0] + '" cy="' + pin[1] + '" r="9" fill="none" stroke="#f4f6fb" stroke-width="2"/>' +
      '<path d="M' + pin[0] + " " + pin[1] + " v-18 h12" + '" stroke="#ff7a14" fill="none" stroke-width="2"/>' +
      "</svg>";
  }

  function sparkSvg() {
    const values = state.rounds.slice(0, 7).map((round) => round.total).reverse();
    if (values.length < 2) return "";
    const w = 320;
    const h = 72;
    const min = Math.min.apply(null, values) - 1;
    const max = Math.max.apply(null, values) + 1;
    const pts = values.map((value, index) => {
      const x = 8 + (index * (w - 16)) / (values.length - 1);
      const y = 10 + ((max - value) * (h - 20)) / (max - min || 1);
      return x.toFixed(1) + "," + y.toFixed(1);
    });
    const last = pts[pts.length - 1].split(",");
    return '<svg class="spark" viewBox="0 0 ' + w + " " + h + '" aria-hidden="true">' +
      '<polyline fill="none" stroke="#1e6cff" stroke-width="3" points="' + pts.join(" ") + '"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="4" fill="#ff7a14"/>' +
      "</svg>";
  }

  function shell(body) {
    const route = parse().path;
    const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const tabs = [
      ["#/home", "home", "Home", route === "/home"],
      ["#/play", "flag", "Play", route === "/play" || route.indexOf("/play/") === 0],
      ["#/challenge", "bolt", "Challenge", route === "/challenge" || route.indexOf("/challenge/") === 0],
      ["#/lab", "lab", "Lab", route === "/lab" || route.indexOf("/lab/") === 0 || route === "/swing"],
      ["#/me", "user", "Me", route === "/me" || route === "/friends" || route === "/coach" || route === "/course"],
    ];
    const dock = tabs.map((tab) => '<a href="' + tab[0] + '" class="' + (tab[3] ? "on" : "") + '">' + icon(tab[1]) + "<span>" + tab[2] + "</span></a>").join("");
    return '<div class="island"></div>' +
      '<div class="statusbar"><span id="clock">' + esc(time) + '</span><span class="sys" aria-hidden="true"><span class="battery"><i></i></span></span></div>' +
      '<div class="scroll">' + body + "</div>" +
      '<nav class="dock">' + dock + "</nav>" +
      '<div class="home-ind"></div>' +
      sheetHtml() +
      (ui.toast ? '<div class="toast">' + esc(ui.toast) + "</div>" : "");
  }

  function sheetHtml() {
    if (!ui.sheet) return "";
    if (ui.sheet === "install") {
      return '<div class="sheet" data-act="close-sheet"><div class="sheet-card" data-act="noop"><div class="grab"></div><h2>Add to Home Screen</h2><p class="mt-s">On iPhone, open Share, then Add to Home Screen. VoltzFire then opens full screen, like an app.</p><button class="btn" data-act="close-sheet" type="button">Done</button></div></div>';
    }
    const open = ui.rule ? VF.rules.find((rule) => rule.id === ui.rule) : null;
    const list = VF.rules.map((rule) => '<button class="rule' + (ui.rule === rule.id ? " on" : "") + '" type="button" data-act="open-rule" data-id="' + rule.id + '">' + esc(rule.title) + "</button>").join("");
    const detail = open
      ? '<div class="mt"><h2>' + esc(open.title) + "</h2><p class=\"mt-s\">" + esc(open.body) + "</p>" +
        (open.penalty && state.round ? '<button class="btn" type="button" data-act="penalty">Add 1 penalty stroke</button>' : "") +
        "</div>"
      : '<p class="tiny mt">Tap a situation. The card still changes only when you add the stroke.</p>';
    return '<div class="sheet" data-act="close-sheet"><div class="sheet-card" data-act="noop"><div class="grab"></div><p class="kicker">Rules helper</p><h2>Hazards and drops</h2>' + detail + list + '<button class="btn ghost" type="button" data-act="close-sheet">Close</button></div></div>';
  }

  function viewHome() {
    const latest = state.rounds[0];
    const daily = dailyDrill();
    const marks = prog(daily.id);
    const made = marks.marks.filter(Boolean).length;
    const status = marks.marks.length ? made + " of " + marks.marks.length + " logged" : "Not started";
    const days = ["M", "T", "W", "T", "F", "S", "S"].map((label, index) => '<i class="' + (state.week[index] ? "on" : "") + '" title="' + label + '"></i>').join("");
    const mood = FEELS.map((feel) => {
      const label = { "not so good": "Rough", ok: "OK", solid: "Solid", "dialed in": "Dialed" }[feel];
      return '<button type="button" data-act="feel" data-val="' + esc(feel) + '" class="' + (state.feel === feel ? "on" : "") + '">' + label + "</button>";
    }).join("");
    return '<div class="who"><div class="avatar">J</div><div><div class="kicker">' + esc(VF.player.home) + "</div><b>" + esc(VF.player.name) + " · " + esc(state.feel) + "</b></div></div>" +
      "<h1 class=\"mt\">Let's go, " + esc(VF.player.name) + ".</h1>" +
      '<p class="muted mt-s">Best ' + VF.player.best + " · " + esc(VF.course.name) + "</p>" +
      '<div class="statline"><div><b>' + latest.total + '</b><span>Last 9</span></div><div><b>' + state.practiceDays + '</b><span>Day streak</span></div><div><b>' + latest.putts + "</b><span>Putts</span></div></div>" +
      '<p class="tiny mt">How you felt</p><div class="seg mt-s">' + mood + "</div>" +
      '<a class="panel" href="#/challenge/run?id=' + daily.id + '"><p class="kicker fire">Today</p><h2>' + esc(daily.name) + "</h2><p class=\"mt-s\">" + esc(daily.detail) + "</p><p class=\"tiny mt-s\">" + status + " · clear at " + daily.need + " of " + daily.tries + "</p></a>" +
      '<div class="mt-l"><p class="kicker">Jump in</p>' +
      (state.round ? '<a class="row" href="#/play/hole"><span class="grow"><b>Resume hole ' + (state.round.hole + 1) + '</b><span>' + (state.round.mode === "game" ? "Game with friends" : "Solo round") + "</span></span><span class=\"chev\">›</span></a>" : "") +
      '<a class="row" href="#/play"><span class="grow"><b>' + esc(VF.course.name) + "</b><span>Start a round · par " + VF.course.par + "</span></span><span class=\"chev\">›</span></a>" +
      '<a class="row" href="#/play/setup"><span class="grow"><b>Game with friends</b><span>Putts, drives, hazards, or a random hole</span></span><span class="chev">›</span></a>' +
      '<a class="row" href="#/lab"><span class="grow"><b>Learning lab</b><span>Short stations and a quick check</span></span><span class="chev">›</span></a></div>' +
      '<div class="mt-l"><p class="kicker">This week</p><div class="week" aria-label="Days practiced">' + days + "</div></div>" +
      '<div class="mt-l"><p class="kicker">Friends</p>' +
      VF.feed.slice(0, 3).map((item) => '<a class="row" href="#/friends"><span class="avatar ghost">' + esc(item.name.slice(0, 1)) + '</span><span class="grow"><b>' + esc(item.name) + "</b><span>" + esc(item.text) + "</span></span></a>").join("") +
      "</div>" +
      '<div class="mt-l"><p class="kicker">Score trend</p><p class="tiny">Last nines. Lower on the line is a lower score.</p>' + sparkSvg() + "</div>";
  }

  function viewPlay() {
    const yards = VF.holes.reduce((sum, hole) => sum + hole.yds, 0);
    return '<p class="kicker">On course</p><h1>' + esc(VF.course.name) + "</h1>" +
      '<p class="muted mt-s">' + esc(VF.course.place) + " · Par " + VF.course.par + " · " + yards + " yards</p>" +
      (state.round ? '<a class="btn" href="#/play/hole">Resume hole ' + (state.round.hole + 1) + "</a>" : '<button class="btn" type="button" data-act="start-solo">Start round</button>') +
      '<a class="btn ghost" href="#/play/setup">Game with friends</a>' +
      '<button class="btn ghost" type="button" data-act="show-rules">Rules helper</button>' +
      '<a class="row mt" href="#/course"><span class="grow"><b>Hole list</b><span>One sample nine, with a play call</span></span><span class="chev">›</span></a>' +
      '<a class="row" href="#/play/card"><span class="grow"><b>Scorecard</b><span>Last nine · ' + state.rounds[0].total + "</span></span><span class=\"chev\">›</span></a>" +
      '<p class="tiny mt">Yardages are the sample card. The map is a sketch, so you can play without a signal.</p>';
  }

  function viewCourse() {
    const rows = VF.holes.map((hole) => '<a class="row" href="#/play"><span class="grow"><b>Hole ' + hole.n + " · Par " + hole.par + "</b><span>" + hole.yds + " yards · " + esc(hole.call) + "</span></span></a>").join("");
    return '<a class="tiny" href="#/play">Back to play</a><h1 class="mt-s">The nine</h1><p class="muted mt-s">' + esc(VF.course.name) + "</p>" + rows +
      '<p class="tiny mt">More courses can wait. <a href="https://youthoncourse.org/course-directory" target="_blank" rel="noreferrer">Youth on Course</a> has a directory when you want one.</p>';
  }

  function viewSetup() {
    const friends = VF.friends.map((name) => {
      const on = state.setup.friends.indexOf(name) !== -1;
      return '<button type="button" class="pick' + (on ? " on" : "") + '" data-act="setup-friend" data-name="' + esc(name) + '"><span class="box"></span><span>' + esc(name) + "</span></button>";
    }).join("");
    const chips = VF.contests.map((contest) => {
      const on = state.setup.contests.indexOf(contest.id) !== -1;
      return '<button type="button" class="chip' + (on ? " on" : "") + '" data-act="setup-contest" data-id="' + contest.id + '">' + esc(contest.label) + "</button>";
    }).join("");
    return '<a class="tiny" href="#/play">Back</a><h1 class="mt-s">Game mode</h1>' +
      '<p class="muted mt-s">Pick friends, then the things you want to score on each hole.</p>' +
      '<div class="mt">' + friends + "</div>" +
      '<button type="button" class="chip mt' + (state.setup.random ? " on" : "") + '" data-act="setup-random">' + (state.setup.random ? "Random challenge each hole · on" : "Random challenge each hole") + "</button>" +
      (state.setup.random ? '<p class="tiny mt-s">Each hole gets one challenge. You will not know the next one until you get there.</p>' : '<div class="chips mt">' + chips + "</div>") +
      '<button class="btn" type="button" data-act="start-game">Tee off</button>';
  }

  function viewHole() {
    const round = state.round;
    if (!round) return viewPlay();
    const index = round.hole;
    const info = VF.holes[index];
    const hole = round.holes[index];
    const base = info.approach;
    const pin = hole.yards === base - 8 ? "front" : hole.yards === base + 7 ? "back" : hole.yards === base ? "mid" : "";
    const bars = VF.holes.map((item, itemIndex) => '<i class="' + (itemIndex === index ? "on" : itemIndex < index && round.holes[itemIndex].strokes != null ? "done" : "") + '"></i>').join("");
    const plans = PLANS.map((plan) => '<button type="button" class="chip' + (hole.plan === plan ? " on" : "") + '" data-act="plan" data-val="' + esc(plan) + '">' + esc(plan) + "</button>").join("");
    const contest = contestBlock(round);
    return '<div class="toprow"><div><p class="kicker">Hole ' + info.n + " of 9 · " + info.yds + 'y</p><h1>Par ' + info.par + '</h1></div><button class="btn slim ghost" type="button" data-act="finish">End</button></div>' +
      '<div class="bar">' + bars + "</div>" +
      '<div class="twocol"><div><div class="label">Score</div><div class="stepper"><button class="round" type="button" data-act="step" data-field="strokes" data-dir="-1">−</button><div class="num sm">' + (hole.strokes == null ? "–" : hole.strokes) + '</div><button class="round" type="button" data-act="step" data-field="strokes" data-dir="1">+</button></div></div>' +
      '<div><div class="label">Putts</div><div class="stepper"><button class="round" type="button" data-act="step" data-field="putts" data-dir="-1">−</button><div class="num sm">' + (hole.putts == null ? "–" : hole.putts) + '</div><button class="round" type="button" data-act="step" data-field="putts" data-dir="1">+</button></div></div></div>' +
      '<button class="btn ghost" type="button" data-act="show-rules">Rules helper</button>' +
      contest +
      '<div class="split"><button class="btn ghost" type="button" data-act="hole-move" data-dir="-1"' + (index === 0 ? " disabled" : "") + ">Prev</button><button class=\"btn\" type=\"button\" data-act=\"hole-move\" data-dir=\"1\">" + (index === 8 ? "Finish" : "Next hole") + "</button></div>" +
      '<div class="yard"><div class="label">Yards to the pin</div><div class="num">' + hole.yards + "</div></div>" +
      '<div class="pins"><button type="button" data-act="pin" data-val="front" class="' + (pin === "front" ? "on" : "") + '"><b>Front</b><span>' + (base - 8) + 'y</span></button>' +
      '<button type="button" data-act="pin" data-val="mid" class="' + (pin === "mid" ? "on" : "") + '"><b>Mid</b><span>' + base + 'y</span></button>' +
      '<button type="button" data-act="pin" data-val="back" class="' + (pin === "back" ? "on" : "") + '"><b>Back</b><span>' + (base + 7) + "y</span></button></div>" +
      '<div class="split mt-s"><button class="btn ghost" type="button" data-act="yards" data-dir="-1">−1</button><button class="btn ghost" type="button" data-act="yards" data-dir="1">+1</button></div>' +
      holeSvg(info) +
      '<p class="tiny mt-s">' + esc(info.call) + "</p>" +
      '<p class="tiny mt">Plan</p><div class="chips mt-s">' + plans + "</div>";
  }

  function contestBlock(round) {
    const specs = round.mode !== "game" ? [] : round.random ? [contestById(round.randomIds[round.hole])] : round.contests.map(contestById).filter(Boolean);
    return specs.map((spec) => {
      const hole = round.holes[round.hole];
      const people = playersOf(round).map((name) => {
        const value = hole.values && hole.values[name] ? hole.values[name][spec.id] : null;
        if (spec.kind === "num") {
          const shown = value == null ? "–" : value + (spec.unit ? " " + spec.unit : "");
          return '<div class="label mt-s">' + esc(name) + '</div><div class="stepper"><button class="round" type="button" data-act="cstep" data-name="' + esc(name) + '" data-id="' + spec.id + '" data-dir="-1">−</button><div class="num sm">' + esc(shown) + '</div><button class="round" type="button" data-act="cstep" data-name="' + esc(name) + '" data-id="' + spec.id + '" data-dir="1">+</button></div>';
        }
        const options = spec.options.map((option) => '<button type="button" data-act="cchoice" data-name="' + esc(name) + '" data-id="' + spec.id + '" data-val="' + esc(option) + '" class="' + (value === option ? "on" : "") + '">' + esc(option) + "</button>").join("");
        return '<div class="label mt-s">' + esc(name) + '</div><div class="seg">' + options + "</div>";
      }).join("");
      return '<div class="panel voltbar"><p class="kicker">' + (round.random ? "Random this hole" : "With friends") + "</p><h2>" + esc(spec.label) + '</h2><p class="tiny mt-s">' + esc(spec.hint) + "</p>" + people + "</div>";
    }).join("");
  }

  function leaderLines(round, spec) {
    const scored = playersOf(round).map((name) => ({ name, score: aggregate(round, name, spec) })).filter((row) => row.score != null);
    if (!scored.length) return "No entries";
    scored.sort((a, b) => spec.lower ? a.score - b.score : b.score - a.score);
    const best = scored[0].score;
    const names = scored.filter((row) => row.score === best).map((row) => row.name);
    return names.join(" & ") + " · " + best + (spec.unit ? " " + spec.unit : "");
  }

  function aggregate(round, name, spec) {
    const values = [];
    (round.holes || []).forEach((hole, index) => {
      if (round.random && round.randomIds && round.randomIds[index] !== spec.id) return;
      const raw = hole.values && hole.values[name] ? hole.values[name][spec.id] : null;
      if (raw == null || raw === "") return;
      values.push(spec.kind === "choice" ? (spec.points[raw] || 0) : Number(raw));
    });
    if (!values.length) return null;
    if (spec.agg === "max") return Math.max.apply(null, values);
    if (spec.agg === "min") return Math.min.apply(null, values);
    return values.reduce((sum, value) => sum + value, 0);
  }

  function holeWinnerText(round, index, spec) {
    const hole = round.holes[index];
    const rows = playersOf(round).map((name) => {
      const raw = hole.values && hole.values[name] ? hole.values[name][spec.id] : null;
      if (raw == null || raw === "") return null;
      const score = spec.kind === "choice" ? (spec.points[raw] || 0) : Number(raw);
      return { name, score, raw };
    }).filter(Boolean);
    if (!rows.length) return "No entries";
    rows.sort((a, b) => spec.lower ? a.score - b.score : b.score - a.score);
    const top = rows[0].score;
    return rows.filter((row) => row.score === top).map((row) => row.name).join(" & ");
  }

  function viewCard() {
    const round = state.rounds.find((item) => item.id === parse().q.id) || state.rounds[0];
    let table = "";
    if (round.holes) {
      const head = "<tr><th></th>" + VF.holes.map((hole) => "<th>" + hole.n + "</th>").join("") + "<th>Tot</th></tr>";
      const par = "<tr><td class=\"lab\">Par</td>" + VF.holes.map((hole) => "<td>" + hole.par + "</td>").join("") + "<td>" + VF.course.par + "</td></tr>";
      const yds = "<tr><td class=\"lab\">Yds</td>" + VF.holes.map((hole) => "<td>" + hole.yds + "</td>").join("") + "<td>" + VF.holes.reduce((sum, hole) => sum + hole.yds, 0) + "</td></tr>";
      const score = "<tr><td class=\"lab\">Score</td>" + round.holes.map((hole) => "<td>" + (hole.strokes == null ? "–" : hole.strokes) + "</td>").join("") + "<td>" + round.total + "</td></tr>";
      const putts = "<tr><td class=\"lab\">Putts</td>" + round.holes.map((hole) => "<td>" + (hole.putts == null ? "–" : hole.putts) + "</td>").join("") + "<td>" + round.putts + "</td></tr>";
      table = '<div class="card"><table>' + head + par + yds + score + putts + "</table></div>";
    }
    let games = "";
    if (round.mode === "game" && round.holes) {
      if (round.random) {
        games = '<div class="mt-l"><p class="kicker">Random holes</p>' + round.randomIds.map((id, index) => {
          const spec = contestById(id);
          return '<div class="row"><span class="grow"><b>Hole ' + (index + 1) + " · " + esc(spec.label) + "</b><span>" + esc(holeWinnerText(round, index, spec)) + "</span></span></div>";
        }).join("") + "</div>";
      } else {
        games = '<div class="mt-l"><p class="kicker">Game</p>' + round.contests.map((id) => {
          const spec = contestById(id);
          return '<div class="row"><span class="grow"><b>' + esc(spec.label) + "</b><span>" + esc(leaderLines(round, spec)) + "</span></span></div>";
        }).join("") + "</div>";
      }
    }
    const care = round.care || {};
    const careRow = ["marks", "rake", "through"].map((key) => {
      const labels = { marks: "Fixed a ball mark", rake: "Raked a bunker", through: "Let a group through" };
      return '<button type="button" class="pick' + (care[key] ? " on" : "") + '" data-act="care" data-key="' + key + '"><span class="box"></span><span>' + labels[key] + "</span></button>";
    }).join("");
    return '<a class="tiny" href="#/play">Back to play</a><p class="kicker mt-s">' + esc(round.date) + "</p><h1>" + round.total + "</h1>" +
      '<p class="muted">' + rel(round.toPar) + " · " + round.putts + " putts · " + esc(VF.course.name) + "</p>" +
      table + games +
      '<div class="mt-l"><p class="kicker">Course care</p>' + careRow + "</div>";
  }

  function viewChallenge() {
    const daily = dailyDrill();
    const made = makesOf(daily.id);
    const logged = prog(daily.id).marks.length;
    const sections = VF.sections.map((section) => {
      const count = VF.drills.filter((drill) => drill.section === section.id).length + state.custom.filter((drill) => drill.section === section.id).length;
      return '<a class="row" href="#/challenge/section?id=' + section.id + '"><span class="grow"><b>' + esc(section.name) + "</b><span>" + esc(section.blurb) + " · " + count + "</span></span><span class=\"chev\">›</span></a>";
    }).join("");
    const boards = Object.keys(VF.boards).map((id) => '<a class="row" href="#/challenge/board?id=' + id + '"><span class="grow"><b>' + esc(VF.boards[id].title) + "</b></span><span class=\"chev\">›</span></a>").join("");
    return '<p class="kicker">Challenges</p><h1>Show your work.</h1>' +
      '<a class="panel" href="#/challenge/run?id=' + daily.id + '"><p class="kicker fire">Daily</p><h2>' + esc(daily.name) + "</h2><p class=\"mt-s\">" + esc(daily.detail) + "</p><p class=\"tiny mt-s\">" + made + " made · " + logged + " of " + daily.tries + " tried</p></a>" +
      '<div class="mt-l"><p class="kicker">By skill</p>' + sections + "</div>" +
      '<a class="btn" href="#/challenge/custom">Make a custom challenge</a>' +
      '<div class="mt-l"><p class="kicker">Boards</p>' + boards + "</div>";
  }

  function viewSection() {
    const section = VF.sections.find((item) => item.id === parse().q.id) || VF.sections[0];
    const drills = VF.drills.filter((drill) => drill.section === section.id).concat(state.custom.filter((drill) => drill.section === section.id));
    const rows = drills.map((drill) => {
      const made = makesOf(drill.id);
      return '<a class="row" href="#/challenge/run?id=' + encodeURIComponent(drill.id) + '"><span class="grow"><b>' + esc(drill.name) + "</b><span>" + esc(drill.detail) + " · best run " + made + " / " + prog(drill.id).marks.length + "</span></span><span class=\"chev\">›</span></a>";
    }).join("");
    return '<a class="tiny" href="#/challenge">All challenges</a><h1 class="mt-s">' + esc(section.name) + "</h1><p class=\"muted mt-s\">" + esc(section.blurb) + "</p>" + rows;
  }

  function viewRun() {
    const drill = drillById(parse().q.id) || dailyDrill();
    const record = prog(drill.id);
    const made = record.marks.filter(Boolean).length;
    const full = record.marks.length >= drill.tries;
    const clear = made >= drill.need && full;
    const dots = Array.from({ length: drill.tries }, (_, index) => {
      const mark = record.marks[index];
      const cls = mark == null ? "" : mark ? "make" : "miss";
      return '<i class="' + cls + '"></i>';
    }).join("");
    const daily = dailyDrill();
    const board = drill.id === "putt-3"
      ? '<div class="mt-l"><p class="kicker">3-foot board</p>' + puttRows(drill).map((row, index) => '<div class="row"><span class="grow"><b>' + (index + 1) + "  " + esc(row[0]) + "</b></span><span>" + esc(row[1]) + "</span></div>").join("") + "</div>"
      : "";
    return '<a class="tiny" href="#/challenge/section?id=' + drill.section + '">Back</a><p class="kicker mt-s">' + esc(drill.section) + "</p><h1>" + esc(drill.name) + "</h1>" +
      '<p class="muted mt-s">' + esc(drill.detail) + "</p>" +
      '<div class="statline"><div><b>' + made + '</b><span>Made</span></div><div><b>' + record.marks.length + "/" + drill.tries + '</b><span>Tried</span></div><div><b>' + drill.need + "</b><span>To clear</span></div></div>" +
      '<div class="dots mt">' + dots + "</div>" +
      (full
        ? '<p class="mt">' + (clear ? "Cleared." : "Not this run. Reset and go again.") + "</p>" +
          (clear && daily.id === drill.id ? '<button class="btn" type="button" data-act="post" data-id="' + drill.id + '">' + (record.posted != null ? "Posted " + record.posted : "Post to the board") + "</button>" : "") +
          '<button class="btn ghost" type="button" data-act="reset-drill" data-id="' + drill.id + '">Reset this run</button>'
        : '<div class="split"><button class="btn ghost" type="button" data-act="mark" data-id="' + drill.id + '" data-made="0">Miss</button><button class="btn" type="button" data-act="mark" data-id="' + drill.id + '" data-made="1">Make</button></div>') +
      board;
  }

  function puttRows(drill) {
    const rows = VF.puttBoard.map((row) => row.slice());
    const record = prog(drill.id);
    if (record.posted != null) rows.unshift([VF.player.name, record.posted + " / " + drill.tries]);
    else rows.push([VF.player.name + " (you)", makesOf(drill.id) + " so far"]);
    return rows;
  }

  function viewCustom() {
    const options = VF.sections.map((section) => '<option value="' + section.id + '">' + esc(section.name) + "</option>").join("");
    return '<a class="tiny" href="#/challenge">Back</a><h1 class="mt-s">Custom challenge</h1>' +
      '<p class="muted mt-s">A count you can run in the yard. Makes and misses only.</p>' +
      '<form data-act="save-custom"><label class="field"><span>Name</span><input name="name" maxlength="48" required placeholder="Backyard 6-footers"></label>' +
      '<label class="field"><span>Section</span><select name="section">' + options + "</select></label>" +
      '<label class="field"><span>How many tries</span><input name="tries" type="number" min="1" max="20" value="5" required></label>' +
      '<label class="field"><span>Makes to clear it</span><input name="need" type="number" min="1" max="20" value="3" required></label>' +
      '<label class="field"><span>What good looks like</span><textarea name="detail" maxlength="160" placeholder="Putt from a club-length away."></textarea></label>' +
      '<button class="btn" type="submit">Save challenge</button></form>';
  }

  function viewBoard() {
    const id = parse().q.id in VF.boards ? parse().q.id : "rounds";
    const board = VF.boards[id];
    const rows = boardRows(id).map((row, index) => '<div class="row"><span class="grow"><b>' + (index + 1) + "  " + esc(row[0]) + "</b></span><span>" + esc(row[1]) + "</span></div>").join("");
    return '<a class="tiny" href="#/challenge">Back</a><h1 class="mt-s">' + esc(board.title) + "</h1>" + rows;
  }

  function boardRows(id) {
    const rows = VF.boards[id].rows.map((row) => row.slice());
    if (id === "score") {
      rows.push([VF.player.name, String(Math.min.apply(null, state.rounds.map((round) => round.total)))]);
      rows.sort((a, b) => Number(a[1]) - Number(b[1]));
    } else if (id === "practice") {
      rows.push([VF.player.name, String(state.practiceDays)]);
      rows.sort((a, b) => Number(b[1]) - Number(a[1]));
    } else if (id === "rounds") {
      rows.push([VF.player.name, String(state.rounds.length)]);
      rows.sort((a, b) => Number(b[1]) - Number(a[1]));
    }
    return rows.slice(0, 6);
  }

  function viewLab() {
    const rows = VF.stations.map((station) => {
      const done = state.lab[station.id] && state.lab[station.id].done;
      return '<a class="row" href="#/lab/station?id=' + station.id + '"><span class="grow"><b>' + esc(station.name) + "</b><span>" + (done ? "Clear" : esc(station.summary)) + "</span></span><span class=\"chev\">›</span></a>";
    }).join("");
    return '<p class="kicker">Learning lab</p><h1>Skill stations</h1><p class="muted mt-s">A short read, then a check. No video account required.</p>' +
      rows +
      '<a class="btn" href="#/swing">Swing lab fitting</a>' +
      '<div class="panel"><p class="kicker">Practice block</p><h2>10, 20, or 40 minutes</h2><p class="mt-s">Warm up, one game from Challenges, then one last putt. Stop when the time ends.</p>' +
      '<div class="split"><button class="btn" type="button" data-act="timer" data-min="10">10</button><button class="btn" type="button" data-act="timer" data-min="20">20</button><button class="btn" type="button" data-act="timer" data-min="40">40</button></div>' +
      (ui.timer ? '<p class="mt" id="timer">' + ui.timer + "</p>" : "") +
      "</div>";
  }

  function viewStation() {
    const station = VF.stations.find((item) => item.id === parse().q.id) || VF.stations[0];
    const saved = state.lab[station.id] || { picks: {}, done: false };
    const steps = station.steps.map((step) => '<div class="note"><b>' + esc(step[0]) + '</b><p class="tiny">' + esc(step[1]) + "</p></div>").join("");
    const quiz = station.quiz.map((item, qIndex) => {
      const options = item.options.map((option, oIndex) => {
        const picked = saved.picks[qIndex] === oIndex;
        const cls = picked ? (oIndex === item.a ? "quiz good" : "quiz bad") : "quiz";
        return '<button type="button" class="' + cls + '" data-act="quiz" data-station="' + station.id + '" data-q="' + qIndex + '" data-o="' + oIndex + '">' + esc(option) + "</button>";
      }).join("");
      return '<p class="mt"><b>' + esc(item.q) + "</b></p>" + options;
    }).join("");
    return '<a class="tiny" href="#/lab">All stations</a><h1 class="mt-s">' + esc(station.name) + "</h1><p class=\"muted mt-s\">" + esc(station.summary) + "</p>" +
      steps + '<p class="kicker mt">Quick check</p>' + quiz +
      (saved.done ? '<p class="mt fire">Station clear.</p>' : "");
  }

  function viewSwing() {
    const fit = VF.fittings[state.fitting] || VF.fittings.rec;
    const specs = fit.specs.map((spec) => '<div class="spec"><span>' + esc(spec[0]) + "</span><b>" + esc(spec[1]) + "</b></div>").join("");
    const alts = fit.alts.map((alt) => "<p class=\"mt-s\">" + esc(alt) + "</p>").join("");
    return '<a class="tiny" href="#/lab">Lab</a><p class="kicker mt-s">Swing lab</p><h1>Get the right equipment</h1>' +
      '<div class="seg mt"><button type="button" data-act="fitting" data-id="rec" class="' + (state.fitting === "rec" ? "on" : "") + '">Rec</button><button type="button" data-act="fitting" data-id="comp" class="' + (state.fitting === "comp" ? "on" : "") + '">Competitive</button></div>' +
      '<p class="mt">' + esc(fit.note) + "</p>" +
      '<div class="panel"><p class="kicker">Recommended driver</p><h2>' + esc(fit.driver) + '</h2><div class="specs">' + specs + "</div><p class=\"tiny mt\">" + esc(fit.why) + "</p></div>" +
      '<div class="mt-l"><p class="kicker">Also reasonable</p>' + alts + "</div>";
  }

  function viewFriends() {
    const rows = VF.friends.map((name) => {
      const on = state.setup.friends.indexOf(name) !== -1;
      return '<button type="button" class="pick' + (on ? " on" : "") + '" data-act="setup-friend" data-name="' + esc(name) + '"><span class="box"></span><span class="grow"><b>' + esc(name) + "</b></span></button>";
    }).join("");
    const feed = VF.feed.map((item) => '<div class="note"><b>' + esc(item.name) + '</b><p>' + esc(item.text) + '</p><p class="tiny">' + esc(item.meta) + "</p></div>").join("");
    return '<p class="kicker">Squad</p><h1>Friends</h1><p class="muted mt-s">Select who is in the next game. This stays on the phone.</p>' +
      rows + '<a class="btn" href="#/play/setup">Set up the game</a><div class="mt-l"><p class="kicker">Lately</p>' + feed + "</div>";
  }

  function viewCoach() {
    const notes = state.notes.slice(0, 4).map((note) => '<div class="note"><b>' + esc(note.coach || "Coach") + '</b><p>' + esc(note.text) + '</p><p class="tiny mt-s">' + esc(note.reply) + "</p></div>").join("");
    return '<p class="kicker">Coach</p><h1>Ask something small.</h1><p class="muted mt-s">Type it. A sample reply comes back so the screen has a loop. A real coach can replace it later.</p>' +
      '<form data-act="save-note"><label class="field"><span>Coach name</span><input name="coach" maxlength="40" placeholder="Optional"></label>' +
      '<label class="field"><span>Note</span><textarea name="text" required placeholder="My chips are going long."></textarea></label>' +
      '<button class="btn" type="submit">Send</button></form>' + notes;
  }

  function viewMe() {
    const fit = VF.fittings[state.fitting];
    const voices = VF.voices.map((voice) => '<button type="button" class="pick' + (state.voice === voice.id ? " on" : "") + '" data-act="voice" data-id="' + voice.id + '"><span class="box"></span><span class="grow"><b>' + esc(voice.name) + "</b><span class=\"tiny\">" + esc(voice.note) + "</span></span></button>").join("");
    return '<p class="kicker">Player</p><h1>' + esc(VF.player.name) + " · " + VF.player.age + "</h1>" +
      '<p class="muted mt-s">' + esc(VF.player.hand) + " · " + esc(VF.player.height) + " · " + esc(VF.player.level) + " · " + esc(VF.player.home) + "</p>" +
      '<div class="statline"><div><b class="word">' + esc(state.feel) + '</b><span>Feel</span></div><div><b>' + VF.player.best + '</b><span>Best 9</span></div><div><b>' + state.rounds[0].total + "</b><span>Last</span></div></div>" +
      '<a class="row mt" href="#/play/card"><span class="grow"><b>Scorecard</b><span>' + esc(VF.course.name) + "</span></span><span class=\"chev\">›</span></a>" +
      '<a class="row" href="#/swing"><span class="grow"><b>Driver setup</b><span>' + esc(fit.driver) + "</span></span><span class=\"chev\">›</span></a>" +
      '<a class="row" href="#/friends"><span class="grow"><b>Friends</b><span>Invite the group into a game</span></span><span class="chev">›</span></a>"' +
      '<a class="row" href="#/coach"><span class="grow"><b>Ask my coach</b><span>Leave a note</span></span><span class="chev">›</span></a>' +
      '<a class="row" href="#/course"><span class="grow"><b>Course</b><span>' + esc(VF.course.name) + "</span></span><span class=\"chev\">›</span></a>" +
      '<div class="mt-l"><p class="kicker">Coach voice</p><p class="tiny">Tap a name, then hear a sample. The choice is remembered.</p>' + voices +
      '<button class="btn ghost" type="button" data-act="hear">Hear ' + esc(VF.voices.find((voice) => voice.id === state.voice).name) + "</button>" +
      (ui.caption ? '<p class="tiny mt-s">' + esc(ui.caption) + "</p>" : "") +
      "</div>" +
      '<button class="btn ghost" type="button" data-act="share">Share the link</button>' +
      '<button class="btn ghost" type="button" data-act="show-install">Add to Home Screen</button>';
  }

  const views = {
    "/home": viewHome,
    "/play": viewPlay,
    "/play/setup": viewSetup,
    "/play/hole": viewHole,
    "/play/card": viewCard,
    "/course": viewCourse,
    "/challenge": viewChallenge,
    "/challenge/section": viewSection,
    "/challenge/run": viewRun,
    "/challenge/custom": viewCustom,
    "/challenge/board": viewBoard,
    "/lab": viewLab,
    "/lab/station": viewStation,
    "/swing": viewSwing,
    "/friends": viewFriends,
    "/coach": viewCoach,
    "/me": viewMe,
  };

  function createRound(mode) {
    const random = mode === "game" && !!state.setup.random;
    const deck = shuffle(VF.contests.map((contest) => contest.id).concat(VF.contests.map((contest) => contest.id)), Date.now());
    state.round = {
      id: "live",
      mode,
      friends: mode === "game" ? state.setup.friends.slice() : [],
      random,
      contests: mode === "game" && !random ? state.setup.contests.slice() : [],
      randomIds: deck.slice(0, 9),
      hole: 0,
      holes: VF.holes.map((hole) => ({ strokes: null, putts: null, plan: null, yards: hole.approach, values: {} })),
    };
    save();
  }

  function finishRound() {
    const round = state.round;
    if (!round) return;
    const sum = summarize(round);
    if (!sum.played) {
      toast("Add a score on at least one hole.");
      return;
    }
    const saved = {
      id: String(Date.now()),
      date: today(),
      total: sum.total,
      putts: sum.putts,
      toPar: sum.toPar,
      played: sum.played,
      mode: round.mode,
      friends: round.friends,
      random: round.random,
      contests: round.contests,
      randomIds: round.randomIds,
      holes: round.holes,
      care: {},
    };
    state.rounds.unshift(saved);
    state.round = null;
    state.week[weekdayIndex()] = true;
    save();
    location.hash = "#/play/card?id=" + saved.id;
  }

  function ensureValue(hole, name) {
    if (!hole.values[name]) hole.values[name] = {};
    return hole.values[name];
  }

  function coachReply(text) {
    const line = text.toLowerCase();
    if (line.indexOf("putt") !== -1) return "Quiet hands from 3 feet. Clear the tester and send me the number.";
    if (line.indexOf("drive") !== -1 || line.indexOf("driver") !== -1) return "Pick a fairway window and one miss that still leaves a shot.";
    if (line.indexOf("chip") !== -1 || line.indexOf("sand") !== -1 || line.indexOf("bunker") !== -1) return "Land it on a spot. In the sand, hit the sand first and finish standing.";
    if (line.indexOf("rule") !== -1 || line.indexOf("drop") !== -1 || line.indexOf("water") !== -1) return "Add one, drop from knee height, and say provisional if it might be lost.";
    return "Pick one feel for the next session: smooth. Stop while you still have a good one left.";
  }

  const actions = {
    noop() {},
    feel(el) {
      state.feel = el.dataset.val;
      save();
      ui.keepScroll = true;
      render();
    },
    "show-rules"() {
      ui.sheet = "rules";
      ui.rule = null;
      ui.keepScroll = true;
      render();
    },
    "show-install"() {
      ui.sheet = "install";
      render();
    },
    "close-sheet"(el) {
      if (el.dataset.act !== "close-sheet") return;
      ui.sheet = null;
      ui.rule = null;
      ui.keepScroll = true;
      render();
    },
    "open-rule"(el) {
      ui.rule = el.dataset.id;
      ui.sheet = "rules";
      ui.keepScroll = true;
      render();
    },
    penalty() {
      if (!state.round) return;
      const hole = state.round.holes[state.round.hole];
      hole.strokes = (hole.strokes == null ? 0 : hole.strokes) + 1;
      save();
      ui.sheet = null;
      toast("Added 1 to the hole score.");
    },
    "start-solo"() {
      createRound("solo");
      location.hash = "#/play/hole";
    },
    "start-game"() {
      if (!state.setup.friends.length) {
        toast("Pick at least one friend.");
        return;
      }
      if (!state.setup.random && !state.setup.contests.length) {
        toast("Pick a stat, or use a random challenge.");
        return;
      }
      createRound("game");
      location.hash = "#/play/hole";
    },
    "setup-friend"(el) {
      const name = el.dataset.name;
      const index = state.setup.friends.indexOf(name);
      if (index === -1) state.setup.friends.push(name);
      else state.setup.friends.splice(index, 1);
      save();
      ui.keepScroll = true;
      render();
    },
    "setup-contest"(el) {
      const id = el.dataset.id;
      const index = state.setup.contests.indexOf(id);
      if (index === -1) state.setup.contests.push(id);
      else state.setup.contests.splice(index, 1);
      save();
      ui.keepScroll = true;
      render();
    },
    "setup-random"() {
      state.setup.random = !state.setup.random;
      save();
      ui.keepScroll = true;
      render();
    },
    step(el) {
      const hole = state.round.holes[state.round.hole];
      const field = el.dataset.field;
      const info = VF.holes[state.round.hole];
      const spec = field === "putts"
        ? { step: 1, min: 0, max: 8, start: 2 }
        : { step: 1, min: 1, max: 15, start: info.par };
      hole[field] = bump(spec, hole[field], Number(el.dataset.dir));
      if (field === "putts") {
        const bag = ensureValue(hole, VF.player.name);
        bag.putts = hole.putts;
      }
      save();
      ui.keepScroll = true;
      render();
    },
    yards(el) {
      const hole = state.round.holes[state.round.hole];
      hole.yards = Math.max(40, Math.min(560, hole.yards + Number(el.dataset.dir)));
      save();
      ui.keepScroll = true;
      render();
    },
    pin(el) {
      const info = VF.holes[state.round.hole];
      const hole = state.round.holes[state.round.hole];
      const map = { front: info.approach - 8, mid: info.approach, back: info.approach + 7 };
      hole.yards = map[el.dataset.val];
      save();
      ui.keepScroll = true;
      render();
    },
    plan(el) {
      const hole = state.round.holes[state.round.hole];
      hole.plan = hole.plan === el.dataset.val ? null : el.dataset.val;
      save();
      ui.keepScroll = true;
      render();
    },
    cstep(el) {
      const hole = state.round.holes[state.round.hole];
      const spec = contestById(el.dataset.id);
      const bag = ensureValue(hole, el.dataset.name);
      bag[spec.id] = bump(spec, bag[spec.id] == null ? null : Number(bag[spec.id]), Number(el.dataset.dir));
      if (spec.id === "putts" && el.dataset.name === VF.player.name) hole.putts = bag.putts;
      save();
      ui.keepScroll = true;
      render();
    },
    cchoice(el) {
      const hole = state.round.holes[state.round.hole];
      const bag = ensureValue(hole, el.dataset.name);
      bag[el.dataset.id] = el.dataset.val;
      save();
      ui.keepScroll = true;
      render();
    },
    "hole-move"(el) {
      if (!state.round) return;
      const next = state.round.hole + Number(el.dataset.dir);
      if (next < 0) return;
      if (next > 8) {
        finishRound();
        return;
      }
      state.round.hole = next;
      save();
      render();
    },
    finish: finishRound,
    mark(el) {
      const drill = drillById(el.dataset.id);
      const record = prog(drill.id);
      if (record.marks.length >= drill.tries) return;
      record.marks.push(el.dataset.made === "1");
      if (record.marks.length === drill.tries && record.marks.filter(Boolean).length >= drill.need) notePractice();
      save();
      ui.keepScroll = true;
      render();
    },
    "reset-drill"(el) {
      prog(el.dataset.id).marks = [];
      save();
      ui.keepScroll = true;
      render();
    },
    post(el) {
      const drill = drillById(el.dataset.id);
      const record = prog(drill.id);
      const made = record.marks.filter(Boolean).length;
      if (record.marks.length < drill.tries || made < drill.need) return;
      record.posted = made;
      save();
      toast("Posted to the board.");
    },
    "save-custom"(form) {
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const tries = Number(data.get("tries"));
      const need = Number(data.get("need"));
      const section = String(data.get("section") || "putting");
      const detail = String(data.get("detail") || "").trim() || "Make the number you set.";
      if (!name || tries < 1 || tries > 20 || need < 1 || need > tries) {
        toast("Check the name, tries, and makes.");
        return;
      }
      const id = "c" + Date.now();
      state.custom.unshift({ id, section, name, detail, tries, need, custom: true });
      save();
      location.hash = "#/challenge/run?id=" + id;
    },
    "save-note"(form) {
      const data = new FormData(form);
      const text = String(data.get("text") || "").trim();
      if (!text) return;
      state.notes.unshift({
        coach: String(data.get("coach") || "").trim(),
        text,
        reply: coachReply(text),
        at: today(),
      });
      save();
      form.reset();
      ui.keepScroll = false;
      render();
    },
    quiz(el) {
      const id = el.dataset.station;
      const station = VF.stations.find((item) => item.id === id);
      const saved = state.lab[id] || { picks: {}, done: false };
      saved.picks[el.dataset.q] = Number(el.dataset.o);
      saved.done = station.quiz.every((item, index) => saved.picks[index] === item.a);
      state.lab[id] = saved;
      if (saved.done) notePractice();
      save();
      ui.keepScroll = true;
      render();
    },
    fitting(el) {
      state.fitting = el.dataset.id;
      save();
      ui.keepScroll = true;
      render();
    },
    voice(el) {
      state.voice = el.dataset.id;
      save();
      ui.keepScroll = true;
      render();
    },
    hear() {
      const voice = VF.voices.find((item) => item.id === state.voice) || VF.voices[0];
      const line = "This is " + voice.name + ". I am your VoltzFire coach.";
      ui.caption = line;
      ui.keepScroll = true;
      render();
      if (!window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.pitch = voice.pitch;
      utterance.rate = voice.rate;
      const voices = window.speechSynthesis.getVoices();
      const english = voices.filter((item) => /^en/i.test(item.lang));
      if (english.length) utterance.voice = english[VF.voices.indexOf(voice) % english.length];
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    share() {
      const payload = { title: "VoltzFire", text: "Rounds, challenges, and a rules helper.", url: location.href };
      const copy = () => navigator.clipboard.writeText(location.href).then(() => toast("Link copied.")).catch(() => toast(location.href));
      if (navigator.share) navigator.share(payload).catch(copy);
      else copy();
    },
    timer(el) {
      const mins = Number(el.dataset.min);
      ui.timerEnd = Date.now() + mins * 60000;
      ui.timer = (mins < 10 ? "0" : "") + mins + ":00";
      notePractice();
      save();
      render();
      clearTimeout(ui.timerHandle);
      ui.timerHandle = setTimeout(tickTimer, 1000);
    },
    care(el) {
      const round = state.rounds.find((item) => item.id === parse().q.id) || state.rounds[0];
      if (!round.care) round.care = {};
      round.care[el.dataset.key] = !round.care[el.dataset.key];
      save();
      ui.keepScroll = true;
      render();
    },
  };

  function tickTimer() {
    if (!ui.timerEnd) return;
    const left = Math.max(0, ui.timerEnd - Date.now());
    const minutes = Math.floor(left / 60000);
    const seconds = Math.floor((left % 60000) / 1000);
    ui.timer = (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    if (left <= 0) {
      ui.timer = "Block done.";
      ui.timerEnd = 0;
      render();
      return;
    }
    const node = document.getElementById("timer");
    if (node) node.textContent = ui.timer;
    clearTimeout(ui.timerHandle);
    ui.timerHandle = setTimeout(tickTimer, 1000);
  }

  function render() {
    const scroller = document.querySelector(".scroll");
    const top = scroller ? scroller.scrollTop : 0;
    const keep = ui.keepScroll;
    const route = parse();
    const draw = views[route.path] || viewHome;
    document.getElementById("screen").innerHTML = shell(draw());
    if (keep) {
      const next = document.querySelector(".scroll");
      if (next) next.scrollTop = top;
    }
    ui.keepScroll = false;
  }

  function onClick(event) {
    const el = event.target.closest("[data-act]");
    if (!el || !actions[el.dataset.act]) return;
    if (el.dataset.act === "close-sheet" && event.target.closest(".sheet-card") && !event.target.closest("button")) return;
    actions[el.dataset.act](el);
  }

  function onSubmit(event) {
    const form = event.target;
    if (!form.dataset || !actions[form.dataset.act]) return;
    event.preventDefault();
    actions[form.dataset.act](form);
  }

  load();
  const screen = document.getElementById("screen");
  screen.addEventListener("click", onClick);
  screen.addEventListener("submit", onSubmit);
  window.addEventListener("hashchange", render);
  if (!location.hash) location.hash = "#/home";
  else render();
})();
