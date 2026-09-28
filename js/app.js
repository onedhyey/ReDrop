/* ReDrop — site behaviour.
   No build step, no framework. Data comes straight from the published Google Sheet. */
(function () {
  "use strict";

  var C = window.REDROP;
  var SNAP = window.REDROP_SNAPSHOT;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IST_OFFSET = 5.5 * 3600 * 1000;

  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  var fmt = function (n) { return (Math.round(n * 10) / 10).toFixed(1); };
  var clean = function (s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); };
  var key = function (s) { return clean(s).toLowerCase(); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ---------- links ---------- */
  $$(".js-form-link").forEach(function (a) { a.href = C.formUrl; });
  $$(".js-sheet-link").forEach(function (a) { a.href = C.sheetUrl; });

  /* ---------- theme: light by default, dark on request ---------- */
  (function theme() {
    var root = document.documentElement, btn = $("#theme-toggle");
    function sync() {
      var dark = root.getAttribute("data-theme") === "dark";
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
    btn.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme") !== "dark";
      if (dark) root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
      try { localStorage.setItem("redrop-theme", dark ? "dark" : "light"); } catch (e) { /* storage unavailable */ }
      sync();
    });
    sync();
  })();

  /* ---------- the water surface ---------- */
  (function water() {
    var cv = $("#water");
    if (!cv || !cv.getContext) return;
    var hero = cv.parentElement;
    var readout = $(".hero__readout");
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1, surface = 0;
    var ripples = [], drops = [], splashes = [];
    var colors = {};
    var t = 0, last = 0, running = false, visible = true, nextAuto = 1.4;

    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      ["--water", "--water-2", "--water-deep", "--ground"].forEach(function (n) {
        colors[n] = cs.getPropertyValue(n).trim() || "#1e6b73";
      });
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var pad = parseFloat(getComputedStyle(readout).paddingTop) || 140;
      surface = readout.offsetTop + pad * 0.42;
      readColors();
      if (!running) frame(performance.now());
    }
    function height(x, layer) {
      var y = surface + layer * 16;
      y += Math.sin(x * (0.006 + layer * 0.002) + t * (0.9 - layer * 0.2) + layer * 1.7) * (6 - layer);
      y += Math.sin(x * 0.017 - t * 1.3 + layer) * 2.2;
      for (var i = 0; i < ripples.length; i++) {
        var r = ripples[i], age = t - r.t0, front = age * 240, d = Math.abs(x - r.x);
        if (d < front) y += r.a * Math.exp(-age * 1.05) * Math.exp(-d / 260) * Math.sin((d - front) * 0.05);
      }
      return y;
    }
    function drawDrop(x, y, s, fill) {
      ctx.beginPath();
      ctx.moveTo(x, y - 12 * s);
      ctx.bezierCurveTo(x + 2 * s, y - 7 * s, x + 7 * s, y - 2 * s, x + 7 * s, y + 2.5 * s);
      ctx.arc(x, y + 2.5 * s, 7 * s, 0, Math.PI);
      ctx.bezierCurveTo(x - 7 * s, y - 2 * s, x - 2 * s, y - 7 * s, x, y - 12 * s);
      ctx.fillStyle = fill; ctx.fill();
    }
    function frame(now) {
      var dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      if (!reduceMotion) t += dt;
      ctx.clearRect(0, 0, W, H);
      var layers = [[colors["--water-2"], 0.35], [colors["--water"], 0.75], [colors["--water-deep"], 1]];
      for (var l = 0; l < 3; l++) {
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (var x = 0; x <= W + 8; x += 8) ctx.lineTo(x, height(x, l));
        ctx.lineTo(W, H); ctx.closePath();
        ctx.globalAlpha = layers[l][1];
        ctx.fillStyle = layers[l][0];
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // falling drops
      for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i];
        d.vy += 1400 * dt; d.y += d.vy * dt;
        var sy = height(d.x, 0);
        if (d.y >= sy) {
          ripples.push({ x: d.x, t0: t, a: 12 + Math.min(d.vy / 90, 10) });
          for (var k = 0; k < 7; k++) {
            splashes.push({ x: d.x, y: sy, vx: (Math.random() - 0.5) * 180, vy: -120 - Math.random() * 180, r: 1.5 + Math.random() * 2, life: 1 });
          }
          drops.splice(i, 1);
        } else {
          drawDrop(d.x, d.y, 1, colors["--water-2"]);
        }
      }
      for (var j = splashes.length - 1; j >= 0; j--) {
        var p = splashes[j];
        p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.6;
        if (p.life <= 0 || p.y > height(p.x, 0) + 4) { splashes.splice(j, 1); continue; }
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = colors["--water-2"]; ctx.fill();
      }
      ctx.globalAlpha = 1;
      ripples = ripples.filter(function (r) { return t - r.t0 < 5; });
      if (!reduceMotion && t > nextAuto) {
        drop(W * (0.15 + Math.random() * 0.7), surface - 180 - Math.random() * 120);
        nextAuto = t + 6 + Math.random() * 5;
      }
      if (running) requestAnimationFrame(frame);
    }
    function drop(x, y) { drops.push({ x: x, y: Math.max(y, 10), vy: 0 }); }
    function start() {
      if (running || reduceMotion || !visible || document.hidden) return;
      running = true; last = 0; requestAnimationFrame(frame);
    }
    function stop() { running = false; }

    hero.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a, button")) return;
      var r = cv.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (reduceMotion) { ripples.push({ x: x, t0: t, a: 10 }); frame(performance.now()); return; }
      drop(x, Math.min(y, surface - 30));
    });
    window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    new MutationObserver(function () { readColors(); if (!running) frame(performance.now()); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
    resize();
    start();
  })();

  /* ---------- today: tip, countdown, streak ---------- */
  var TIPS = [
    "Turn the shower off while you soap up. At 10 litres a minute, two minutes saved is 20 litres.",
    "Close the tap while you brush. Our sheet counts 1.5 litres if you do and 6 if you leave it running every day.",
    "Wait for a full load before you run the washing machine.",
    "Swap one shower this week for a bucket bath. A bucket holds about 15 to 20 litres. A 10-minute shower uses 100.",
    "Water your plants with the water you used to rinse vegetables.",
    "Spot a dripping tap on campus? Report it today. A slow drip runs all day and all night.",
    "Keep a bottle of drinking water in the fridge instead of running the tap until it turns cold.",
    "Catch the cold water that runs before the shower warms up. Use it for flushing or plants.",
    "Rinse with a mug, not a running tap, after shaving or washing your face.",
    "Scrape plates before washing up so they need less rinsing.",
    "Set a timer and aim for a five-minute shower today.",
    "Shower minutes are the biggest number on almost every row of our board. That's where the litres are.",
    "Log today even if it was a heavy day. An honest high number is more useful than a missing one.",
    "Challenge a friend: whoever is lower on Monday picks the next chai.",
  ];
  function istNow() { return new Date(Date.now() + IST_OFFSET); } // read with getUTC*
  function istMondayKey(d) {
    var dow = (d.getUTCDay() + 6) % 7; // Monday = 0
    var m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow));
    return m.toISOString().slice(0, 10);
  }
  (function today() {
    var d = istNow();
    var start = Date.UTC(d.getUTCFullYear(), 0, 0);
    var doy = Math.floor((d.getTime() - start) / 86400000);
    $("#tip-text").textContent = TIPS[doy % TIPS.length];
    $("#tip-date").textContent = "· " + d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

    var cd = $("#countdown");
    function tick() {
      var n = istNow();
      var dow = (n.getUTCDay() + 6) % 7;
      var nextMon = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + (7 - dow));
      var ms = nextMon - n.getTime();
      var dd = Math.floor(ms / 86400000), hh = Math.floor(ms / 3600000) % 24, mm = Math.floor(ms / 60000) % 60;
      cd.textContent = dd + "d " + String(hh).padStart(2, "0") + "h " + String(mm).padStart(2, "0") + "m";
    }
    tick(); setInterval(tick, 30000);

    var list = $("#streak"), btn = $("#streak-btn"), note = $("#streak-note");
    var names = ["M", "T", "W", "T", "F", "S", "S"];
    function load() {
      var wk = istMondayKey(istNow());
      var s = store.get("redrop-streak");
      if (!s || s.week !== wk) s = { week: wk, days: [0, 0, 0, 0, 0, 0, 0] };
      return s;
    }
    function render() {
      var s = load(), todayIdx = (istNow().getUTCDay() + 6) % 7;
      list.innerHTML = names.map(function (n, i) {
        return '<li class="' + (s.days[i] ? "is-done " : "") + (i === todayIdx ? "is-today" : "") + '"><i></i><span>' + n + "</span></li>";
      }).join("");
      var count = s.days.filter(Boolean).length;
      btn.textContent = s.days[todayIdx] ? "Logged today ✓" : "I logged today";
      btn.setAttribute("aria-pressed", s.days[todayIdx] ? "true" : "false");
      note.textContent = count ? count + " of 7 days this week. Saved on this device only." : "Tick it after you fill the form. Saved on this device only.";
    }
    btn.addEventListener("click", function () {
      var s = load(), i = (istNow().getUTCDay() + 6) % 7;
      s.days[i] = s.days[i] ? 0 : 1;
      store.set("redrop-streak", s);
      render();
    });
    render();
  })();

  /* ---------- 1,000 drops ---------- */
  (function thousand() {
    var g = $("#thousand");
    if (!g) return;
    var html = "";
    for (var i = 0; i < 1000; i++) {
      var c = i < 975 ? "" : i < 992 ? "ice" : i < 999 ? "gw" : "sf";
      html += c ? '<i class="' + c + '"></i>' : "<i></i>";
    }
    g.innerHTML = html;
  })();

  /* ---------- data ---------- */
  var SERIES = [
    { k: "shower", label: "Shower", color: "var(--s-shower)" },
    { k: "flush", label: "Flush", color: "var(--s-flush)" },
    { k: "washing", label: "Laundry", color: "var(--s-washing)" },
    { k: "brush", label: "Brushing", color: "var(--s-brush)" },
    { k: "other", label: "Everything else", color: "var(--s-other)" },
  ];
  var state = { board: [], calc: {}, responses: [], source: "none", at: null };

  function parseCSV(text) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(f); rows.push(row); row = []; f = "";
      } else f += c;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function fetchTab(gid) {
    var url = "https://docs.google.com/spreadsheets/d/" + C.sheetId + "/gviz/tq?tqx=out:csv&gid=" + gid + "&_=" + Date.now();
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 10000);
    return fetch(url, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        clearTimeout(timer);
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (t) {
        if (/^\s*</.test(t)) throw new Error("Sheet is not public");
        return parseCSV(t);
      });
  }
  function num(v) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : null; }

  function modelFromRows(lb, calc, resp) {
    var board = [];
    lb.slice(1).forEach(function (r) {
      var name = clean(r[1]), v = num(r[2]);
      if (name && v !== null) board.push({ rank: num(r[0]) || board.length + 1, name: name, litres: v });
    });
    var cmap = {};
    calc.slice(1).forEach(function (r) {
      var name = clean(r[0]);
      if (!name || num(r[6]) === null) return;
      cmap[key(name)] = { flush: num(r[1]) || 0, shower: num(r[2]) || 0, brush: num(r[3]) || 0, washing: num(r[4]) || 0, other: num(r[5]) || 0, total: num(r[6]) };
    });
    var head = (resp[0] || []).map(clean);
    var col = function (re) { for (var i = 0; i < head.length; i++) if (re.test(head[i])) return i; return -1; };
    var iName = col(/your name/i), iQ1 = col(/^Q1\b/i), iQ2 = col(/^Q2\b/i), iQ9 = col(/^Q9\b/i);
    var responses = [];
    resp.slice(1).forEach(function (r) {
      var name = clean(r[iName]);
      if (name) responses.push({ name: name, guess: clean(r[iQ1]), biggest: clean(r[iQ2]), conscious: clean(r[iQ9]) });
    });
    return { board: board, calc: cmap, responses: responses };
  }
  function modelFromSnapshot() {
    return {
      board: SNAP.leaderboard.map(function (r, i) { return { rank: i + 1, name: r[0], litres: r[1] }; }),
      calc: SNAP.calculation.reduce(function (m, r) {
        m[key(r[0])] = { flush: r[1], shower: r[2], brush: r[3], washing: r[4], other: r[5], total: r[6] };
        return m;
      }, {}),
      responses: SNAP.responses.map(function (r) { return { name: r[0], guess: r[1], biggest: r[2], conscious: r[3] }; }),
    };
  }

  function load(manual) {
    var status = $("#board-status"), btn = $("#board-refresh");
    btn.disabled = true;
    if (manual) status.textContent = "Refreshing…";
    return Promise.all([fetchTab(C.tabs.leaderboard), fetchTab(C.tabs.calculation), fetchTab(C.tabs.responses)])
      .then(function (res) {
        var m = modelFromRows(res[0], res[1], res[2]);
        if (!m.board.length) throw new Error("Leaderboard tab is empty");
        m.source = "live"; m.at = Date.now();
        store.set("redrop-cache", { at: m.at, board: m.board, calc: m.calc, responses: m.responses });
        return m;
      })
      .catch(function (err) {
        var cached = store.get("redrop-cache");
        var m = cached && cached.board && cached.board.length ? cached : modelFromSnapshot();
        m.source = cached ? "cache" : "snapshot";
        m.error = err && err.message;
        return m;
      })
      .then(function (m) {
        state = m;
        renderAll();
        btn.disabled = false;
      });
  }

  function stats(board) {
    var v = board.map(function (b) { return b.litres; }).sort(function (a, b) { return a - b; });
    var n = v.length, sum = v.reduce(function (a, b) { return a + b; }, 0);
    var med = n ? (n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2) : 0;
    return {
      n: n, avg: n ? sum / n : 0, min: n ? v[0] : 0, max: n ? v[n - 1] : 0, median: med,
      under: v.filter(function (x) { return x <= C.normLitres; }).length,
      people: Object.keys(board.reduce(function (m, b) { m[key(b.name)] = 1; return m; }, {})).length,
    };
  }

  function renderAll() {
    var s = stats(state.board);
    var set = function (k, v) { $$('[data-live="' + k + '"]').forEach(function (el) { el.textContent = v; }); };
    set("avg", fmt(s.avg));
    set("leader", state.board[0] ? state.board[0].name + " · " + fmt(state.board[0].litres) + " L" : "–");
    set("count", s.people);
    set("min", fmt(s.min));
    set("median", fmt(s.median));
    set("under", s.under + " of " + s.n);

    var status = $("#board-status");
    status.classList.toggle("is-live", state.source === "live");
    status.classList.toggle("is-stale", state.source !== "live");
    var when = function (ts) { return new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
    if (state.source === "live") status.textContent = "Live from Google Sheets · updated " + when(state.at);
    else if (state.source === "cache") status.textContent = "Couldn't reach Google Sheets, showing the copy from " + when(state.at) + ". Try Refresh.";
    else status.textContent = "Couldn't reach Google Sheets, showing a saved copy from " + SNAP.takenAt + ". Try Refresh.";

    renderBoard();
    renderGap();
    renderCalc();
  }

  /* ---------- stacked breakdown ---------- */
  function stackHTML(parts) {
    var total = SERIES.reduce(function (a, s) { return a + (parts[s.k] || 0); }, 0) || 1;
    var bar = SERIES.map(function (s) {
      var v = parts[s.k] || 0;
      return v > 0 ? '<i style="flex-grow:' + v + ';background:' + s.color + '" title="' + s.label + ": " + fmt(v) + ' L"></i>' : "";
    }).join("");
    var legend = SERIES.map(function (s) {
      var v = parts[s.k] || 0;
      return '<li><i style="background:' + s.color + '"></i>' + s.label + " <b>" + fmt(v) + " L</b></li>";
    }).join("");
    return { bar: bar, legend: legend, total: total };
  }

  /* ---------- leaderboard ---------- */
  var DROP = function (fill) {
    return '<svg viewBox="0 0 16 18" aria-hidden="true"><path d="M8 1C8 1 2 8 2 11.5a6 6 0 0 0 12 0C14 8 8 1 8 1z" fill="' + fill + '"/></svg>';
  };
  function scaleMax() {
    var s = stats(state.board);
    return Math.max(250, Math.ceil(s.max / 50) * 50);
  }
  function renderBoard() {
    var list = $("#board-list"), axis = $("#board-axis");
    var max = scaleMax();
    var ticks = "";
    for (var t = 0; t <= max; t += 50) ticks += '<span style="left:' + (t / max * 100) + '%">' + t + (t === max ? " L" : "") + "</span>";
    ticks += '<span class="norm" style="left:' + (C.normLitres / max * 100) + '%;top:-12px">135 norm</span>';
    axis.innerHTML = ticks;

    if (!state.board.length) { list.innerHTML = '<li class="board__empty">No entries yet this week. Be the first.</li>'; return; }
    var medal = ["var(--marigold)", "#c9d6d6", "#b58a63"];
    list.innerHTML = state.board.map(function (b, i) {
      var cls = (i < 3 ? "is-top " : "") + (i === 0 ? "is-first" : "");
      var icon = i < 3 ? DROP(medal[i]) : "";
      return '<li class="' + cls + '" data-name="' + esc(key(b.name)) + '">' +
        '<button class="board__row" type="button" aria-expanded="false">' +
        '<span class="board__rank">' + b.rank + icon + "</span>" +
        '<span class="board__name">' + esc(b.name) + "</span>" +
        '<span class="board__track"><span class="board__bar"><i style="--w:' + Math.min(b.litres / max * 100, 100) + '%"></i></span>' +
        '<span class="board__norm" style="left:' + (C.normLitres / max * 100) + '%"></span></span>' +
        '<span class="board__val">' + fmt(b.litres) + "<small>L</small></span>" +
        "</button></li>";
    }).join("");
    applySearch();
  }
  $("#board-list").addEventListener("click", function (e) {
    var btn = e.target.closest(".board__row");
    if (!btn) return;
    var li = btn.parentElement, open = btn.getAttribute("aria-expanded") === "true";
    var existing = $(".board__detail", li);
    if (existing) existing.remove();
    btn.setAttribute("aria-expanded", String(!open));
    if (open) return;
    var parts = state.calc[li.getAttribute("data-name")];
    var d = document.createElement("div");
    d.className = "board__detail";
    if (!parts) {
      d.innerHTML = '<p class="small">No breakdown found for this name in the Calculation tab.</p>';
    } else {
      var st = stackHTML(parts);
      var biggest = SERIES.slice().sort(function (a, b) { return (parts[b.k] || 0) - (parts[a.k] || 0); })[0];
      d.innerHTML = '<div class="stack">' + st.bar + '</div><ul class="stack__legend">' + st.legend + "</ul>" +
        '<p class="small">' + biggest.label + " is the biggest share: " + Math.round((parts[biggest.k] / st.total) * 100) + "% of the day.</p>";
    }
    li.appendChild(d);
  });
  function applySearch() {
    var q = key($("#board-search").value);
    $$("#board-list > li[data-name]").forEach(function (li) {
      var hit = q && li.getAttribute("data-name").indexOf(q) !== -1;
      li.classList.toggle("is-hidden", !!q && !hit);
      li.classList.toggle("is-match", !!hit);
    });
  }
  $("#board-search").addEventListener("input", applySearch);
  $("#board-refresh").addEventListener("click", function () { load(true); });

  /* ---------- perception gap ---------- */
  var BANDS = {
    "less than 50 litres": [0, 50],
    "50-100 litres": [50, 100],
    "100-200 litres": [100, 200],
    "more than 200 litres": [200, null],
  };
  function renderGap() {
    var chart = $("#gap-chart");
    var seen = {}, rows = [];
    // latest response per name wins
    for (var i = state.responses.length - 1; i >= 0; i--) {
      var r = state.responses[i], k = key(r.name);
      if (seen[k] || !state.calc[k]) continue;
      seen[k] = 1;
      rows.push({ name: r.name, band: BANDS[key(r.guess)] || null, guess: r.guess, total: state.calc[k].total });
    }
    if (!rows.length) { chart.innerHTML = '<p class="muted small">No survey answers to compare yet.</p>'; return; }
    rows.sort(function (a, b) { return a.total - b.total; });
    var max = Math.max(250, Math.ceil(Math.max.apply(null, rows.map(function (r) { return r.total; })) / 50) * 50);
    var pct = function (v) { return (Math.min(v, max) / max * 100) + "%"; };
    var under = 0, guessed = 0;
    var html = rows.map(function (r) {
      var band = "";
      if (r.band) {
        guessed++;
        var hi = r.band[1] === null ? max : r.band[1];
        if (r.band[1] !== null && r.total > r.band[1]) under++;
        band = '<span class="gap__band' + (r.band[1] === null ? " gap__band--open" : "") + '" style="left:' + pct(r.band[0]) + ";width:calc(" + pct(hi) + " - " + pct(r.band[0]) + ')"></span>';
      }
      var tip = r.name + ": guessed " + (r.guess || "no answer") + ", calculated " + fmt(r.total) + " L";
      return '<div class="gap__row" title="' + esc(tip) + '"><span class="gap__name">' + esc(r.name) + "</span>" +
        '<span class="gap__track"><span class="gap__norm" style="left:' + pct(C.normLitres) + '"></span>' + band +
        '<span class="gap__dot" style="left:' + pct(r.total) + '"></span></span></div>';
    }).join("");
    var ticks = "";
    for (var t = 0; t <= max; t += 50) ticks += '<span style="left:' + (t / max * 100) + '%">' + t + (t === max ? " L" : "") + "</span>";
    html += '<div class="gap__axis" aria-hidden="true"><span></span><span class="gap__track">' + ticks + "</span></div>";
    chart.innerHTML = html;
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", under + " of " + guessed + " people who guessed their daily water use guessed lower than their calculated use.");

    var title = $("#gap-title"), lede = $("#gap-lede");
    if (guessed && under / guessed >= 0.5) {
      title.textContent = under + " of " + guessed + " of us guessed too low.";
      lede.textContent = "Before we calculate anything, the form asks how much water you think you use in a day. Each shaded band is a guess. Each dot is what the sheet worked out from that person's habits. Most dots land to the right of their band.";
    } else {
      title.textContent = "How good are our guesses?";
      lede.textContent = "Before we calculate anything, the form asks how much water you think you use in a day. Each shaded band is a guess. Each dot is what the sheet worked out. " + under + " of " + guessed + " people guessed lower than their calculated use.";
    }
  }

  /* ---------- calculator ---------- */
  var calcForm = $("#calc");
  var CALC_DEFAULTS = { flush: "3-4", shower: "5-10 minutes", brush: "Sometimes", washing: "2-3 times a week", other: "Student" };
  Object.keys(C.rates).forEach(function (k) {
    var sel = $("#c-" + k);
    sel.innerHTML = Object.keys(C.rates[k]).map(function (o) {
      return '<option value="' + esc(o) + '"' + (o === CALC_DEFAULTS[k] ? " selected" : "") + ">" + esc(o.charAt(0).toUpperCase() + o.slice(1)) + "</option>";
    }).join("");
  });
  var savedCalc = store.get("redrop-calc");
  if (savedCalc) Object.keys(savedCalc).forEach(function (k) {
    var sel = $("#c-" + k);
    if (sel && C.rates[k] && savedCalc[k] in C.rates[k]) sel.value = savedCalc[k];
  });
  function renderCalc() {
    var parts = {}, picks = {};
    Object.keys(C.rates).forEach(function (k) {
      picks[k] = $("#c-" + k).value;
      parts[k] = C.rates[k][picks[k]] || 0;
    });
    store.set("redrop-calc", picks);
    var total = SERIES.reduce(function (a, s) { return a + parts[s.k]; }, 0);
    var st = stackHTML(parts);
    $("#calc-total").textContent = fmt(total);
    $("#calc-stack").innerHTML = st.bar;
    $("#calc-stack").setAttribute("aria-label", SERIES.map(function (s) { return s.label + " " + fmt(parts[s.k]) + " litres"; }).join(", "));
    $("#calc-legend").innerHTML = st.legend;

    var diff = total - C.normLitres;
    var normLine = Math.abs(diff) < 0.05 ? "That's exactly the 135 L city norm."
      : diff > 0 ? "That's <strong>" + fmt(diff) + " L above</strong> the 135 L city norm."
      : "That's <strong>" + fmt(-diff) + " L under</strong> the 135 L city norm.";
    var rankLine = "";
    if (state.board.length) {
      var better = state.board.filter(function (b) { return b.litres < total; }).length;
      rankLine = " On this week's board you'd be <strong>#" + (better + 1) + " of " + (state.board.length + 1) + "</strong>.";
    }
    var biggest = SERIES.slice(0, 4).sort(function (a, b) { return parts[b.k] - parts[a.k]; })[0];
    var share = Math.round(parts[biggest.k] / total * 100);
    var hint = biggest.k === "shower" && picks.shower !== "Under 5 minutes"
      ? " Your shower is " + share + "% of it. Cutting five minutes saves 50 L a day."
      : " " + biggest.label + " is your biggest share at " + share + "%.";
    $("#calc-verdict").innerHTML = normLine + rankLine + hint;
  }
  calcForm.addEventListener("change", renderCalc);
  calcForm.addEventListener("submit", function (e) { e.preventDefault(); });

  /* ---------- depth gauge ---------- */
  (function gauge() {
    var g = $(".gauge"), read = $(".gauge__read"), pending = false;
    function update() {
      pending = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      g.style.setProperty("--p", p);
      read.textContent = Math.round(p * 220) + " L";
    }
    window.addEventListener("scroll", function () { if (!pending) { pending = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  /* ---------- boot ---------- */
  var cached = store.get("redrop-cache");
  state = cached && cached.board && cached.board.length ? Object.assign(cached, { source: "cache" }) : Object.assign(modelFromSnapshot(), { source: "snapshot" });
  renderAll();
  $("#board-status").textContent = "Connecting to Google Sheets…";
  load(false);
  // refresh when someone comes back to the tab after a while
  var lastLoad = Date.now();
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && Date.now() - lastLoad > 5 * 60 * 1000) { lastLoad = Date.now(); load(false); }
  });
})();
