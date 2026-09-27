/* =========================================================
   MADARI — animated dotted globe, world map with trade routes, ribbons
   <canvas data-globe>     rotating dotted globe with routes & orbits
   <canvas data-worldmap>  dotted world map with animated routes from KSA
   <div class="ribbon">    infinite moving strip (content duplicated automatically)
   ========================================================= */
(function () {
  "use strict";

  var COLS = 240, ROWS = 120, CELL = 1.5;
  var GOLD = "207,166,74", GOLD_LIGHT = "232,204,128", BLUE = "120,155,255";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- decode land mask ---------- */
  var mask = new Uint8Array(COLS * ROWS);
  (window.MADARI_LAND || "").split("|").forEach(function (row, r) {
    var c = 0, val = 0;
    row.split(".").forEach(function (t) {
      var n = parseInt(t, 36);
      if (val) for (var i = 0; i < n; i++) mask[r * COLS + c + i] = 1;
      c += n; val = 1 - val;
    });
  });
  function isLand(lat, lon) {
    var r = Math.floor((90 - lat) / CELL), c = Math.floor((lon + 180) / CELL);
    if (r < 0 || r >= ROWS) return false;
    c = ((c % COLS) + COLS) % COLS;
    return mask[r * COLS + c] === 1;
  }

  /* ---------- places ---------- */
  var HUB = { name: "Riyadh", lat: 24.71, lon: 46.68 };
  var CITIES = [
    { lat: 21.54, lon: 39.17 },   // Jeddah
    { lat: 51.51, lon: -0.13 },   // London
    { lat: 40.71, lon: -74.0 },   // New York
    { lat: 48.86, lon: 2.35 },    // Paris
    { lat: 45.46, lon: 9.19 },    // Milan
    { lat: 41.01, lon: 28.98 },   // Istanbul
    { lat: 31.23, lon: 121.47 },  // Shanghai
    { lat: 35.68, lon: 139.69 },  // Tokyo
    { lat: 1.35, lon: 103.82 },   // Singapore
    { lat: 19.08, lon: 72.88 },   // Mumbai
    { lat: -26.2, lon: 28.05 },   // Johannesburg
    { lat: -23.55, lon: -46.63 }, // São Paulo
    { lat: 52.52, lon: 13.4 },    // Berlin
    { lat: 30.04, lon: 31.24 },   // Cairo
    { lat: -33.87, lon: 151.21 }, // Sydney
    { lat: 43.65, lon: -79.38 }   // Toronto
  ];

  function rad(d) { return d * Math.PI / 180; }
  function toVec(lat, lon) {
    var la = rad(lat), lo = rad(lon);
    return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
  }
  function slerp(a, b, t) {
    var d = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    if (d < 1e-6) return a;
    var s = Math.sin(d), k1 = Math.sin((1 - t) * d) / s, k2 = Math.sin(t * d) / s;
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
  }

  /* ---------- shared canvas helpers ---------- */
  function setup(canvas) {
    var ctx = canvas.getContext("2d");
    var state = { w: 0, h: 0, dpr: 1 };
    function resize() {
      var rect = canvas.getBoundingClientRect();
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = rect.width; state.h = rect.height;
      canvas.width = Math.max(1, Math.round(rect.width * state.dpr));
      canvas.height = Math.max(1, Math.round(rect.height * state.dpr));
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    }
    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    return { ctx: ctx, s: state };
  }
  function loop(canvas, draw, fps) {
    var visible = true, raf = 0, t0 = performance.now(), last = 0, gap = 1000 / (fps || 60) - 2;
    function frame(now) {
      if (now - last >= gap) { last = now; draw(Math.max(0, (now - t0) / 1000)); }
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(frame);
      }).observe(canvas);
    }
    raf = requestAnimationFrame(frame);
  }

  /* =========================================================
     GLOBE
     ========================================================= */
  var globePoints = (function () {
    var pts = [];
    var step = 1.5;
    for (var lat = -84; lat <= 84; lat += step) {
      var n = Math.max(8, Math.round(360 * Math.cos(rad(lat)) / step));
      for (var i = 0; i < n; i++) {
        var lon = -180 + (i + 0.5) * 360 / n;
        if (isLand(lat, lon)) pts.push(toVec(lat, lon));
      }
    }
    return pts;
  })();

  function initGlobe(canvas) {
    var g = setup(canvas), ctx = g.ctx, s = g.s;
    var tilt = rad(parseFloat(canvas.getAttribute("data-tilt") || "18"));
    var speed = parseFloat(canvas.getAttribute("data-speed") || "0.12");
    var showOrbits = canvas.getAttribute("data-orbits") !== "false";
    var hub = toVec(HUB.lat, HUB.lon);
    var routes = CITIES.map(function (c, i) {
      var b = toVec(c.lat, c.lon), seg = [];
      for (var k = 0; k <= 40; k++) {
        var p = slerp(hub, b, k / 40), lift = 1 + 0.22 * Math.sin(Math.PI * k / 40);
        seg.push([p[0] * lift, p[1] * lift, p[2] * lift]);
      }
      return { pts: seg, end: b, phase: (i * 0.37) % 1, dur: 2.8 + (i % 5) * 0.5 };
    });
    // start rotated so Saudi Arabia faces the viewer
    var baseRot = -rad(HUB.lon);

    function project(v, rot) {
      var cr = Math.cos(rot), sr = Math.sin(rot);
      var x = v[0] * cr + v[2] * sr, z = -v[0] * sr + v[2] * cr, y = v[1];
      var ct = Math.cos(tilt), st = Math.sin(tilt);
      var y2 = y * ct - z * st, z2 = y * st + z * ct;
      return [x, y2, z2];
    }

    function draw(t) {
      var w = s.w, h = s.h;
      ctx.clearRect(0, 0, w, h);
      var R = Math.min(w, h) * 0.36, cx = w / 2, cy = h / 2;
      var rot = baseRot + Math.sin(t * speed) * 0.9;

      // atmosphere
      var glow = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.45);
      glow.addColorStop(0, "rgba(" + BLUE + ",0.20)");
      glow.addColorStop(1, "rgba(" + BLUE + ",0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2); ctx.fill();
      var body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, "rgba(40,78,200,0.55)");
      body.addColorStop(1, "rgba(8,22,80,0.85)");
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(" + GOLD + ",0.45)"; ctx.lineWidth = 1; ctx.stroke();

      // orbits (back halves)
      if (showOrbits) drawOrbits(t, cx, cy, R, true);

      // land dots
      var dot = Math.max(0.9, R / 190);
      for (var i = 0; i < globePoints.length; i++) {
        var p = project(globePoints[i], rot);
        if (p[2] < -0.05) continue;
        var a = 0.25 + 0.75 * Math.max(0, p[2]);
        ctx.fillStyle = "rgba(210,225,255," + a.toFixed(3) + ")";
        ctx.fillRect(cx + p[0] * R - dot / 2, cy - p[1] * R - dot / 2, dot, dot);
      }

      // routes
      routes.forEach(function (r) {
        ctx.beginPath();
        var started = false;
        for (var k = 0; k < r.pts.length; k++) {
          var p = project(r.pts[k], rot);
          if (p[2] < -0.1) { started = false; continue; }
          var x = cx + p[0] * R, y = cy - p[1] * R;
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(" + GOLD + ",0.55)"; ctx.lineWidth = 1; ctx.stroke();

        var prog = ((t / r.dur) + r.phase) % 1;
        var idx = Math.floor(prog * (r.pts.length - 1));
        var pp = project(r.pts[idx], rot);
        if (pp[2] > -0.1) {
          var gx = cx + pp[0] * R, gy = cy - pp[1] * R;
          var gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 7);
          gg.addColorStop(0, "rgba(" + GOLD_LIGHT + ",1)"); gg.addColorStop(1, "rgba(" + GOLD_LIGHT + ",0)");
          ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(gx, gy, 7, 0, Math.PI * 2); ctx.fill();
        }
        var e = project(r.end, rot);
        if (e[2] > 0) { ctx.fillStyle = "rgba(" + GOLD_LIGHT + ",0.9)"; ctx.beginPath(); ctx.arc(cx + e[0] * R, cy - e[1] * R, 1.8, 0, Math.PI * 2); ctx.fill(); }
      });

      // hub pulse
      var hp = project(hub, rot);
      if (hp[2] > 0) {
        var hx = cx + hp[0] * R, hy = cy - hp[1] * R, pr = (t % 2.4) / 2.4;
        ctx.strokeStyle = "rgba(" + GOLD + "," + (1 - pr).toFixed(2) + ")";
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx, hy, 4 + pr * 18, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "rgb(" + GOLD_LIGHT + ")"; ctx.beginPath(); ctx.arc(hx, hy, 3.4, 0, Math.PI * 2); ctx.fill();
      }

      if (showOrbits) drawOrbits(t, cx, cy, R, false);
    }

    function drawOrbits(t, cx, cy, R, back) {
      [[1.32, 0.3, -0.38, 9, GOLD], [1.5, 0.22, 0.46, 13, BLUE]].forEach(function (o, i) {
        var rx = R * o[0], ry = R * o[0] * o[1], ang = o[2];
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
        ctx.beginPath();
        if (back) ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
        else ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
        ctx.strokeStyle = "rgba(" + o[4] + "," + (back ? 0.18 : 0.5) + ")";
        ctx.lineWidth = back ? 0.8 : 1.1; ctx.stroke();
        var a = (t / o[3]) * Math.PI * 2 * (i ? -1 : 1);
        var sx = Math.cos(a) * rx, sy = Math.sin(a) * ry;
        var front = Math.sin(a) > 0;
        if (front !== back) {
          ctx.fillStyle = "rgba(" + (i ? "255,255,255" : GOLD_LIGHT) + ",1)";
          ctx.shadowColor = "rgba(" + GOLD_LIGHT + ",0.9)"; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(sx, sy, i ? 3 : 4, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      });
    }

    if (reduce) draw(0); else loop(canvas, draw);
  }

  /* =========================================================
     FLAT WORLD MAP
     ========================================================= */
  function initMap(canvas) {
    var g = setup(canvas), ctx = g.ctx, s = g.s;
    var tone = canvas.getAttribute("data-tone") || "dark"; // dark | light
    var dotColor = tone === "light" ? "11,30,91" : "190,208,255";
    var dotAlpha = parseFloat(canvas.getAttribute("data-dot-alpha") || (tone === "light" ? "0.16" : "0.28"));
    var routesOn = canvas.getAttribute("data-routes") !== "false";
    var arcColor = tone === "light" ? "160,127,46" : GOLD;

    function xy(lat, lon, box) { return [box.x + (lon + 180) / 360 * box.w, box.y + (90 - lat) / 180 * box.h]; }

    var cache = null, cacheKey = "";
    function drawDots(box) {
      var key = s.w + "x" + s.h;
      if (cacheKey !== key) {
        cache = document.createElement("canvas");
        cache.width = Math.round(s.w * s.dpr); cache.height = Math.round(s.h * s.dpr);
        var c2 = cache.getContext("2d"); c2.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
        var stepC = box.w / COLS, r = Math.min(1.7, Math.max(0.7, stepC * 0.32));
        c2.fillStyle = "rgba(" + dotColor + "," + dotAlpha + ")";
        for (var row = 0; row < ROWS; row += 1) {
          for (var col = 0; col < COLS; col += 1) {
            if ((row + col) % 2) continue; // hex-ish offset pattern
            if (!mask[row * COLS + col]) continue;
            var x = box.x + (col + 0.5) * stepC, y = box.y + (row + 0.5) * (box.h / ROWS);
            c2.beginPath(); c2.arc(x, y, r * 1.35, 0, Math.PI * 2); c2.fill();
          }
        }
        cacheKey = key;
      }
      ctx.drawImage(cache, 0, 0, s.w, s.h);
    }

    function draw(t) {
      var w = s.w, h = s.h;
      ctx.clearRect(0, 0, w, h);
      // fit 2:1 map covering width, cropped poles
      var bw = Math.max(w, h * 2.1), bh = bw / 2;
      var box = { x: (w - bw) / 2, y: (h - bh) / 2 + bh * 0.06, w: bw, h: bh };
      drawDots(box);
      if (!routesOn) return;

      var hub = xy(HUB.lat, HUB.lon, box);
      CITIES.forEach(function (c, i) {
        var p = xy(c.lat, c.lon, box);
        var mx = (hub[0] + p[0]) / 2, my = (hub[1] + p[1]) / 2;
        var dist = Math.hypot(p[0] - hub[0], p[1] - hub[1]);
        var cxp = mx, cyp = my - dist * 0.32;
        ctx.beginPath(); ctx.moveTo(hub[0], hub[1]); ctx.quadraticCurveTo(cxp, cyp, p[0], p[1]);
        ctx.strokeStyle = "rgba(" + arcColor + ",0.35)"; ctx.lineWidth = 1; ctx.stroke();

        // travelling light — alternates direction: exchange both ways
        var dur = 3.2 + (i % 5) * 0.6;
        var pr = ((t / dur) + i * 0.29) % 1;
        if (i % 2) pr = 1 - pr;
        var qx = (1 - pr) * (1 - pr) * hub[0] + 2 * (1 - pr) * pr * cxp + pr * pr * p[0];
        var qy = (1 - pr) * (1 - pr) * hub[1] + 2 * (1 - pr) * pr * cyp + pr * pr * p[1];
        var gg = ctx.createRadialGradient(qx, qy, 0, qx, qy, 8);
        gg.addColorStop(0, "rgba(" + GOLD_LIGHT + ",1)"); gg.addColorStop(1, "rgba(" + GOLD_LIGHT + ",0)");
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(qx, qy, 8, 0, Math.PI * 2); ctx.fill();

        // city node
        var cp = ((t + i * 0.4) % 3) / 3;
        ctx.strokeStyle = "rgba(" + arcColor + "," + (0.6 * (1 - cp)).toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(p[0], p[1], 2 + cp * 9, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "rgba(" + GOLD_LIGHT + ",0.95)"; ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, Math.PI * 2); ctx.fill();
      });
      var hp = (t % 2.4) / 2.4;
      ctx.strokeStyle = "rgba(" + GOLD + "," + (1 - hp).toFixed(2) + ")"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(hub[0], hub[1], 5 + hp * 22, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgb(" + GOLD_LIGHT + ")"; ctx.beginPath(); ctx.arc(hub[0], hub[1], 4, 0, Math.PI * 2); ctx.fill();
    }

    if (reduce) draw(0); else loop(canvas, draw, 30);
  }

  /* =========================================================
     RIBBONS
     ========================================================= */
  function initRibbons() {
    document.querySelectorAll(".ribbon-track").forEach(function (track) {
      track.innerHTML = track.innerHTML + track.innerHTML;
    });
  }

  document.querySelectorAll("canvas[data-globe]").forEach(initGlobe);
  document.querySelectorAll("canvas[data-worldmap]").forEach(initMap);
  initRibbons();
})();
