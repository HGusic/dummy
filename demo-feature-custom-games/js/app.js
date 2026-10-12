(function () {
  const CG = window.CG;
  const KEY = "voltzfire.customgames.v1";
  let state;
  let ui = { sheet: null, rule: null, toast: "", keepScroll: false };
  let toastTimer = 0;

  function fresh() {
    return {
      setup: {
        mode: "official",
        gameName: "Fairway points",
        rules: ["fairway", "hazard", "ball", "twoPutt"],
        friends: [],
        ghost: false,
      },
      customPoints: [],
      focus: CG.player,
      round: null,
      rounds: [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const base = fresh();
      if (!raw) {
        state = base;
        return;
      }
      const saved = JSON.parse(raw);
      state = Object.assign(base, saved, {
        setup: Object.assign(base.setup, saved.setup || {}),
        customPoints: saved.customPoints || [],
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
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }

  function parse() {
    const raw = (location.hash || "#/").slice(1) || "/";
    return raw.split("?")[0] || "/";
  }

  function today() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function playersOf(round) {
    return [CG.player].concat(round.friends || []);
  }

  function allPoints() {
    return CG.points.concat(state.customPoints || []);
  }

  function pointById(id, round) {
    const saved = round && round.pointDefs;
    return (saved && saved.find((item) => item.id === id)) || allPoints().find((item) => item.id === id) || { id: id, title: "Point", detail: "" };
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
    }, 2000);
  }

  function syncName() {
    const input = document.querySelector("[name=gameName]");
    if (input) state.setup.gameName = input.value;
  }

  function holeMarks(rules) {
    const marks = {};
    rules.forEach((id) => { marks[id] = false; });
    return marks;
  }

  function createRound() {
    const setup = state.setup;
    const custom = setup.mode === "custom";
    const ghost = !custom && !!setup.ghost;
    const rules = custom ? setup.rules.slice() : [];
    const friends = ghost ? [] : setup.friends.slice();
    const ghostCard = ghost ? bestCard() : null;
    const people = [CG.player].concat(friends);
    state.focus = CG.player;
    state.round = {
      id: "live",
      mode: setup.mode,
      gameName: custom ? (setup.gameName.trim() || "Custom game") : (ghost ? "Ghost round" : "Official"),
      rules: rules,
      ghostScores: ghostCard ? ghostCard.scores : null,
      pointDefs: rules.map((id) => {
        const point = pointById(id);
        return { id: point.id, title: point.title, detail: point.detail };
      }),
      friends: friends,
      hole: 0,
      holes: CG.holes.map(() => {
        const scores = {};
        const putts = {};
        const marks = {};
        people.forEach((name) => {
          scores[name] = null;
          putts[name] = null;
          marks[name] = holeMarks(rules);
        });
        return { scores: scores, putts: putts, marks: marks, shots: {} };
      }),
    };
    save();
  }

  function pointsFor(round, name, hole) {
    const bag = hole.marks[name] || {};
    return round.rules.reduce((sum, id) => sum + (bag[id] ? 1 : 0), 0);
  }

  function totalPoints(round, name) {
    return round.holes.reduce((sum, hole) => sum + pointsFor(round, name, hole), 0);
  }

  function totalStrokes(round, name) {
    let total = 0;
    let played = 0;
    let par = 0;
    round.holes.forEach((hole, index) => {
      const score = hole.scores[name];
      if (score == null) return;
      played += 1;
      total += score;
      par += CG.holes[index].par;
    });
    return { total: total, played: played, toPar: played ? total - par : null };
  }

  function rel(n) {
    if (n == null) return "";
    if (n === 0) return "E";
    return n > 0 ? "+" + n : String(n);
  }

  const CLUBS = ["Driver", "3-wood", "5-iron", "7-iron", "9-iron", "Wedge", "Putter"];
  const RATES = [
    ["straight", "Straight"],
    ["left", "Went left"],
    ["right", "Went right"],
    ["short", "Too short"],
    ["long", "Too long"],
    ["miss", "Missed the ball"],
    ["sand", "In the sand"],
    ["water", "In the water"],
  ];
  const TEE = { x: 100, y: 308 };

  function bestCard() {
    let best = null;
    (state.rounds || []).forEach((round) => {
      if (round.mode !== "official" || !round.holes) return;
      const scores = round.holes.map((hole) => hole.scores && hole.scores[CG.player]);
      if (scores.length !== CG.holes.length || scores.some((score) => score == null)) return;
      const total = scores.reduce((sum, score) => sum + score, 0);
      if (!best || total < best.total) best = { total: total, scores: scores };
    });
    if (best) return best;
    return { total: CG.sampleBest.reduce((sum, score) => sum + score, 0), scores: CG.sampleBest.slice(), sample: true };
  }

  function shapeOf(info) {
    return info.shape || "straight";
  }

  function pinOf(shape) {
    if (shape === "left") return { x: 124, y: 46 };
    if (shape === "right") return { x: 78, y: 46 };
    return { x: 100, y: 44 };
  }

  function fairwayPath(shape) {
    if (shape === "left") return "M100 308 C98 230 48 190 62 120 C72 70 118 62 124 46";
    if (shape === "right") return "M100 308 C102 230 156 190 142 120 C132 70 84 62 78 46";
    return "M100 308 C106 210 94 120 100 44";
  }

  function shotList(hole, name) {
    return (hole.shots && hole.shots[name]) || [];
  }

  function yardsBetween(a, b, holeYards, shape) {
    const pin = pinOf(shape);
    const full = Math.hypot(pin.x - TEE.x, pin.y - TEE.y) || 1;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    return Math.max(1, Math.round(dist / full * holeYards));
  }

  function holeMap(info, shots, pending) {
    const shape = shapeOf(info);
    const pin = pinOf(shape);
    const path = fairwayPath(shape);
    const bunkers = shape === "left"
      ? [[46, 150], [150, 78]]
      : shape === "right"
        ? [[154, 150], [52, 78]]
        : [[48, 120], [152, 120]];
    const sand = bunkers.map((spot) => '<ellipse cx="' + spot[0] + '" cy="' + spot[1] + '" rx="16" ry="10" fill="#f0c14a" stroke="#e0a020" stroke-width="1"/>').join("");
    const water = info.water
      ? '<ellipse cx="' + (shape === "right" ? 40 : 162) + '" cy="200" rx="22" ry="14" fill="#3aa0e8"/>'
      : "";
    const spots = [TEE].concat(shots.map((shot) => ({ x: shot.x, y: shot.y })));
    if (pending) spots.push(pending);
    let lines = "";
    for (let i = 1; i < spots.length; i++) {
      const yards = yardsBetween(spots[i - 1], spots[i], info.yds, shape);
      const mx = (spots[i - 1].x + spots[i].x) / 2;
      const my = (spots[i - 1].y + spots[i].y) / 2;
      lines += '<line x1="' + spots[i - 1].x + '" y1="' + spots[i - 1].y + '" x2="' + spots[i].x + '" y2="' + spots[i].y + '" stroke="#17324a" stroke-width="2" stroke-dasharray="4 3"/>';
      lines += '<text x="' + mx + '" y="' + (my - 6) + '" text-anchor="middle" font-size="11" font-family="Outfit, sans-serif" fill="#17324a" font-weight="700">' + yards + "</text>";
    }
    const dots = shots.map((shot, index) => '<g><circle cx="' + shot.x + '" cy="' + shot.y + '" r="9" fill="#1e6cff"/><text x="' + shot.x + '" y="' + (shot.y + 3) + '" text-anchor="middle" font-size="10" fill="white" font-family="Outfit, sans-serif" font-weight="700">' + (index + 1) + "</text></g>").join("");
    const pendingDot = pending
      ? '<circle cx="' + pending.x + '" cy="' + pending.y + '" r="10" fill="none" stroke="#ff7a14" stroke-width="3"/><circle cx="' + pending.x + '" cy="' + pending.y + '" r="4" fill="#ff7a14"/>'
      : "";
    return '<svg class="holemap" viewBox="0 0 200 340" role="img" aria-label="Map of hole ' + info.n + '">' +
      '<rect width="200" height="340" fill="#8fd0f5"/>' +
      '<ellipse cx="100" cy="180" rx="92" ry="150" fill="#5eaf4e"/>' +
      '<path d="' + path + '" fill="none" stroke="#b6e38d" stroke-width="48" stroke-linecap="round"/>' +
      '<path d="' + path + '" fill="none" stroke="#3d9a45" stroke-width="26" stroke-linecap="round"/>' +
      water + sand +
      '<circle cx="' + pin.x + '" cy="' + pin.y + '" r="16" fill="#2f8f45" stroke="#d8ffe4" stroke-width="2"/>' +
      '<path d="M' + pin.x + " " + pin.y + " v-16 h10 l-3 4 3 4 h-10" + '" fill="#ff7a14" stroke="#17324a" stroke-width="1"/>' +
      '<rect x="86" y="298" width="28" height="12" rx="2" fill="#f4f6fb" stroke="#17324a"/>' +
      '<text x="100" y="332" text-anchor="middle" font-size="11" fill="#17324a" font-family="Outfit, sans-serif" font-weight="700">Tee</text>' +
      lines + dots + pendingDot +
      "</svg>";
  }

  function clock() {
    return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function shell(band, body, dock, kind) {
    const kid = kind === "kid";
    const ghost = kind === "ghost";
    const html = '<div class="island"></div><header class="band' + (kid ? " kid" : "") + (ghost ? " ghost" : "") + '"><div class="clock">' + esc(clock()) + "</div>" + band + "</header>" +
      '<div class="scroll' + (kid ? " kid" : "") + (ghost ? " ghost" : "") + '">' + body + "</div>" +
      (dock || "") +
      placeOverlay() +
      '<div class="home-ind"></div>' +
      sheetHtml() +
      (ui.toast ? '<div class="toast">' + esc(ui.toast) + "</div>" : "");
    return ghost ? '<div class="ghostplay">' + html + "</div>" : html;
  }

  function placeOverlay() {
    if (!ui.placing || !state.round || state.round.mode !== "official") return "";
    const info = CG.holes[state.round.hole];
    const hole = state.round.holes[state.round.hole];
    const name = state.focus || CG.player;
    return '<div class="placescreen"><div class="placetop"><p>Tap where the ball stopped</p><button type="button" class="btn ghost slim" data-act="cancel-place">Back</button></div><div class="mapwrap full">' + holeMap(info, shotList(hole, name), null) + "</div></div>";
  }

  function sheetHtml() {
    const ghost = state.round && state.round.ghostScores;
    const face = ghost ? " ghostface" : "";
    if (ui.sheet === "shot") return shotSheet(face);
    if (ui.sheet !== "rules") return "";
    const open = ui.rule ? CG.rules.find((rule) => rule.id === ui.rule) : null;
    const list = CG.rules.map((rule) => '<button class="rule' + (ui.rule === rule.id ? " on" : "") + '" type="button" data-act="open-rule" data-id="' + rule.id + '">' + esc(rule.title) + "</button>").join("");
    const detail = open
      ? "<h2>" + esc(open.title) + "</h2><p>" + esc(open.body) + "</p>" +
        (open.penalty && state.round ? '<button class="btn blue" type="button" data-act="penalty">Add 1 penalty stroke</button>' : "")
      : '<p class="tiny">Tap a situation. The card changes only when you add the stroke.</p>';
    return '<div class="sheet" data-act="close-sheet"><div class="sheet-card' + face + '" data-act="noop"><div class="grab"></div><p class="kicker">Official rules</p><h2>Hazards and drops</h2>' + detail + list + '<button class="btn ghost" type="button" data-act="close-sheet">Close</button></div></div>';
  }

  function holeTicks(round) {
    return CG.holes.map((hole, index) => {
      const current = index === round.hole;
      const holeState = round.holes[index];
      const done = round.mode === "custom"
        ? playersOf(round).some((name) => pointsFor(round, name, holeState) > 0)
        : holeState.scores[CG.player] != null;
      return '<button type="button" data-act="jump" data-hole="' + index + '" class="' + (current ? "on" : done ? "done" : "") + '">' + hole.n + "</button>";
    }).join("");
  }

  function viewLobby() {
    const round = state.round;
    const last = state.rounds[0];
    const yards = CG.holes.reduce((sum, hole) => sum + hole.yds, 0);
    const band = '<p class="kicker">Play</p><h1>' + esc(CG.course.name) + '</h1><p class="sub">' + esc(CG.course.place) + " · Par " + CG.course.par + " · " + yards + " yards</p>";
    const body = '<p>One nine. Score it the usual way, or build a points game and play it with friends.</p>' +
      (round ? '<a class="btn" href="#/hole">Resume hole ' + (round.hole + 1) + "</a>" : "") +
      '<a class="btn' + (round ? " ghost" : "") + '" href="#/setup">' + (round ? "New round" : "Start round") + "</a>" +
      (last ? '<a class="btn ghost" href="#/card?id=' + esc(last.id) + '">Last card · ' + esc(last.gameName) + "</a>" : "") +
      '<p class="tiny mt">Official keeps strokes, putts, and the rules helper. Custom replaces that score with the points you check.</p>';
    return shell(band, body);
  }

  function viewSetup() {
    const setup = state.setup;
    const officialOpen = ui.choice === "official";
    const band = '<p class="kicker">Start round</p><h1>How do you score?</h1>';
    const modes = '<button type="button" class="mode official' + (officialOpen ? " on" : "") + '" data-act="mode" data-mode="official"><b>Official golf rules</b><span>Strokes, a hole map, and the rules helper.</span></button>' +
      '<button type="button" class="mode custom' + (ui.choice === "custom" ? " on" : "") + '" data-act="mode" data-mode="custom"><b>Custom game</b><span>Points replace the score. Check what earns a point, then play it with friends.</span></button>';
    const officialNext = officialOpen
      ? '<p class="label mt">How do you want to play?</p>' +
        '<button type="button" class="mode' + (setup.ghost ? "" : " on official") + '" data-act="ghost-pick" data-ghost="0"><b>Just play</b><span>A normal card. Add each shot on the map, or enter the score.</span></button>' +
        '<button type="button" class="mode ghostpick' + (setup.ghost ? " on" : "") + '" data-act="ghost-pick" data-ghost="1"><b>Play the ghost</b><span>Solo. Race your best card and see what you need on every hole.</span></button>'
      : "";
    const custom = ui.choice === "custom"
      ? '<label class="field"><span>Game name</span><input name="gameName" maxlength="40" value="' + esc(setup.gameName) + '"></label>' +
        '<p class="label mt">A point on the hole for</p><div class="checks">' +
        allPoints().map((point) => {
          const on = setup.rules.indexOf(point.id) !== -1;
          const mine = (state.customPoints || []).some((item) => item.id === point.id);
          const remove = mine ? '<button type="button" class="drop" data-act="drop-rule" data-id="' + point.id + '">Remove</button>' : "";
          return '<div class="checkline"><button type="button" class="check' + (on ? " on" : "") + '" data-act="rule" data-id="' + point.id + '"><i></i><span><b>' + esc(point.title) + "</b><span>" + esc(point.detail) + "</span></span></button>" + remove + "</div>";
        }).join("") + "</div>" +
        '<form class="add-rule" data-act="add-rule"><label class="field"><span>Your rule</span><input name="title" maxlength="40" placeholder="Closest to the pin" required></label><label class="field"><span>When it scores</span><input name="detail" maxlength="140" placeholder="One point if you are closest."></label><button class="btn ghost" type="submit">Add rule</button></form>'
      : officialNext;
    const friends = officialOpen && setup.ghost
      ? '<p class="tiny mt">Ghost rounds are just you. Friends wait for the next game.</p>'
      : (ui.choice ? '<p class="label mt">Friends on this card</p><div class="friends">' + CG.friends.map((name) => {
      const on = setup.friends.indexOf(name) !== -1;
      return '<button type="button" class="friend' + (on ? " on" : "") + '" data-act="friend" data-name="' + esc(name) + '">' + esc(name) + "</button>";
    }).join("") + "</div>" : "");
    const dock = '<div class="dock"><a class="btn ghost slim" href="#/">Back</a><button class="btn" type="button" data-act="start">Tee off</button></div>';
    return shell(band, modes + custom + friends, dock);
  }

  function viewHole() {
    const round = state.round;
    if (!round) return viewLobby();
    const info = CG.holes[round.hole];
    const hole = round.holes[round.hole];
    const kind = round.mode === "custom" ? "" : (round.ghostScores ? "ghost" : "kid");
    const band = (round.ghostScores
      ? '<p class="kicker">Race your ghost</p><div class="titleline"><h1>Hole ' + info.n + "</h1>" + raceRow(round) + '</div><p class="sub">Par ' + info.par + " · " + info.yds + " yards</p>"
      : '<p class="kicker">' + esc(round.gameName) + " · Hole " + info.n + " of 9</p><h1>Par " + info.par + '</h1><p class="sub">' + info.yds + " yards</p>") +
      '<div class="holes">' + holeTicks(round) + "</div>";
    const leaders = round.ghostScores ? "" : '<div class="lead">' + playersOf(round).map((name) => {
      const value = round.mode === "custom" ? totalPoints(round, name) : totalStrokes(round, name);
      const shown = round.mode === "custom" ? value + " pts" : (value.played ? value.total : "–");
      return "<span>" + esc(name.split(" ")[0]) + "<b>" + shown + "</b></span>";
    }).join("") + "</div>";
    const body = leaders + (round.mode === "custom" ? '<p class="call">' + esc(info.call) + "</p>" + customHole(round, hole, info) : officialHole(round, hole, info));
    const dock = '<div class="dock' + (kind === "ghost" ? " ghost" : "") + '"><button class="btn ghost slim" type="button" data-act="move" data-dir="-1"' + (round.hole === 0 ? " disabled" : "") + '>Prev</button><button class="btn" type="button" data-act="move" data-dir="1">' + (round.hole === 8 ? "Finish" : "Next") + "</button></div>";
    return shell(band, body, dock, kind);
  }

  function officialHole(round, hole, info) {
    const people = playersOf(round);
    const focus = people.indexOf(state.focus) === -1 ? CG.player : state.focus;
    state.focus = focus;
    const shots = shotList(hole, focus);
    const score = hole.scores[focus];
    const tabs = people.length > 1
      ? '<div class="focus">' + people.map((name) => '<button type="button" class="' + (name === focus ? "on" : "") + '" data-act="focus" data-name="' + esc(name) + '">' + esc(name.split(" ")[0]) + "</button>").join("") + "</div>"
      : "";
    const log = shots.length
      ? '<ol class="shotlog">' + shots.map((shot, index) => {
        const rate = (RATES.find((item) => item[0] === shot.rate) || ["", shot.rate])[1];
        return "<li><b>" + (index + 1) + "</b> " + esc(shot.club) + " · " + esc(rate) + "</li>";
      }).join("") + '<button type="button" class="textbtn" data-act="undo-shot">Undo last shot</button></ol>'
      : "";
    return tabs +
      '<div class="mapwrap">' + holeMap(info, shots, ui.pending) + "</div>" +
      '<p class="call">' + esc(info.call) + "</p>" +
      log +
      '<button class="btn shotbtn" type="button" data-act="begin-shot">Add a shot</button>' +
      '<p class="label mt">Or just enter the score</p><div class="stepper"><button type="button" data-act="step" data-field="scores" data-dir="-1">−</button><div class="num blue">' + (score == null ? "–" : score) + '</div><button type="button" data-act="step" data-field="scores" data-dir="1">+</button></div>' +
      '<button class="btn" type="button" data-act="show-rules">Rules helper</button>' +
      '<button class="btn ghost" type="button" data-act="end">End round</button>';
  }

  function raceRow(round) {
    const ghostScore = round.ghostScores[round.hole];
    const mine = round.holes[round.hole].scores[CG.player];
    const ghost = '<svg class="raceicon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5c-4.2 0-7.2 3.2-7.2 7.4V21l2.3-1.7 2.4 1.7 2.5-1.8 2.5 1.8 2.4-1.7L19.2 21V9.9C19.2 5.7 16.2 2.5 12 2.5zm-2.3 8.6a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7zm4.6 0a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7z"/></svg>';
    const guy = '<svg class="raceicon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.5" r="3.1" fill="currentColor"/><path fill="currentColor" d="M6.2 19.8c.7-3.4 3-5.3 5.8-5.3s5.1 1.9 5.8 5.3"/></svg>';
    return '<div class="racerow"><span class="race">' + ghost + "<b>" + ghostScore + '</b></span><span class="race you">' + guy + "<b>" + (mine == null ? "–" : mine) + "</b></span></div>";
  }

  function shotSheet(face) {
    const clubs = CLUBS.map((club) => '<button type="button" class="chip' + (ui.club === club ? " on" : "") + '" data-act="pick-club" data-club="' + esc(club) + '">' + esc(club) + "</button>").join("");
    const rates = RATES.map((rate) => '<button type="button" class="chip' + (ui.rate === rate[0] ? " on" : "") + '" data-act="pick-rate" data-rate="' + rate[0] + '">' + esc(rate[1]) + "</button>").join("");
    return '<div class="sheet" data-act="close-sheet"><div class="sheet-card kidcard' + (face || "") + '" data-act="noop"><div class="grab"></div><h2>How did that shot go?</h2><p class="label mt">Club</p><div class="chips">' + clubs + '</div><p class="label mt">What happened</p><div class="chips">' + rates + '</div><button class="btn shotbtn" type="button" data-act="save-shot">Save shot</button><button class="btn ghost" type="button" data-act="close-sheet">Cancel</button></div></div>';
  }

  function stampLabel(point, info) {
    if (!point) return "Point";
    if (point.id === "fairway" && info.par === 3) return "Green found";
    return point.title;
  }

  function customHole(round, hole, info) {
    const blocks = playersOf(round).map((name) => {
      const pts = pointsFor(round, name, hole);
      const stamps = round.rules.map((id) => {
        const point = pointById(id, round);
        const on = hole.marks[name][id];
        return '<button type="button" class="stamp' + (on ? " on" : "") + '" data-act="stamp" data-name="' + esc(name) + '" data-id="' + id + '"><b>' + esc(stampLabel(point, info)) + "</b>1 pt</button>";
      }).join("");
      return '<div class="player"><div class="top"><b>' + esc(name) + '</b><span class="pts">' + pts + "</span></div><div class=\"stamps\">" + stamps + "</div></div>";
    }).join("");
    return '<p class="tiny mt">Tap a stamp when it is true. That point replaces a stroke on this hole.</p>' + blocks +
      '<button class="btn ghost" type="button" data-act="end">End round</button>';
  }

  function viewCard() {
    const id = (location.hash.split("id=")[1] || "").split("&")[0];
    const round = state.rounds.find((item) => item.id === id) || state.rounds[0];
    if (!round) return viewLobby();
    const people = playersOf(round);
    const band = '<p class="kicker">' + esc(round.date) + "</p><h1>" + esc(round.gameName) + "</h1>";
    let standings = "";
    if (round.mode === "custom") {
      const rows = people.map((name) => ({ name: name, score: totalPoints(round, name) })).sort((a, b) => b.score - a.score);
      const best = rows[0].score;
      const winners = rows.filter((row) => row.score === best).map((row) => row.name);
      standings = '<p class="pts">' + rows[0].score + '</p><p>pts · ' + esc(winners.join(" & ")) + "</p>" +
        rows.map((row) => '<div class="player"><div class="top"><b>' + esc(row.name) + '</b><span class="pts">' + row.score + "</span></div></div>").join("");
      const head = "<tr><th></th>" + CG.holes.map((hole) => "<th>" + hole.n + "</th>").join("") + "</tr>";
      const body = people.map((name) => "<tr><td class=\"lab\">" + esc(name.split(" ")[0]) + "</td>" + round.holes.map((hole) => "<td>" + pointsFor(round, name, hole) + "</td>").join("") + "</tr>").join("");
      standings += '<div class="card"><table>' + head + body + "</table></div>";
    } else {
      const rows = people.map((name) => Object.assign({ name: name }, totalStrokes(round, name))).filter((row) => row.played);
      rows.sort((a, b) => a.total - b.total);
      const top = rows[0];
      standings = top
        ? '<p class="num blue">' + top.total + '</p><p>' + rel(top.toPar) + " · " + esc(top.name) + "</p>"
        : "<p>No scores saved.</p>";
      if (rows.length) {
        standings += rows.map((row) => '<div class="player"><div class="top"><b>' + esc(row.name) + "</b><span>" + row.total + " " + rel(row.toPar) + "</span></div></div>").join("");
      }
      if (round.ghostScores) {
        const ghostTotal = round.ghostScores.reduce((sum, score) => sum + score, 0);
        const mine = top ? top.total : null;
        const note = mine == null ? "Ghost shot " + ghostTotal + "." : mine < ghostTotal ? "You beat the ghost by " + (ghostTotal - mine) + "." : mine === ghostTotal ? "You tied the ghost." : "The ghost still leads by " + (mine - ghostTotal) + ".";
        standings += '<p class="tiny mt">' + note + "</p>";
      }
    }
    return shell(band, standings + '<a class="btn" href="#/">Back to play</a>', "", round.ghostScores ? "ghost" : "");
  }

  function anyScore(round) {
    return round.holes.some((hole) => playersOf(round).some((name) => {
      if (round.mode === "custom") return pointsFor(round, name, hole) > 0;
      return hole.scores[name] != null;
    }));
  }

  function finish() {
    const round = state.round;
    if (!round) return;
    if (!anyScore(round)) {
      toast("Mark a hole before you finish.");
      return;
    }
    const saved = Object.assign({}, round, { id: String(Date.now()), date: today() });
    delete saved.hole;
    state.rounds.unshift(saved);
    state.round = null;
    save();
    location.hash = "#/card?id=" + saved.id;
  }

  const actions = {
    noop() {},
    mode(el) {
      syncName();
      state.setup.mode = el.dataset.mode;
      if (el.dataset.mode !== "official" || ui.choice !== "official") state.setup.ghost = false;
      ui.choice = el.dataset.mode;
      save();
      ui.keepScroll = true;
      render();
    },
    "ghost-pick"(el) {
      state.setup.mode = "official";
      ui.choice = "official";
      state.setup.ghost = el.dataset.ghost === "1";
      save();
      ui.keepScroll = true;
      render();
    },
    "begin-shot"() {
      ui.placing = true;
      ui.pending = null;
      ui.sheet = null;
      render();
    },
    "cancel-place"() {
      ui.placing = false;
      ui.pending = null;
      render();
    },
    "pick-club"(el) {
      ui.club = el.dataset.club;
      ui.keepScroll = true;
      render();
    },
    "pick-rate"(el) {
      ui.rate = el.dataset.rate;
      ui.keepScroll = true;
      render();
    },
    "save-shot"() {
      if (!ui.pending) {
        toast("Tap the map first.");
        return;
      }
      if (!ui.club || !ui.rate) {
        toast("Pick a club and what happened.");
        return;
      }
      const round = state.round;
      const hole = round.holes[round.hole];
      const name = state.focus || CG.player;
      if (!hole.shots) hole.shots = {};
      if (!hole.shots[name]) hole.shots[name] = [];
      hole.shots[name].push({ club: ui.club, rate: ui.rate, x: ui.pending.x, y: ui.pending.y });
      const count = hole.shots[name].length;
      if (hole.scores[name] == null || hole.scores[name] < count) hole.scores[name] = count;
      hole.putts[name] = hole.shots[name].filter((shot) => shot.club === "Putter").length;
      ui.pending = null;
      ui.rate = null;
      ui.sheet = null;
      ui.placing = false;
      save();
      render();
    },
    "undo-shot"() {
      const hole = state.round.holes[state.round.hole];
      const name = state.focus || CG.player;
      const shots = shotList(hole, name);
      if (!shots.length) return;
      shots.pop();
      hole.scores[name] = shots.length || null;
      hole.putts[name] = shots.filter((shot) => shot.club === "Putter").length || null;
      save();
      ui.keepScroll = true;
      render();
    },
    rule(el) {
      syncName();
      const id = el.dataset.id;
      const index = state.setup.rules.indexOf(id);
      if (index === -1) state.setup.rules.push(id);
      else state.setup.rules.splice(index, 1);
      save();
      ui.keepScroll = true;
      render();
    },
    friend(el) {
      syncName();
      const name = el.dataset.name;
      const index = state.setup.friends.indexOf(name);
      if (index === -1) state.setup.friends.push(name);
      else state.setup.friends.splice(index, 1);
      save();
      ui.keepScroll = true;
      render();
    },
    start() {
      syncName();
      if (!ui.choice) {
        toast("Pick official rules or a custom game.");
        return;
      }
      if (state.setup.mode === "custom" && !state.setup.rules.length) {
        toast("Check at least one way to earn a point.");
        return;
      }
      createRound();
      location.hash = "#/hole";
    },
    jump(el) {
      if (!state.round) return;
      state.round.hole = Number(el.dataset.hole);
      save();
      render();
    },
    move(el) {
      if (!state.round) return;
      const next = state.round.hole + Number(el.dataset.dir);
      if (next < 0) return;
      if (next > 8) {
        finish();
        return;
      }
      state.round.hole = next;
      save();
      render();
    },
    end: finish,
    focus(el) {
      state.focus = el.dataset.name;
      save();
      ui.keepScroll = true;
      render();
    },
    step(el) {
      const round = state.round;
      const hole = round.holes[round.hole];
      const field = el.dataset.field;
      const name = state.focus;
      const current = hole[field][name];
      const info = CG.holes[round.hole];
      const shotCount = shotList(hole, name).length;
      const spec = field === "putts"
        ? { min: 0, max: 8, start: 2 }
        : { min: Math.max(1, shotCount), max: 15, start: Math.max(info.par, shotCount || info.par) };
      const dir = Number(el.dataset.dir);
      let value = current == null ? spec.start : current + dir;
      value = Math.max(spec.min, Math.min(spec.max, value));
      hole[field][name] = value;
      save();
      ui.keepScroll = true;
      render();
    },
    stamp(el) {
      const hole = state.round.holes[state.round.hole];
      const bag = hole.marks[el.dataset.name];
      bag[el.dataset.id] = !bag[el.dataset.id];
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
    "open-rule"(el) {
      ui.rule = el.dataset.id;
      ui.sheet = "rules";
      ui.keepScroll = true;
      render();
    },
    "close-sheet"() {
      ui.sheet = null;
      ui.rule = null;
      ui.pending = null;
      ui.placing = false;
      ui.keepScroll = true;
      render();
    },
    "add-rule"(form) {
      syncName();
      const data = new FormData(form);
      const title = String(data.get("title") || "").trim();
      const detail = String(data.get("detail") || "").trim() || "One point when this is true.";
      if (!title) {
        toast("Name the rule.");
        return;
      }
      const id = "c" + Date.now();
      state.customPoints.push({ id: id, title: title, detail: detail });
      state.setup.rules.push(id);
      save();
      ui.keepScroll = true;
      render();
    },
    "drop-rule"(el) {
      syncName();
      const id = el.dataset.id;
      state.customPoints = state.customPoints.filter((item) => item.id !== id);
      state.setup.rules = state.setup.rules.filter((item) => item !== id);
      save();
      ui.keepScroll = true;
      render();
    },
    penalty() {
      const hole = state.round.holes[state.round.hole];
      const name = state.focus || CG.player;
      const current = hole.scores[name];
      hole.scores[name] = (current == null ? 0 : current) + 1;
      save();
      ui.sheet = null;
      toast("Added 1 to " + name.split(" ")[0] + ".");
    },
  };

  function render() {
    const scroller = document.querySelector(".scroll");
    const top = scroller ? scroller.scrollTop : 0;
    const keep = ui.keepScroll;
    const path = parse();
    const view = path === "/setup" ? viewSetup : path === "/hole" ? viewHole : path === "/card" ? viewCard : viewLobby;
    document.getElementById("screen").innerHTML = view();
    if (keep) {
      const next = document.querySelector(".scroll");
      if (next) next.scrollTop = top;
    }
    ui.keepScroll = false;
  }

  function onClick(event) {
    if (tapMap(event)) return;
    const el = event.target.closest("[data-act]");
    if (!el || el.tagName === "FORM" || !actions[el.dataset.act]) return;
    if (el.dataset.act === "close-sheet" && event.target.closest(".sheet-card") && !event.target.closest("button")) return;
    actions[el.dataset.act](el);
  }

  function tapMap(event) {
    if (!ui.placing || !state.round || state.round.mode !== "official") return false;
    const map = event.target.closest(".holemap");
    if (!map) return false;
    const rect = map.getBoundingClientRect();
    ui.pending = {
      x: Math.max(8, Math.min(192, Math.round((event.clientX - rect.left) / rect.width * 200))),
      y: Math.max(8, Math.min(332, Math.round((event.clientY - rect.top) / rect.height * 340))),
    };
    ui.placing = false;
    ui.sheet = "shot";
    render();
    return true;
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
  if (!location.hash) location.hash = "#/";
  else render();
})();
