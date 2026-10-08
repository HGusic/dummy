/* VoltzFire MVP content. One sample course, no backend. */
window.VF = {
  player: {
    name: "Jack",
    age: 14,
    hand: "Righty",
    height: "5'8\"",
    level: "Intermediate",
    home: "East Greenwich, RI",
    best: 39,
  },

  course: {
    name: "Goddard Memorial",
    place: "East Greenwich, RI",
    holesCount: 9,
    par: 36,
  },

  holes: [
    { n: 1, par: 5, yds: 500, approach: 175, call: "Par 5 southwest. Sand sits on both sides of the green, so leave the approach in the middle.", shape: "left" },
    { n: 2, par: 4, yds: 375, approach: 152, call: "Fairway bunker on the right. Start at the left edge and let the ball work back.", shape: "right" },
    { n: 3, par: 3, yds: 185, approach: 185, call: "One shot. The middle of the green is the smart target, even when the pin is tucked.", shape: "straight" },
    { n: 4, par: 4, yds: 286, approach: 118, call: "Short par 4. A smooth iron off the tee leaves a full wedge and skips the trouble.", shape: "left" },
    { n: 5, par: 5, yds: 496, approach: 160, call: "Three shots is a good score. Don't hunt the green until you are inside a wedge.", shape: "right" },
    { n: 6, par: 4, yds: 300, approach: 140, call: "The green is reachable for some. The fat part of the fairway is still the play.", shape: "straight" },
    { n: 7, par: 3, yds: 168, approach: 168, call: "Back pin plays longer than the number. Favor the front-middle of the green.", shape: "left" },
    { n: 8, par: 4, yds: 390, approach: 155, call: "Longest two-shot on the nine. Aim down the left and leave a full club in.", shape: "right" },
    { n: 9, par: 4, yds: 321, approach: 132, call: "Closing hole. Fairway first, then a full wedge to the middle.", shape: "straight" },
  ],

  friends: [
    "Maya Chen",
    "Luis Ortega",
    "Ava Brooks",
    "Noah Patel",
    "Riley James",
    "Ethan Cole",
    "Sofia Nguyen",
    "Caleb Wright",
  ],

  feed: [
    { name: "Maya Chen", text: "Posted 42 at Goddard", meta: "Yesterday · +6" },
    { name: "Luis Ortega", text: "Cleared the 3-foot tester", meta: "7 of 10" },
    { name: "Ava Brooks", text: "Logged a chipping session", meta: "Towel island · 5 of 8" },
    { name: "Noah Patel", text: "Five practice days this week", meta: "Lab streak" },
  ],

  boards: {
    rounds: {
      title: "Most rounds this week",
      rows: [["Maya Chen", "4"], ["Luis Ortega", "3"], ["Ava Brooks", "3"], ["Noah Patel", "2"]],
    },
    month: {
      title: "Most rounds this month",
      rows: [["Riley James", "11"], ["Maya Chen", "9"], ["Ethan Cole", "8"], ["Sofia Nguyen", "7"]],
    },
    practice: {
      title: "Practice sessions this week",
      rows: [["Noah Patel", "6"], ["Ava Brooks", "5"], ["Caleb Wright", "4"], ["Luis Ortega", "4"]],
    },
    score: {
      title: "Best 9-hole score this week",
      rows: [["Maya Chen", "40"], ["Luis Ortega", "42"], ["Ava Brooks", "43"], ["Riley James", "44"]],
    },
  },

  puttBoard: [
    ["Maya Chen", "8 / 10"],
    ["Luis Ortega", "7 / 10"],
    ["Ava Brooks", "7 / 10"],
  ],

  contests: [
    { id: "putts", label: "Least putts", hint: "Putts on the green", kind: "num", agg: "sum", lower: true, step: 1, min: 0, max: 8, start: 2, unit: "" },
    { id: "furthestPutt", label: "Furthest putt", hint: "Longest putt made, in feet", kind: "num", agg: "max", lower: false, step: 1, min: 0, max: 60, start: 8, unit: "ft" },
    { id: "hazards", label: "Hazards hit", hint: "Bunkers and penalty areas", kind: "num", agg: "sum", lower: true, step: 1, min: 0, max: 6, start: 0, unit: "" },
    { id: "driveDist", label: "Drive distance", hint: "Estimated yards, honor system", kind: "num", agg: "max", lower: false, step: 5, min: 0, max: 320, start: 150, unit: "y" },
    { id: "driveAcc", label: "Drive accuracy", hint: "Where the tee shot finished", kind: "choice", options: ["Fairway", "Rough", "Miss"], points: { Fairway: 2, Rough: 1, Miss: 0 }, agg: "points", lower: false },
    { id: "closest", label: "Closest to the pin", hint: "Feet from the hole after the approach", kind: "num", agg: "min", lower: true, step: 1, min: 0, max: 80, start: 20, unit: "ft" },
    { id: "updown", label: "Up and down", hint: "Chip and one putt, or already on", kind: "choice", options: ["Yes", "No", "Hit green"], points: { Yes: 1, No: 0, "Hit green": 1 }, agg: "points", lower: false },
    { id: "plan", label: "Stuck to the plan", hint: "Played the shot you called", kind: "choice", options: ["Yes", "No"], points: { Yes: 1, No: 0 }, agg: "points", lower: false },
    { id: "safeMiss", label: "Safe miss", hint: "If you missed, was it on the good side?", kind: "choice", options: ["Good side", "Wrong side", "Hit target"], points: { "Good side": 1, "Wrong side": 0, "Hit target": 1 }, agg: "points", lower: false },
  ],

  drills: [
    { id: "putt-3", section: "putting", name: "3-foot putt tester", detail: "From about 3 feet. Make 3 of 5 to clear today's gate.", tries: 5, need: 3 },
    { id: "putt-clock", section: "putting", name: "Clock drill", detail: "Four balls around the hole, two rounds. Make 6 of 8.", tries: 8, need: 6 },
    { id: "putt-gate", section: "putting", name: "Gate drill", detail: "Two tees as a gate, just wider than the ball. Start 7 of 10 through it.", tries: 10, need: 7 },
    { id: "chip-towel", section: "chipping", name: "Towel island", detail: "Land the chip on a towel. 4 of 8 is a clear.", tries: 8, need: 4 },
    { id: "chip-land", section: "chipping", name: "Landing spot", detail: "Call the landing spot before you swing. Hit it 4 of 6.", tries: 6, need: 4 },
    { id: "chip-up", section: "chipping", name: "Up and down", detail: "Chip, then putt. Hole out in two shots, 2 of 5.", tries: 5, need: 2 },
    { id: "drive-fair", section: "driving", name: "Fairway start", detail: "Pick a fairway window. Find it 3 of 5.", tries: 5, need: 3 },
    { id: "drive-miss", section: "driving", name: "One-way miss", detail: "Call the miss side before the swing. Miss there, or hit the window, 4 of 5.", tries: 5, need: 4 },
    { id: "iron-island", section: "irons", name: "7-iron island", detail: "A towel or basket is the green. Finish 4 of 8 on it.", tries: 8, need: 4 },
    { id: "iron-stock", section: "irons", name: "Stock yardage", detail: "Same club, same swing. Land 3 of 6 inside your window.", tries: 6, need: 3 },
    { id: "bunk-splash", section: "bunker", name: "Splash out", detail: "Hit the sand first and get out. 3 of 5.", tries: 5, need: 3 },
    { id: "bunk-stance", section: "bunker", name: "Quiet stance", detail: "Dig in, ball forward, no ground the club before the swing. 3 of 3 clean reps.", tries: 3, need: 3 },
  ],

  sections: [
    { id: "putting", name: "Putting", blurb: "Short putts, a gate, and a clock around the hole." },
    { id: "chipping", name: "Chipping", blurb: "Landing spots and up-and-downs." },
    { id: "driving", name: "Driving", blurb: "A window and a miss you chose." },
    { id: "irons", name: "Irons", blurb: "One club, one target." },
    { id: "bunker", name: "Bunker", blurb: "Splash the sand and get out." },
  ],

  dailies: ["putt-3", "chip-towel", "drive-fair", "iron-island", "putt-gate", "chip-up", "bunk-splash"],

  rules: [
    {
      id: "bunker",
      title: "Bunker",
      penalty: true,
      body: "A bunker is a prepared sand area. You can walk in it, but do not touch the sand with your club before the stroke. Play the ball as it lies, or take relief for one penalty stroke: drop in the bunker within two club-lengths, not nearer the hole, or back on a line, or replay the shot from where you just played (stroke and distance).",
    },
    {
      id: "yellow",
      title: "Water, yellow stakes",
      penalty: true,
      body: "Yellow stakes or a yellow line mark a penalty area. Add one penalty stroke, then choose: replay from the previous spot, or drop back on the line so the point where the ball crossed the edge stays between you and the hole. You may also play it as it lies if it is safe, with no penalty.",
    },
    {
      id: "red",
      title: "Water, red stakes",
      penalty: true,
      body: "Red stakes give you the yellow options, plus lateral relief. Add one stroke and drop within two club-lengths of where the ball last crossed the edge, not nearer the hole. This is the usual drop when water runs along the side of the hole.",
    },
    {
      id: "drop",
      title: "How a drop works",
      penalty: false,
      body: "Hold the ball at knee height and let it fall. It must land in the relief area and stay there. If it rolls out, drop again. If two drops will not stay in, place the ball on the spot where it hit the ground on the second drop. You do not tee it up, and you do not drop from shoulder height.",
    },
    {
      id: "lost",
      title: "Lost ball",
      penalty: true,
      body: "You have three minutes to search. If you cannot find it, the penalty is stroke and distance: go back to the previous spot, add one stroke, and play again. If you think it might be lost, say you are playing a provisional ball before you walk forward. If you find the first ball, the provisional does not count.",
    },
    {
      id: "ob",
      title: "Out of bounds",
      penalty: true,
      body: "White stakes, a fence, or the course boundary. Out of bounds is stroke and distance only. There is no lateral drop. Hit a provisional ball from the tee or the previous spot so the group does not wait.",
    },
    {
      id: "unplayable",
      title: "Unplayable lie",
      penalty: true,
      body: "You may declare your ball unplayable anywhere except in a penalty area (use the water options there). Add one stroke. Then replay from the previous spot, drop back on the line, or drop within two club-lengths, not nearer the hole. In a bunker, those drops stay in the bunker.",
    },
    {
      id: "whiff",
      title: "Whiff",
      penalty: false,
      body: "If you meant to hit the ball and missed, that swing counts. A practice swing, when you were not trying to move the ball, does not. If the ball falls off the tee before you start the swing, there is no stroke. Put it back.",
    },
    {
      id: "concede",
      title: "Conceded putt",
      penalty: false,
      body: "In a game with friends, someone can concede your putt. Pick the ball up. It counts as holed, in the number of strokes you already have plus that putt you did not hit. On a regular stroke-play card, hole out. A concession is only for match-style games.",
    },
  ],

  stations: [
    {
      id: "face",
      name: "Clubface control",
      summary: "The face sits in your palm. Your trail palm aims the shot.",
      steps: [
        ["Face in the palm", "The clubface should feel like it rests in the palm and fingers, not pinched on the fingertips."],
        ["Palm matches face", "Your trail palm points the same way the clubface points. If the palm opens, the face opens."],
        ["Hand motions for shots", "A small open face starts the ball a little right. Shut and tight starts it left. Match the palm to the shot you called."],
      ],
      quiz: [
        { q: "The clubface should feel like it sits…", options: ["In the palm and fingers", "Only on the fingertips, like a pencil"], a: 0 },
        { q: "Your trail palm points…", options: ["The same way the clubface points", "The opposite way of the clubface"], a: 0 },
        { q: "To start the ball a little right, the face is…", options: ["A little open, pointing right", "Shut tight left"], a: 0 },
      ],
    },
    {
      id: "putting",
      name: "Putting",
      summary: "Eyes over the ball, a short stroke, and a target on the line.",
      steps: [
        ["Setup", "Ball under the eyes, light grip, putter face at the target."],
        ["Stroke", "Rock the shoulders. The hands come along for the ride."],
        ["Commit", "Pick a spot a foot in front of the ball and roll it over that spot."],
      ],
      quiz: [
        { q: "A solid putting stroke is mostly…", options: ["Shoulders rocking", "Wrists flipping at the ball"], a: 0 },
        { q: "The putter face at address points…", options: ["At your target line", "At your back foot"], a: 0 },
        { q: "The spot you commit to is…", options: ["A foot or so in front of the ball", "The flagstick only, with no near target"], a: 0 },
      ],
    },
    {
      id: "driving",
      name: "Driving",
      summary: "A window in the fairway beats a hero line at the pin.",
      steps: [
        ["Window", "Pick a 20-yard wide start window, not a blade of grass."],
        ["Miss", "Call one miss that still leaves a shot. Aim so that miss stays in play."],
        ["Tempo", "Smooth from the top. The sound you want is a sweep, not a slap."],
      ],
      quiz: [
        { q: "A good tee target is…", options: ["A wide window in the fairway", "The flag, no matter the trouble"], a: 0 },
        { q: "You call the miss so that…", options: ["The bad shot still has a next shot", "You can swing harder at the trouble"], a: 0 },
      ],
    },
    {
      id: "balance",
      name: "Balance and pressure",
      summary: "Finish standing. Pressure moves toward the front foot through the ball.",
      steps: [
        ["Start", "Even pressure, knees soft, not locked."],
        ["Through", "Pressure shifts to the lead foot as you strike the ball."],
        ["Finish", "You can hold the finish for a breath without a step."],
      ],
      quiz: [
        { q: "At the finish you should be able to…", options: ["Hold it without stepping", "Fall toward the target every time"], a: 0 },
        { q: "Pressure through the strike moves…", options: ["Toward the lead foot", "Back onto the trail heel and stays there"], a: 0 },
      ],
    },
    {
      id: "flight",
      name: "Ball flight",
      summary: "The clubface sends the ball. The path bends it.",
      steps: [
        ["Face", "Where the face points at impact is mostly where the ball starts."],
        ["Path", "An in-to-out path with a square face can draw. Out-to-in can fade."],
        ["One change", "Change one thing on the range: face, or path, not both."],
      ],
      quiz: [
        { q: "The ball mostly starts where…", options: ["The clubface is pointing", "The feet are aimed, no matter the face"], a: 0 },
        { q: "On the range, change…", options: ["One thing at a time", "Grip, path, and ball position together"], a: 0 },
      ],
    },
    {
      id: "routine",
      name: "My routine",
      summary: "Same steps every time, so the swing is not a new decision.",
      steps: [
        ["Behind the ball", "Pick the target and the miss."],
        ["Beside the ball", "One look, one practice swing if you want it."],
        ["Go", "Step in and start. A routine that takes all day is not a routine."],
      ],
      quiz: [
        { q: "The routine starts…", options: ["Behind the ball, with a target", "Over the ball, figuring it out"], a: 0 },
        { q: "A useful routine is…", options: ["Short enough to use when the group is waiting", "A long checklist on every shot"], a: 0 },
      ],
    },
    {
      id: "rules",
      name: "Rules warm-up",
      summary: "Penalty areas, drops, and when a swing counts.",
      steps: [
        ["Find the color", "Yellow, red, and white stakes are different drops."],
        ["Knee height", "A drop falls from the knee and has to stay in the relief area."],
        ["Say it", "If the ball might be lost or out of bounds, say provisional before you leave."],
      ],
      quiz: [
        { q: "A drop starts from…", options: ["Knee height", "Shoulder height"], a: 0 },
        { q: "White stakes usually mean…", options: ["Out of bounds, stroke and distance", "A free lateral drop"], a: 0 },
        { q: "A provisional ball is for…", options: ["A ball that might be lost or out of bounds", "Any shot you did not like"], a: 0 },
      ],
    },
  ],

  voices: [
    { id: "rex", name: "Rex", note: "Clear, no rush", pitch: 1, rate: 1 },
    { id: "atlas", name: "Atlas", note: "Steady", pitch: 0.85, rate: 0.95 },
    { id: "helios", name: "Helios", note: "Brighter", pitch: 1.15, rate: 1.05 },
    { id: "orion", name: "Orion", note: "Calm", pitch: 0.9, rate: 0.9 },
    { id: "zenith", name: "Zenith", note: "Direct", pitch: 1, rate: 1.08 },
  ],

  fittings: {
    rec: {
      name: "Recreational player",
      who: "Weekend rounds. High launch, a lighter shaft, more forgiveness.",
      note: "Jack, 14, 5'8\", about 78 mph. Rec play wants launch and a face that stays in play.",
      why: "78 mph wants launch more than a heavier 10.5° adult head. This is a starting point, not a launch-monitor fitting.",
      driver: "Callaway Elyte Max Fast",
      specs: [["Loft", "12°"], ["Shaft", "40-gram lite graphite"], ["Length", "44 in"], ["Lie", "Neutral"]],
      alts: ["Cobra Air-X 2 · light full-size head", "Ping G440 HL 12° · shorter lite shaft"],
    },
    comp: {
      name: "Competitive player",
      who: "Tournament flight. A tighter window and a bit more workability.",
      note: "Same player, when the miss is smaller and the speed is there. Still a sample, not a measured fitting.",
      why: "A touch less loft and a slightly heavier shaft if the ball is already launching high enough.",
      driver: "Callaway Elyte Max",
      specs: [["Loft", "10.5°"], ["Shaft", "50-gram graphite"], ["Length", "44.5 in"], ["Lie", "Neutral"]],
      alts: ["TaylorMade Qi35 Max 10.5°", "Titleist GT2 10° · if speed jumps"],
    },
  },
};
