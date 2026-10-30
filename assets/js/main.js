/*
 * Interações da landing page Metodologia WeCare.
 */
(function () {
  "use strict";

  var cfg = window.WECARE_CONFIG || {};

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

  /* ---------- Representante (/w1, /w2...) ---------- */
  var reps = cfg.reps || {};
  var repKey = (location.pathname.match(/^\/(w\d+)\/?$/i) || [])[1];
  repKey = repKey && repKey.toLowerCase();
  try {
    if (reps[repKey]) sessionStorage.setItem("wecare_rep", repKey);
    // voltando das páginas legais, mantém o representante da visita
    else if (document.referrer.indexOf(location.origin) === 0) repKey = sessionStorage.getItem("wecare_rep");
  } catch (e) {}
  var rep = reps[repKey] || null;
  window.WECARE_REP = rep ? repKey : "";

  var wa = cfg.whatsapp || {};
  if (rep) {
    wa = { number: rep.number, message: wa.message };
    document.querySelectorAll("[data-rep]").forEach(function (el) {
      el.querySelector("[data-rep-name]").textContent = rep.name;
      el.hidden = false;
    });
    document.querySelectorAll("[data-wa].btn").forEach(function (a) {
      a.textContent = "Falar com " + rep.name;
    });
  }

  /* ---------- WhatsApp ---------- */
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
        origin: a.getAttribute("data-wa-origin") || "",
        rep: window.WECARE_REP
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

  var videoWrap = document.querySelector("[data-video-wrap]");
  var frame = document.querySelector("[data-video]");

  /* ---------- Vídeo: progresso, mini player e tela final ---------- */
  var watch = document.querySelector("[data-watch]");
  var ring = document.querySelector("[data-ring]");
  var ringFill = document.querySelector("[data-ring-fill]");
  var ringTrack = document.querySelector("[data-ring-track]");

  /* Contorno do vídeo que se completa conforme a apresentação é assistida.
     O traçado começa no meio da borda superior e segue no sentido horário. */
  function drawRing() {
    if (!ring || !frame) return;
    var w = frame.clientWidth, h = frame.clientHeight;
    var r = parseFloat(getComputedStyle(frame).borderTopLeftRadius) || 0;
    var o = 3; // a linha fica um pouco por fora da borda do vídeo
    var W = w + o * 2, H = h + o * 2, R = Math.min(r + o, W / 2, H / 2);
    ring.setAttribute("viewBox", "0 0 " + W + " " + H);
    var d = "M" + W / 2 + " 1.5" +
      " H" + (W - R) + " A" + (R - 1.5) + " " + (R - 1.5) + " 0 0 1 " + (W - 1.5) + " " + R +
      " V" + (H - R) + " A" + (R - 1.5) + " " + (R - 1.5) + " 0 0 1 " + (W - R) + " " + (H - 1.5) +
      " H" + R + " A" + (R - 1.5) + " " + (R - 1.5) + " 0 0 1 1.5 " + (H - R) +
      " V" + R + " A" + (R - 1.5) + " " + (R - 1.5) + " 0 0 1 " + R + " 1.5 Z";
    ringFill.setAttribute("d", d);
    ringTrack.setAttribute("d", d);
  }
  function setRing(pct) {
    if (ringFill) ringFill.style.strokeDashoffset = String(100 - Math.min(Math.max(pct, 0), 100));
  }
  if (ring && "ResizeObserver" in window) new ResizeObserver(drawRing).observe(frame);
  drawRing();
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
      if (ring) ring.classList.add("is-active");
    }
    if (d.type === "pause") playing = false;
    if (d.type === "progress" && !finished) {
      setRing(d.pct);
      if (watchText) watchText.textContent = "Você assistiu " + Math.floor(d.pct) + "% da apresentação";
    }
    if (d.type === "ended") {
      playing = false;
      finished = true;
      setRing(100);
      if (watch) watch.classList.add("is-done");
      if (watchText) watchText.textContent = "Apresentação concluída. Fale com um especialista.";
      if (endScreen) endScreen.hidden = false;
    }
    updateDock();
  });

})();
