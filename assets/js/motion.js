/* =========================================================
   MADARI — motion engine
   Loader & page transitions · hero slider · headline word reveals ·
   direction-aware block reveals · image wipes · parallax ·
   scale-up containers · scroll-reactive ribbons · tilt · cursor · smooth scroll
   ========================================================= */
(function () {
  "use strict";
  window.MADARI_MOTION = true;

  var html = document.documentElement;
  var rtl = html.dir === "rtl";
  var lang = html.lang === "en" ? "en" : "ar";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var lenis = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function each(sel, fn, rootEl) { Array.prototype.forEach.call((rootEl || document).querySelectorAll(sel), fn); }

  /* ---------- 1. Loader & page transitions ---------- */
  function finishLoader(onDone) {
    if (!html.classList.contains("is-loading")) { onDone(); return; }
    var first = html.classList.contains("first-visit");
    var line, word;
    if (first) {
      line = document.createElement("div"); line.className = "loader-line";
      word = document.createElement("div"); word.className = "loader-word"; word.textContent = "MADARI";
      document.body.appendChild(line); document.body.appendChild(word);
    }
    var start = performance.now();
    var minHold = first ? 1300 : 650;
    function reveal() {
      var wait = Math.max(0, minHold - (performance.now() - start));
      setTimeout(function () {
        html.classList.add("is-revealing");
        html.classList.remove("is-loading");
        setTimeout(onDone, 250);
        setTimeout(function () {
          html.classList.remove("is-revealing", "first-visit");
          if (line) line.remove(); if (word) word.remove();
        }, 1000);
      }, wait);
    }
    if (first && document.readyState !== "complete") {
      var fired = false;
      var go = function () { if (!fired) { fired = true; reveal(); } };
      window.addEventListener("load", go);
      setTimeout(go, 1800);
    } else reveal();
    try { sessionStorage.setItem("madari-v", "1"); } catch (e) {}
  }

  function pageTransitions() {
    if (reduce) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      var url;
      try { url = new URL(a.getAttribute("href"), location.href); } catch (err) { return; }
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / anchors
      e.preventDefault();
      html.classList.add("is-leaving");
      var logo = document.querySelector(".brand img");
      var cur = document.createElement("div");
      cur.className = "mx-curtain";
      cur.innerHTML = '<div class="mc-inner"><span class="ring"></span><img alt="" src="' + (logo ? logo.src : "") + '"></div>';
      document.body.appendChild(cur);
      void cur.offsetWidth;
      cur.classList.add("on");
      setTimeout(function () { location.href = url.href; }, 900);
    });
    window.addEventListener("pageshow", function (ev) {
      if (ev.persisted) {
        html.classList.remove("is-leaving", "is-loading", "is-revealing");
        each(".mx-curtain", function (c) { c.remove(); });
      }
    });
  }

  /* ---------- 2. Headline word split ---------- */
  function splitHeadings() {
    each("h1.display, h2.h2, .dual-panel h2, .sector-row h2, .detail-aside h2", function (h) {
      if (h.classList.contains("split-done")) return;
      var wi = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var parts = n.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
              var w = document.createElement("span"); w.className = "w";
              var inner = document.createElement("span"); inner.textContent = p; inner.style.setProperty("--wi", wi++);
              w.appendChild(inner); frag.appendChild(w);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.tagName !== "BR" && !n.classList.contains("w")) walk(n);
        });
      })(h);
      h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
      h.classList.add("split-done");
      if (!h.classList.contains("reveal") && !h.closest(".reveal")) h.classList.add("reveal");
    });
  }

  /* ---------- 3. Auto tagging ---------- */
  function tag() {
    // stagger siblings in grids
    each(".cards, .features, .sectors, .packages, .audience, .timeline, .process, .kpis, .hero-content, .btn-row", function (g) {
      var i = 0;
      Array.prototype.forEach.call(g.children, function (c) { if (c.classList.contains("reveal") || c.classList.contains("mx-img") || /service-card|sector/.test(c.className)) c.style.setProperty("--i", (i++ % 5)); });
    });
    each(".reveal", function (el) {
      if (el.style.getPropertyValue("--i")) return;
      var m = el.className.match(/reveal-d(\d)/); if (m) el.style.setProperty("--i", m[1]);
    });
    // split columns slide in from their sides
    each(".split, .section-globe, .form-wrap, .section-head:not(.center)", function (s) {
      var kids = Array.prototype.filter.call(s.children, function (c) { return c.classList.contains("reveal"); });
      if (kids.length === 2) { kids[0].classList.add("from-start"); kids[1].classList.add("from-end"); }
    });
    // image wipes
    each(".media-frame, .service-card, .sector, .sector-row, .detail-aside, .pilot-gallery", function (el) {
      el.classList.add("mx-img");
      if (!el.classList.contains("media-frame") && !reduce) {
        var cover = document.createElement("span"); cover.className = "mx-cover"; cover.setAttribute("aria-hidden", "true");
        el.appendChild(cover);
      }
    });
    // parallax only on the top hero backgrounds (cheap, one layer)
    each(".hero-slides, .hero-media", function (el) { el.setAttribute("data-px", "hero"); });
    each(".page-hero .bg", function (el) { el.setAttribute("data-px", "hero"); });
    // tilt + cursor targets
    if (finePointer && !reduce) {
      each(".service-card, .sector", function (el) {
        el.classList.add("tilt");
        var g = document.createElement("span"); g.className = "tilt-glare"; el.appendChild(g);
      });
    }
    each(".service-card, .sector, .media-frame, .sector-row > img, .dual-panel", function (el) { el.setAttribute("data-cursor", lang === "ar" ? "اكتشف" : "View"); });
  }

  /* ---------- 4. Direction-aware reveals ---------- */
  var lastY = window.scrollY, dir = 1;
  function reveals() {
    var targets = document.querySelectorAll(".reveal, .mx-img, .gold-rule");
    if (reduce || !("IntersectionObserver" in window)) { Array.prototype.forEach.call(targets, function (t) { t.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        if (!en.isIntersecting) return;
        // reveal once, from the side the visitor is coming from, then stay put
        el.style.setProperty("--from", (dir >= 0 ? 36 : -36) + "px");
        requestAnimationFrame(function () { el.classList.add("in"); });
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -4% 0px" });
    Array.prototype.forEach.call(targets, function (t) { io.observe(t); });
  }

  /* ---------- 5. Hero slider ---------- */
  function heroSlider() {
    var box = document.querySelector("[data-hero-slider]");
    if (!box) return;
    var hero = box.closest(".hero");
    var slides = box.querySelectorAll(".hero-slide");
    var sweep = box.querySelector(".slide-sweep");
    var ctls = hero.querySelectorAll(".slide-ctl");
    var caption = hero.querySelector(".slide-caption span");
    var dur = parseInt(box.getAttribute("data-interval") || "8000", 10);
    hero.style.setProperty("--slide-dur", dur + "ms");
    var cur = 0, timer = 0, busy = false;

    function media(s) { return s.querySelector("video"); }
    function setCtl(i) {
      Array.prototype.forEach.call(ctls, function (c, k) {
        c.classList.remove("is-active");
        if (k === i) { void c.offsetWidth; c.classList.add("is-active"); c.setAttribute("aria-current", "true"); } else c.removeAttribute("aria-current");
      });
      if (caption) {
        caption.style.opacity = "0";
        setTimeout(function () { caption.textContent = slides[i].getAttribute("data-caption") || ""; caption.style.opacity = "1"; }, 350);
      }
    }
    function go(n) {
      if (busy || n === cur) return;
      busy = true;
      var prev = slides[cur], next = slides[n];
      var v = media(next); if (v) { try { v.currentTime = 0; } catch (e) {} var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      prev.classList.remove("is-active"); prev.classList.add("is-leaving");
      next.classList.add("is-active", "is-entering");
      if (sweep) { sweep.classList.remove("run"); void sweep.offsetWidth; sweep.classList.add("run"); }
      cur = n; setCtl(n);
      setTimeout(function () {
        prev.classList.remove("is-leaving");
        next.classList.remove("is-entering");
        var pv = media(prev); if (pv) pv.pause();
        busy = false;
      }, 1500);
      schedule();
    }
    function schedule() { clearTimeout(timer); if (!reduce) timer = setTimeout(function () { go((cur + 1) % slides.length); }, dur); }
    Array.prototype.forEach.call(ctls, function (c, k) { c.addEventListener("click", function () { go(k); }); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) clearTimeout(timer); else schedule(); });
    setCtl(0); schedule();
  }

  /* ---------- 6. Scroll-driven effects (single rAF loop) ---------- */
  var ribbons = [];
  var vel = 0;
  function scrollFx() {
    if (reduce) return;
    var px = Array.prototype.slice.call(document.querySelectorAll("[data-px]"));
    var heroContent = document.querySelector(".hero .hero-content, .page-hero .container");
    var heroGlobe = document.querySelector(".hero .globe-wrap");
    each(".ribbon-track", function (t) {
      var anims = t.getAnimations ? t.getAnimations() : [];
      if (anims.length) ribbons.push(anims[0]);
    });
    var ticking = false;

    function frame() {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      var dy = y - lastY; if (dy) dir = dy > 0 ? 1 : -1;
      vel = vel * 0.85 + dy * 0.15;
      lastY = y;

      // only the top hero moves with scroll; below it nothing is recalculated
      if (y < vh * 1.2) {
        px.forEach(function (el) { el.style.setProperty("--py", (y * 0.25).toFixed(1) + "px"); });
      }

      if (heroContent && y < vh) {
        var k = clamp(y / (vh * 0.85), 0, 1);
        heroContent.style.transform = "translate3d(0," + (y * 0.18).toFixed(1) + "px,0)";
        heroContent.style.opacity = (1 - k * 0.9).toFixed(3);
        if (heroGlobe) heroGlobe.style.transform = "translate3d(0," + (y * 0.08).toFixed(1) + "px,0) scale(" + (1 - k * 0.12).toFixed(3) + ")";
      }

      var speed = clamp(Math.abs(vel) / 10, 0, 2);
      ribbons.forEach(function (a) { a.playbackRate = dir * (1 + speed); });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // settle ribbons back to their base speed when scrolling stops
    setInterval(function () {
      if (Math.abs(vel) > 0.2) { vel *= 0.6; ribbons.forEach(function (a) { a.playbackRate = dir * (1 + clamp(Math.abs(vel) / 10, 0, 2)); }); }
    }, 120);
    frame();
  }

  /* ---------- 7. Tilt ---------- */
  function tilt() {
    if (!finePointer || reduce) return;
    each(".tilt", function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * 6).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 8).toFixed(2) + "deg)";
        el.style.setProperty("--gx", (x * 100).toFixed(1) + "%"); el.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- 8. Cursor ---------- */
  function cursor() {
    if (!finePointer || reduce) return;
    var c = document.createElement("div"); c.className = "mx-cursor"; c.innerHTML = "<span></span>";
    document.body.appendChild(c);
    var label = c.firstChild, tx = -100, ty = -100, x = -100, y = -100, raf = 0;
    function loop() {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      c.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    }
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY; c.classList.add("on");
      if (!raf) raf = requestAnimationFrame(loop);
      var t = e.target.closest && e.target.closest("[data-cursor]");
      var hot = e.target.closest && e.target.closest("a, button, input, select, textarea");
      if (t && (!hot || hot === t || t.contains(hot) && hot.matches(".service-card, .sector"))) { c.classList.add("label"); label.textContent = t.getAttribute("data-cursor"); }
      else c.classList.remove("label");
      c.classList.toggle("hot", !!hot && !t);
    });
    document.addEventListener("mouseleave", function () { c.classList.remove("on"); });
  }

  /* ---------- 9. Smooth scroll (Lenis) ---------- */
  function smooth() {
    if (reduce || !finePointer) return;
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js";
    s.onload = function () {
      if (!window.Lenis) return;
      lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, anchors: { offset: -90 } });
      html.classList.add("lenis-on");
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      new MutationObserver(function () {
        if (document.body.classList.contains("nav-open")) lenis.stop(); else lenis.start();
      }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    };
    document.head.appendChild(s);
  }

  /* ---------- boot ---------- */
  function init() {
    splitHeadings();
    tag();
    heroSlider();
    tilt();
    cursor();
    pageTransitions();
    // native browser scrolling (no smooth-scroll library) keeps navigation light and responsive
    finishLoader(function () { reveals(); scrollFx(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
