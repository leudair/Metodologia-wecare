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

  var videoWrap = document.querySelector("[data-video-wrap]");
  var frame = document.querySelector("[data-video]");

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

})();
