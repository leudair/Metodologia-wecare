/*
 * Interações da landing page Metodologia WeCare.
 */
(function () {
  "use strict";

  var cfg = window.WECARE_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };

  /* ---------- Logo: fallback textual se o arquivo oficial não carregar ---------- */
  document.querySelectorAll("[data-logo]").forEach(function (img) {
    function fallback() {
      var span = document.createElement("span");
      span.className = "logo-fallback";
      span.setAttribute("role", "img");
      span.setAttribute("aria-label", "Agência WeCare Digital");
      span.innerHTML = "We<b>Care</b>";
      (img.closest("picture") || img).replaceWith(span);
    }
    if (img.complete && img.naturalWidth === 0) fallback();
    else img.addEventListener("error", fallback, { once: true });
  });

  /* ---------- Links configuráveis ---------- */
  var links = cfg.links || {};
  document.querySelectorAll("[data-link]").forEach(function (a) {
    var url = links[a.getAttribute("data-link")];
    if (url) a.href = url;
  });
  document.querySelectorAll("[data-ig-handle]").forEach(function (el) {
    if (links.instagramHandle) el.textContent = links.instagramHandle;
  });
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- WhatsApp ---------- */
  var wa = cfg.whatsapp || {};
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    if (wa.number) {
      a.href = "https://wa.me/" + wa.number.replace(/\D/g, "") + "?text=" + encodeURIComponent(wa.message || "");
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.href = "#faq";
    }
    a.addEventListener("click", function () {
      if (!window.WeCareTrack) return;
      window.WeCareTrack.track("Contact", {
        content_name: "Metodologia WeCare",
        origin: a.getAttribute("data-wa-origin") || ""
      }, { standard: true });
    });
  });

  /* ---------- Galeria institucional: remove imagens ausentes ---------- */
  var gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    var figures = Array.prototype.slice.call(gallery.querySelectorAll("figure"));
    var pending = figures.length;
    var done = function () {
      pending -= 1;
      if (pending > 0) return;
      var count = gallery.querySelectorAll("figure").length;
      if (!count) {
        gallery.remove();
        var about = document.querySelector(".about");
        if (about) about.classList.add("about--solo");
      } else {
        gallery.setAttribute("data-count", String(count));
      }
    };
    figures.forEach(function (fig) {
      var img = fig.querySelector("img");
      img.loading = "eager";
      if (img.complete) {
        if (img.naturalWidth === 0) fig.remove();
        done();
        return;
      }
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", function () { fig.remove(); done(); }, { once: true });
    });
  }

  /* ---------- Animações de entrada ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [];
        var index = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = clamp(index, 0, 4) * 80 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Efeitos ligados à rolagem ---------- */
  var videoWrap = document.querySelector("[data-video-wrap]");
  var frame = document.querySelector("[data-video]");
  var stage = document.querySelector("[data-stage]");
  var phone = stage && stage.querySelector(".phone");
  var mobile = window.matchMedia("(max-width: 760px)").matches;

  function onScroll() {
    var vh = window.innerHeight;
    // vídeo: começa inclinado e "deita" na tela conforme entra
    if (videoWrap && frame && !frame.classList.contains("is-docked")) {
      var r = videoWrap.getBoundingClientRect();
      var p = clamp((vh - r.top) / (vh * 0.75), 0, 1);
      frame.style.setProperty("--vx", ((1 - p) * (mobile ? 10 : 18)).toFixed(2) + "deg");
      frame.style.setProperty("--vs", (0.92 + p * 0.08).toFixed(3));
    }
    // celular: gira de lado para frente
    if (phone) {
      var s = stage.getBoundingClientRect();
      var q = clamp((vh - s.top) / (vh * 0.9), 0, 1);
      phone.style.setProperty("--py", ((1 - q) * -28 + 6 * q - 6).toFixed(2) + "deg");
      phone.style.setProperty("--px", ((1 - q) * 14 + 4 * q).toFixed(2) + "deg");
    }
  }
  if (!reduceMotion) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  /* ---------- Cartões 3D com brilho seguindo o cursor ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-tilt-card]").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((x - 0.5) * 14).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - y) * 10).toFixed(2) + "deg");
        card.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* ---------- Vídeo: progresso, mini player e tela final ---------- */
  var watch = document.querySelector("[data-watch]");
  var fill = document.querySelector("[data-watch-fill]");
  var watchText = document.querySelector("[data-watch-text]");
  var endScreen = document.querySelector("[data-video-end]");
  var playing = false;
  var dockDismissed = false;
  var wrapVisible = true;
  var finished = false;

  function updateDock() {
    if (!frame) return;
    var dock = playing && !wrapVisible && !dockDismissed;
    frame.classList.toggle("is-docked", dock);
    if (videoWrap) videoWrap.classList.toggle("is-docking", dock);
    if (!dock) onScroll();
  }

  if (videoWrap && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      wrapVisible = entries[0].isIntersecting;
      updateDock();
    }, { threshold: 0.25 }).observe(videoWrap);
  }

  var undock = document.querySelector("[data-video-undock]");
  if (undock) undock.addEventListener("click", function () { dockDismissed = true; updateDock(); });

  var endClose = document.querySelector("[data-video-end-close]");
  if (endClose) endClose.addEventListener("click", function () { endScreen.hidden = true; });

  document.addEventListener("wecare:video", function (e) {
    var d = e.detail;
    if (d.type === "play") {
      playing = true;
      if (endScreen) endScreen.hidden = true;
      if (watch) watch.classList.add("is-active");
    }
    if (d.type === "pause") playing = false;
    if (d.type === "progress" && fill && !finished) {
      fill.style.width = d.pct.toFixed(1) + "%";
      if (watchText) watchText.textContent = "Você assistiu " + Math.floor(d.pct) + "% da apresentação";
    }
    if (d.type === "ended") {
      playing = false;
      finished = true;
      if (fill) fill.style.width = "100%";
      if (watch) watch.classList.add("is-done");
      if (watchText) watchText.textContent = "Apresentação concluída. Fale com um especialista.";
      if (endScreen) endScreen.hidden = false;
    }
    updateDock();
  });

  /* ---------- Etapas + mockup ---------- */
  var stepsRoot = document.querySelector("[data-steps]");
  if (stepsRoot) {
    var list = stepsRoot.querySelector(".steps");
    var buttons = stepsRoot.querySelectorAll("[data-step]");
    var chips = stepsRoot.querySelectorAll("[data-chip]");
    var screen = stepsRoot.querySelector("[data-phone-step]");
    var counters = stepsRoot.querySelectorAll("[data-count]");
    var counted = false;
    var current = 1;
    var timer = null;

    var countUp = function () {
      if (counted) return;
      counted = true;
      counters.forEach(function (el) {
        var target = parseInt(el.getAttribute("data-count"), 10);
        if (reduceMotion) { el.textContent = target.toLocaleString("pt-BR"); return; }
        var start = null;
        var step = function (t) {
          if (!start) start = t;
          var p = Math.min((t - start) / 1400, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString("pt-BR");
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };

    var activate = function (n) {
      current = n;
      buttons.forEach(function (b) {
        var on = Number(b.getAttribute("data-step")) === n;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      chips.forEach(function (c) { c.classList.toggle("is-on", Number(c.getAttribute("data-chip")) === n); });
      screen.setAttribute("data-phone-step", String(n));
      if (n >= 2) countUp();
    };

    var stop = function () { clearInterval(timer); timer = null; list.classList.remove("is-auto"); };
    var start = function () {
      if (reduceMotion || timer) return;
      list.classList.add("is-auto");
      timer = setInterval(function () { activate(current % buttons.length + 1); }, 4500);
    };

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        stop();
        activate(Number(b.getAttribute("data-step")));
      });
    });

    activate(1);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.4 }).observe(stepsRoot);
    }
  }
})();
