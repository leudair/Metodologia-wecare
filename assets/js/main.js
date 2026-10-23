/*
 * Interações da landing page Metodologia WeCare.
 */
(function () {
  "use strict";

  var cfg = window.WECARE_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Logo: fallback textual se o arquivo oficial ainda não estiver no projeto ---------- */
  document.querySelectorAll("[data-logo]").forEach(function (img) {
    function fallback() {
      var span = document.createElement("span");
      span.className = "logo-fallback";
      span.setAttribute("role", "img");
      span.setAttribute("aria-label", "Agência WeCare Digital");
      span.innerHTML = "We<b>Care</b>";
      img.replaceWith(span);
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
    var plan = a.getAttribute("data-wa-plan");
    var msg = plan
      ? "Olá! Assisti à apresentação da Metodologia WeCare e quero conhecer a modalidade " + plan + "."
      : (wa.message || "");
    if (wa.number) {
      a.href = "https://wa.me/" + wa.number.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg);
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.href = "#modalidades";
    }
    a.addEventListener("click", function () {
      if (!window.WeCareTrack) return;
      window.WeCareTrack.track("Contact", {
        content_name: plan || "Metodologia WeCare",
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
      img.loading = "eager"; // necessário para detectar arquivos ausentes
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
        el.style.transitionDelay = Math.min(Math.max(index, 0), 4) * 80 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Título 3D: inclinação sutil acompanhando o cursor (desktop) ---------- */
  var tilt = document.querySelector("[data-tilt] .title-3d__main");
  if (tilt && finePointer && !reduceMotion) {
    var raf = null;
    window.addEventListener("pointermove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var x = e.clientX / window.innerWidth - 0.5;
        var y = e.clientY / window.innerHeight - 0.5;
        tilt.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
        tilt.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
        raf = null;
      });
    }, { passive: true });
  }

  /* ---------- Cards: iluminação vermelha acompanhando o cursor ---------- */
  if (finePointer) {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- Etapas + mockup ---------- */
  var stepsRoot = document.querySelector("[data-steps]");
  if (stepsRoot) {
    var buttons = stepsRoot.querySelectorAll("[data-step]");
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
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString("pt-BR");
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
      screen.setAttribute("data-phone-step", String(n));
      if (n >= 2) countUp();
    };

    var stop = function () { clearInterval(timer); timer = null; };
    var start = function () {
      if (reduceMotion || timer) return;
      timer = setInterval(function () { activate(current % buttons.length + 1); }, 4500);
    };

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        stop();
        activate(Number(b.getAttribute("data-step")));
      });
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.4 }).observe(stepsRoot);
    }
  }
})();
