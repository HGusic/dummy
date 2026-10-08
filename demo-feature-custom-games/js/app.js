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
    const rules = custom ? setup.rules.slice() : [];
    const friends = setup.friends.slice();
    const people = [CG.player].concat(friends);
    state.focus = CG.player;
    state.round = {
      id: "live",
      mode: setup.mode,
      gameName: custom ? (setup.gameName.trim() || "Custom game") : "Official",
      rules: rules,
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
        return { scores: scores, putts: putts, marks: marks };
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

  function clock() {
    return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function shell(band, body, dock) {
    return '<div class="island"></div><header class="band"><div class="clock">' + esc(clock()) + "</div>" + band + "</header>" +
      '<div class="scroll">' + body + "</div>" +
      (dock || "") +
      '<div class="home-ind"></div>' +
      sheetHtml() +
      (ui.toast ? '<div class="toast">' + esc(ui.toast) + "</div>" : "");
  }

  function sheetHtml() {
    if (!ui.sheet) return "";
    const open = ui.rule ? CG.rules.find((rule) => rule.id === ui.rule) : null;
    const list = CG.rules.map((rule) => '<button class="rule' + (ui.rule === rule.id ? " on" : "") + '" type="button" data-act="open-rule" data-id="' + rule.id + '">' + esc(rule.title) + "</button>").join("");
    const detail = open
      ? "<h2>" + esc(open.title) + "</h2><p>" + esc(open.body) + "</p>" +
        (open.penalty && state.round ? '<button class="btn blue" type="button" data-act="penalty">Add 1 penalty stroke</button>' : "")
      : '<p class="tiny">Tap a situation. The card changes only when you add the stroke.</p>';
    return '<div class="sheet" data-act="close-sheet"><div class="sheet-card" data-act="noop"><div class="grab"></div><p class="kicker">Official rules</p><h2 style="color:#f7f1ea">Hazards and drops</h2>' + detail + list + '<button class="btn ghost" type="button" data-act="close-sheet">Close</button></div></div>';
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
    const band = '<p class="kicker">Start round</p><h1>How do you score?</h1>';
    const modes = '<button type="button" class="mode official' + (setup.mode === "official" ? " on" : "") + '" data-act="mode" data-mode="official"><b>Official golf rules</b><span>Strokes and putts. The rules helper stays. Low score wins.</span></button>' +
      '<button type="button" class="mode custom' + (setup.mode === "custom" ? " on" : "") + '" data-act="mode" data-mode="custom"><b>Custom game</b><span>Points replace the score. Check what earns a point, then play it with friends.</span></button>';
    const custom = setup.mode === "custom"
      ? '<label class="field"><span>Game name</span><input name="gameName" maxlength="40" value="' + esc(setup.gameName) + '"></label>' +
        '<p class="label mt">A point on the hole for</p><div class="checks">' +
        allPoints().map((point) => {
          const on = setup.rules.indexOf(point.id) !== -1;
          const mine = (state.customPoints || []).some((item) => item.id === point.id);
          const remove = mine ? '<button type="button" class="drop" data-act="drop-rule" data-id="' + point.id + '">Remove</button>' : "";
          return '<div class="checkline"><button type="button" class="check' + (on ? " on" : "") + '" data-act="rule" data-id="' + point.id + '"><i></i><span><b>' + esc(point.title) + "</b><span>" + esc(point.detail) + "</span></span></button>" + remove + "</div>";
        }).join("") + "</div>" +
        '<form class="add-rule" data-act="add-rule"><label class="field"><span>Your rule</span><input name="title" maxlength="40" placeholder="Closest to the pin" required></label><label class="field"><span>When it scores</span><input name="detail" maxlength="140" placeholder="One point if you are closest."></label><button class="btn ghost" type="submit">Add rule</button></form>'
      : '<p class="tiny mt">This round uses a normal card. Hazards, drops, and penalty strokes are in the rules helper.</p>';
    const friends = '<p class="label mt">Friends on this card</p><div class="friends">' + CG.friends.map((name) => {
      const on = setup.friends.indexOf(name) !== -1;
      return '<button type="button" class="friend' + (on ? " on" : "") + '" data-act="friend" data-name="' + esc(name) + '">' + esc(name) + "</button>";
    }).join("") + "</div>";
    const dock = '<div class="dock"><a class="btn ghost slim" href="#/">Back</a><button class="btn" type="button" data-act="start">Tee off</button></div>';
    return shell(band, modes + custom + friends, dock);
  }

  function viewHole() {
    const round = state.round;
    if (!round) return viewLobby();
    const info = CG.holes[round.hole];
    const hole = round.holes[round.hole];
    const band = '<p class="kicker">' + esc(round.gameName) + " · Hole " + info.n + " of 9</p><h1>Par " + info.par + '</h1><p class="sub">' + info.yds + " yards</p>" +
      '<div class="holes">' + holeTicks(round) + "</div>";
    const leaders = '<div class="lead">' + playersOf(round).map((name) => {
      const value = round.mode === "custom" ? totalPoints(round, name) : totalStrokes(round, name);
      const shown = round.mode === "custom" ? value + " pts" : (value.played ? value.total : "–");
      return "<span>" + esc(name.split(" ")[0]) + "<b>" + shown + "</b></span>";
    }).join("") + "</div>";
    const body = leaders + '<p class="call">' + esc(info.call) + "</p>" +
      (round.mode === "custom" ? customHole(round, hole, info) : officialHole(round, hole, info));
    const dock = '<div class="dock"><button class="btn ghost slim" type="button" data-act="move" data-dir="-1"' + (round.hole === 0 ? " disabled" : "") + '>Prev</button><button class="btn" type="button" data-act="move" data-dir="1">' + (round.hole === 8 ? "Finish" : "Next") + "</button></div>";
    return shell(band, body, dock);
  }

  function officialHole(round, hole, info) {
    const people = playersOf(round);
    const focus = people.indexOf(state.focus) === -1 ? CG.player : state.focus;
    state.focus = focus;
    const tabs = people.length > 1
      ? '<div class="focus">' + people.map((name) => '<button type="button" class="' + (name === focus ? "on" : "") + '" data-act="focus" data-name="' + esc(name) + '">' + esc(name.split(" ")[0]) + "</button>").join("") + "</div>"
      : "";
    const score = hole.scores[focus];
    const putts = hole.putts[focus];
    return tabs +
      '<p class="label mt">Score</p><div class="stepper"><button type="button" data-act="step" data-field="scores" data-dir="-1">−</button><div class="num blue">' + (score == null ? "–" : score) + '</div><button type="button" data-act="step" data-field="scores" data-dir="1">+</button></div>' +
      '<p class="label mt">Putts</p><div class="stepper"><button type="button" data-act="step" data-field="putts" data-dir="-1">−</button><div class="num">' + (putts == null ? "–" : putts) + '</div><button type="button" data-act="step" data-field="putts" data-dir="1">+</button></div>' +
      '<button class="btn blue" type="button" data-act="show-rules">Rules helper</button>' +
      '<button class="btn ghost" type="button" data-act="end">End round</button>';
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
    }
    return shell(band, standings + '<a class="btn" href="#/">Back to play</a>');
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
      const spec = field === "putts"
        ? { min: 0, max: 8, start: 2 }
        : { min: 1, max: 15, start: info.par };
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
    const el = event.target.closest("[data-act]");
    if (!el || el.tagName === "FORM" || !actions[el.dataset.act]) return;
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
  if (!location.hash) location.hash = "#/";
  else render();
})();
