/* =========================================================
   MADARI — shared header, footer, language switch, motion, forms
   Edit contact details and navigation here — applies to every page.
   ========================================================= */
(function () {
  "use strict";

  var CONTACT = {
    email: "info@madari.com.sa",
    phoneDisplay: "+966 56 556 3222",
    phoneLocal: "0565563222",
    phoneHref: "tel:+966565563222",
    whatsapp: "https://wa.me/966565563222"
  };

  var html = document.documentElement;
  var lang = html.lang === "en" ? "en" : "ar";
  var root = lang === "en" ? "../" : "";
  var page = document.body.getAttribute("data-page") || "index";
  var file = page === "index" ? "index.html" : page + ".html";

  var T = {
    ar: {
      nav: [
        ["index", "الرئيسية"], ["about", "من نحن"], ["services", "الخدمات"], ["packages", "الباقات"],
        ["sectors", "القطاعات"], ["foreign-companies", "دخول السوق السعودي"], ["saudi-companies", "الشركات السعودية"],
        ["exhibitions", "المعارض"], ["contact", "تواصل معنا"]
      ],
      cta: "ابدأ مشروعك",
      langLabel: "EN",
      langTitle: "English",
      menu: "القائمة",
      footerAbout: "نربط الشركات المناسبة بالفرص المناسبة، ونحوّل العلاقات الدولية إلى أعمال قابلة للنمو.",
      parentLabel: "تابعة لـ",
      parent: "مؤسسة عبدالرحمن الغامدي للعلاقات العامة",
      slogan: "من السوق السعودي إلى العالم، ومن العالم إلى السوق السعودي.",
      colLinks: "روابط سريعة",
      colSolutions: "حلول مداري",
      colContact: "تواصل معنا",
      legal: [["legal.html#privacy", "سياسة الخصوصية"], ["legal.html#terms", "الشروط والأحكام"], ["legal.html#usage", "سياسة الاستخدام"]],
      rights: "جميع الحقوق محفوظة لمداري للربط التجاري بين الشركات المحلية والدولية.",
      location: "المملكة العربية السعودية",
      wa: "واتساب",
      sending: "جارٍ الإرسال…",
      thanksTitle: "تم استلام طلبك",
      thanks: "شكراً لتواصلك مع مداري. سيقوم فريقنا بمراجعة طلبك والتواصل معك لمناقشة الخطوات التالية.",
      fallback: "تعذّر الإرسال المباشر. فتحنا لك رسالة بريد جاهزة إلى " + CONTACT.email + " — أو تواصل معنا عبر واتساب.",
      required: "يرجى تعبئة الحقول المطلوبة."
    },
    en: {
      nav: [
        ["index", "Home"], ["about", "About"], ["services", "Services"], ["packages", "Packages"],
        ["sectors", "Sectors"], ["foreign-companies", "Market Entry"], ["saudi-companies", "Saudi Companies"],
        ["exhibitions", "Exhibitions"], ["contact", "Contact"]
      ],
      cta: "Start Your Project",
      langLabel: "ع",
      langTitle: "العربية",
      menu: "Menu",
      footerAbout: "We connect the right companies with the right opportunities — and turn international relationships into business that grows.",
      parentLabel: "A division of",
      parent: "Abdulrahman Al-Ghamdi Public Relations Est.",
      slogan: "From Saudi Arabia to the World, and from the World to Saudi Arabia.",
      colLinks: "Explore",
      colSolutions: "Solutions",
      colContact: "Contact",
      legal: [["legal.html#privacy", "Privacy Policy"], ["legal.html#terms", "Terms & Conditions"], ["legal.html#usage", "Acceptable Use"]],
      rights: "All rights reserved. MADARI – International Business Linkage.",
      location: "Kingdom of Saudi Arabia",
      wa: "WhatsApp",
      sending: "Sending…",
      thanksTitle: "Request received",
      thanks: "Thank you for contacting MADARI. Our team will review your request and get back to you to discuss the next steps.",
      fallback: "We couldn't submit directly, so we've opened a pre-filled email to " + CONTACT.email + ". You can also reach us on WhatsApp.",
      required: "Please complete the required fields."
    }
  }[lang];

  var ICONS = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6l8.5 7 8.5-7"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 000-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>',
    network: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><circle cx="12" cy="12.5" r="1.6"/><path d="M12 7.2v3.7M10.7 13.5l-4.1 3M13.3 13.5l4.1 3"/></svg>',
    market: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 20h18M5 20V10M10 20V6M15 20v-8M20 20V4"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5M8.5 11l1.8 1.8L14 9"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    follow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 12a8 8 0 0113.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 01-13.7 5.6L4 15M4 20v-5h5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><rect x="9" y="10.5" width="6" height="5" rx=".8"/><path d="M10.2 10.5V9a1.8 1.8 0 013.6 0v1.5"/></svg>',
    handshake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 12l4-4 4 1 3-2 4 1 5 4M6 8v6l4 4 2-1 2 2 2-1 2-3M10 13l2 2M12 11l3 3"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M21 15l-8-4V5a1.5 1.5 0 00-3 0v6l-8 4v2l8-2v4l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-4l8 2z"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>',
    factory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17z"/><path d="M7 17h2M12 17h2M17 17h1"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>',
    booth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 21V9l9-5 9 5v12M3 9h18M8 21v-6h8v6"/></svg>',
    invest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
    arrow: '<svg class="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h11M9 4l4 4-4 4"/></svg>'
  };

  function icon(name) { return ICONS[name] || ""; }

  /* ---------- Header ---------- */
  var H = {
    ar: {
      primary: [["index", "الرئيسية"], ["about", "من نحن"], ["services", "الخدمات"], ["packages", "الباقات"], ["sectors", "القطاعات"]],
      solutions: "الحلول",
      drop: [
        ["foreign-companies", "دخول السوق السعودي", "للشركات الدولية الراغبة في الوصول إلى المملكة", "plane"],
        ["saudi-companies", "الشركات السعودية", "للوصول إلى شركاء وموردين دوليين", "handshake"],
        ["exhibitions", "المعارض والفعاليات", "تحويل المشاركة إلى فرص تجارية", "booth"]
      ],
      contact: ["contact", "تواصل معنا"],
      slogan: "من السوق السعودي إلى العالم، ومن العالم إلى السوق السعودي.",
      langName: "English"
    },
    en: {
      primary: [["index", "Home"], ["about", "About"], ["services", "Services"], ["packages", "Packages"], ["sectors", "Sectors"]],
      solutions: "Solutions",
      drop: [
        ["foreign-companies", "Saudi Market Entry", "For international companies entering the Kingdom", "plane"],
        ["saudi-companies", "Saudi Companies", "Reach international partners and suppliers", "handshake"],
        ["exhibitions", "Exhibitions & Events", "Turn participation into opportunities", "booth"]
      ],
      contact: ["contact", "Contact"],
      slogan: "From Saudi Arabia to the World, and from the World to Saudi Arabia.",
      langName: "العربية"
    }
  }[lang];

  function href(key) { return key === "index" ? "index.html" : key + ".html"; }

  function buildHeader() {
    var mount = document.getElementById("site-header");
    if (!mount) return;
    var inDrop = H.drop.some(function (d) { return d[0] === page; });
    var link = function (n) { return '<a href="' + href(n[0]) + '"' + (n[0] === page ? ' class="active" aria-current="page"' : "") + ">" + n[1] + "</a>"; };
    var caret = '<svg class="caret" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3.5l3 3 3-3"/></svg>';
    var dropLinks = H.drop.map(function (d) {
      return '<a href="' + href(d[0]) + '"' + (d[0] === page ? ' class="active" aria-current="page"' : "") + '><span class="di">' + icon(d[3]) + "</span><span><b>" + d[1] + "</b><small>" + d[2] + "</small></span></a>";
    }).join("");
    var otherLang = lang === "ar" ? "en/" + file : "../" + file;
    var globe = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>';
    var solid = document.body.hasAttribute("data-solid-header") ? " solid" : "";

    var mobileItems = H.primary.concat(H.drop.map(function (d) { return [d[0], d[1]]; })).concat([H.contact]);
    var mobileLinks = mobileItems.map(function (n, i) {
      return '<a href="' + href(n[0]) + '"' + (n[0] === page ? ' class="active"' : "") + ' style="transition-delay:' + (0.05 + i * 0.04).toFixed(2) + 's"><i>' + String(i + 1).padStart(2, "0") + "</i>" + n[1] + "</a>";
    }).join("");

    var mainEl = document.querySelector("main");
    if (mainEl && !mainEl.id) mainEl.id = "main";
    mount.outerHTML =
      '<a class="skip-link" href="#main">' + (lang === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content") + "</a>" +
      '<div class="scroll-progress" id="scroll-progress" aria-hidden="true"></div>' +
      '<header class="site-header' + solid + '" id="top-header">' +
        '<div class="topbar"><div class="container">' +
          '<div class="topbar-contact">' +
            '<a class="ltr" href="mailto:' + CONTACT.email + '">' + icon("mail") + CONTACT.email + "</a>" +
            '<a class="ltr" href="' + CONTACT.phoneHref + '">' + icon("phone") + CONTACT.phoneDisplay + "</a>" +
          "</div>" +
          '<span class="topbar-slogan">' + H.slogan + "</span>" +
        "</div></div>" +
        '<div class="nav-shell"><div class="container nav-wrap">' +
          '<a class="brand" href="index.html" aria-label="MADARI">' +
            '<img src="' + root + 'assets/img/logo-mark.svg" alt="" width="50" height="50">' +
            '<span class="brand-text"><span class="brand-ar">مداري</span><span class="brand-en">MADARI</span></span>' +
          "</a>" +
          '<nav class="main-nav" id="main-nav" aria-label="Main">' +
            '<span class="nav-indicator" aria-hidden="true"></span>' +
            H.primary.map(link).join("") +
            '<div class="nav-drop">' +
              '<button type="button" aria-expanded="false" aria-haspopup="true"' + (inDrop ? ' class="active"' : "") + ">" + H.solutions + caret + "</button>" +
              '<div class="drop-panel" role="menu">' + dropLinks + "</div>" +
            "</div>" +
            link(H.contact) +
          "</nav>" +
          '<div class="nav-actions">' +
            '<a class="lang-switch" href="' + otherLang + '" hreflang="' + (lang === "ar" ? "en" : "ar") + '" title="' + H.langName + '">' + globe + T.langLabel + "</a>" +
            '<a class="btn btn-gold" href="contact.html#request">' + T.cta + "</a>" +
            '<button class="menu-toggle" aria-label="' + T.menu + '" aria-controls="mobile-menu" aria-expanded="false"><span></span></button>' +
          "</div>" +
        "</div></div>" +
      "</header>" +
      '<div class="mobile-menu" id="mobile-menu" aria-hidden="true">' +
        "<nav>" + mobileLinks + "</nav>" +
        '<div class="mm-foot">' +
          '<a class="btn btn-gold" href="contact.html#request">' + T.cta + "</a>" +
          '<div class="mm-contact"><a class="ltr" href="mailto:' + CONTACT.email + '">' + CONTACT.email + '</a><a class="ltr" href="' + CONTACT.phoneHref + '">' + CONTACT.phoneDisplay + '</a><a href="' + otherLang + '">' + H.langName + "</a></div>" +
        "</div>" +
      "</div>";

    var header = document.getElementById("top-header");
    var nav = header.querySelector(".main-nav");
    var indicator = header.querySelector(".nav-indicator");
    var drop = header.querySelector(".nav-drop");
    var dropBtn = drop.querySelector("button");
    var toggle = header.querySelector(".menu-toggle");
    var progress = document.getElementById("scroll-progress");
    var mobile = document.getElementById("mobile-menu");

    /* sliding gold indicator */
    var items = Array.prototype.slice.call(nav.querySelectorAll(":scope > a, .nav-drop > button"));
    var current = items.filter(function (el) { return el.classList.contains("active"); })[0];
    function moveTo(el) {
      items.forEach(function (i) { i.classList.remove("hl"); });
      if (!el) { indicator.style.opacity = "0"; return; }
      indicator.style.left = (el.offsetLeft + (el.parentElement !== nav ? el.parentElement.offsetLeft : 0)) + "px";
      indicator.style.width = el.offsetWidth + "px";
      indicator.style.opacity = "1";
      el.classList.add("hl");
    }
    items.forEach(function (el) {
      el.addEventListener("mouseenter", function () { moveTo(el); });
      el.addEventListener("focus", function () { moveTo(el); });
    });
    nav.addEventListener("mouseleave", function () { moveTo(current); });
    function syncIndicator() { if (getComputedStyle(nav).display !== "none") moveTo(current); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncIndicator);
    window.addEventListener("resize", syncIndicator);
    setTimeout(syncIndicator, 60);

    /* solutions dropdown */
    var closeTimer;
    function setDrop(open) { drop.classList.toggle("open", open); dropBtn.setAttribute("aria-expanded", open ? "true" : "false"); }
    drop.addEventListener("mouseenter", function () { clearTimeout(closeTimer); setDrop(true); });
    drop.addEventListener("mouseleave", function () { closeTimer = setTimeout(function () { setDrop(false); }, 180); });
    dropBtn.addEventListener("click", function () { setDrop(!drop.classList.contains("open")); });
    document.addEventListener("click", function (e) { if (!drop.contains(e.target)) setDrop(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDrop(false); closeMobile(); } });

    /* mobile menu */
    function closeMobile() {
      document.body.classList.remove("nav-open"); document.body.style.overflow = "";
      toggle.setAttribute("aria-expanded", "false"); mobile.setAttribute("aria-hidden", "true");
    }
    toggle.addEventListener("click", function () {
      var open = !document.body.classList.contains("nav-open");
      if (!open) { closeMobile(); return; }
      document.body.classList.add("nav-open"); document.body.style.overflow = "hidden";
      toggle.setAttribute("aria-expanded", "true"); mobile.setAttribute("aria-hidden", "false");
      header.classList.remove("is-hidden");
    });
    mobile.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMobile); });

    /* scroll: condense into floating capsule, hide on scroll down, reveal on scroll up */
    var lastY = window.scrollY, ticking = false;
    function onScroll() {
      var y = window.scrollY;
      var scrolled = y > 40;
      header.classList.toggle("scrolled", scrolled);
      document.body.classList.toggle("is-scrolled", scrolled);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ")";
      var menuOpen = document.body.classList.contains("nav-open") || drop.classList.contains("open");
      if (!menuOpen && y > 320 && y - lastY > 6) header.classList.add("is-hidden");
      else if (lastY - y > 6 || y <= 320) header.classList.remove("is-hidden");
      lastY = y; ticking = false;
    }
    onScroll();
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
  }

  /* ---------- Footer ---------- */
  function buildFooter() {
    var mount = document.getElementById("site-footer");
    if (!mount) return;
    var nav = T.nav;
    var li = function (pair) { var h = pair[0] === "index" ? "index.html" : pair[0] + ".html"; return '<li><a href="' + h + '">' + pair[1] + "</a></li>"; };
    var linksA = [nav[0], nav[1], nav[2], nav[3], nav[4]].map(li).join("");
    var linksB = [nav[5], nav[6], nav[7], nav[8]].map(li).join("");
    var year = new Date().getFullYear();
    mount.outerHTML =
      '<footer class="site-footer">' +
        '<div class="container">' +
          '<div class="footer-top">' +
            '<div class="footer-brand">' +
              '<a class="brand" href="index.html"><img src="' + root + 'assets/img/logo-mark.svg" alt="" width="52" height="52"><span class="brand-text"><span class="brand-ar">مداري</span><span class="brand-en">MADARI</span></span></a>' +
              "<p>" + T.footerAbout + "</p>" +
              '<p class="parent">' + T.parentLabel + " <b>" + T.parent + "</b></p>" +
              '<p class="footer-slogan">' + T.slogan + "</p>" +
            "</div>" +
            "<div><h4>" + T.colLinks + "</h4><ul>" + linksA + "</ul></div>" +
            "<div><h4>" + T.colSolutions + "</h4><ul>" + linksB + "</ul></div>" +
            "<div><h4>" + T.colContact + "</h4><ul>" +
              '<li><a class="ltr" href="mailto:' + CONTACT.email + '">' + CONTACT.email + "</a></li>" +
              '<li><a class="ltr" href="' + CONTACT.phoneHref + '">' + CONTACT.phoneDisplay + "</a></li>" +
              '<li><a href="' + CONTACT.whatsapp + '" target="_blank" rel="noopener">' + T.wa + "</a></li>" +
              "<li>" + T.location + "</li>" +
            "</ul></div>" +
          "</div>" +
          '<div class="footer-bottom"><span>© ' + year + " " + T.rights + "</span><nav>" +
            T.legal.map(function (l) { return '<a href="' + l[0] + '">' + l[1] + "</a>"; }).join("") +
          "</nav></div>" +
        "</div>" +
      "</footer>" +
      '<div class="mobile-cta" id="mobile-cta"><div class="wrap">' +
        '<a class="btn btn-gold" href="contact.html#request">' + T.cta + " " + icon("arrow") + "</a>" +
        '<a class="btn wa" href="' + CONTACT.whatsapp + '" target="_blank" rel="noopener" aria-label="' + T.wa + '" style="--bg:#1f7a55;--bd:#1f7a55"><span style="width:22px;height:22px;display:block">' + icon("whatsapp") + "</span></a>" +
      "</div></div>";

    var mcta = document.getElementById("mobile-cta");
    var onScroll = function () { mcta.classList.toggle("show", window.scrollY > window.innerHeight * 0.6); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Icons & contact placeholders ---------- */
  function fillIcons() {
    document.querySelectorAll("[data-icon]").forEach(function (el) { el.innerHTML = icon(el.getAttribute("data-icon")); });
    document.querySelectorAll("[data-contact]").forEach(function (el) {
      var k = el.getAttribute("data-contact");
      if (k === "email") { el.textContent = CONTACT.email; el.href = "mailto:" + CONTACT.email; }
      if (k === "phone") { el.textContent = CONTACT.phoneDisplay; el.href = CONTACT.phoneHref; }
      if (k === "whatsapp") { el.href = CONTACT.whatsapp; }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function reveal() {
    var els = document.querySelectorAll(".reveal, .process");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in", "in-view"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in", "in-view"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Background videos: only download on larger screens with data to spare ---------- */
  function loadVideos() {
    var conn = navigator.connection || {};
    var light = window.matchMedia("(max-width: 760px)").matches || conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("video").forEach(function (v) {
      var sources = v.querySelectorAll("source[data-src]");
      if (!sources.length || light) return; // poster image stays visible on phones / data-saver
      sources.forEach(function (s) { s.src = s.getAttribute("data-src"); });
      v.load(); // autoplay / the visibility observer below take it from here
    });
  }

  /* ---------- Hero video: pause when hidden, respect reduced motion ---------- */
  function videos() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("video[data-autoplay]").forEach(function (v) {
      v.muted = true;
      if (reduce) { v.removeAttribute("autoplay"); v.pause(); return; }
      if (!("IntersectionObserver" in window)) return;
      new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); } });
      }).observe(v);
    });
  }

  /* ---------- Package preselect from URL ---------- */
  function preselect() {
    var params = new URLSearchParams(location.search);
    ["package", "service"].forEach(function (k) {
      var v = params.get(k);
      if (!v) return;
      var sel = document.querySelector('select[name="' + k + '"]');
      if (sel) { Array.prototype.forEach.call(sel.options, function (o) { if (o.value === v) sel.value = v; }); }
    });
  }

  /* ---------- Forms ---------- */
  function forms() {
    document.querySelectorAll("form.js-form").forEach(function (form) {
      var status = form.querySelector(".form-status");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); if (status) { status.className = "form-status err"; status.textContent = T.required; } return; }
        var btn = form.querySelector('button[type="submit"]');
        var label = btn.innerHTML;
        btn.disabled = true; btn.textContent = T.sending;
        var data = new FormData(form);
        data.append("lang", lang);
        data.append("page", location.pathname);

        fetch(root + "send.php", { method: "POST", body: data, headers: { "Accept": "application/json" } })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (!res || !res.ok) throw new Error("send failed");
            form.innerHTML = '<div class="form-success">' + icon("check") + "<h3>" + T.thanksTitle + "</h3><p class=\"muted\">" + T.thanks + "</p></div>";
            form.scrollIntoView({ behavior: "smooth", block: "center" });
          })
          .catch(function () {
            var lines = [];
            data.forEach(function (v, k) { if (k !== "website" && k !== "lang" && k !== "page" && String(v).trim()) lines.push(k + ": " + v); });
            var subject = "MADARI — " + (data.get("service") || data.get("package") || "Request");
            window.location.href = "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
            if (status) { status.className = "form-status err"; status.textContent = T.fallback; }
            btn.disabled = false; btn.innerHTML = label;
          });
      });
    });
  }

  buildHeader();
  buildFooter();
  fillIcons();
  preselect();
  if (!window.MADARI_MOTION) reveal();
  loadVideos();
  videos();
  forms();
})();
