/*
 * Player do vídeo principal com eventos de visualização.
 * O player só é carregado após o clique (fachada leve), garantindo
 * reprodução com áudio por interação do usuário e carregamento inicial rápido.
 *
 * Eventos (enviados uma vez por página):
 *   MetodologiaVideoPlay, MetodologiaVideo10, MetodologiaVideo25,
 *   MetodologiaVideo50, MetodologiaVideo75, MetodologiaVideo100
 *
 * Os marcos usam o tempo efetivamente assistido (saltos na linha do tempo
 * não contam), evitando registrar conclusão sem consumo real do conteúdo.
 */
(function () {
  "use strict";

  var cfg = (window.WECARE_CONFIG || {}).video || {};
  var MILESTONES = [10, 25, 50, 75, 100];

  function track(name, params) {
    if (window.WeCareTrack) window.WeCareTrack.track(name, params, { once: true });
  }

  // avisa a interface (barra de progresso, mini player, tela final)
  function emit(type, pct) {
    document.dispatchEvent(new CustomEvent("wecare:video", { detail: { type: type, pct: pct || 0 } }));
  }

  function createProgress() {
    var watched = 0;
    var last = null;
    var reached = {};
    var started = false;
    var base = { video_title: cfg.title || "Metodologia WeCare", video_provider: cfg.provider };

    return {
      play: function () {
        if (!started) { started = true; track("MetodologiaVideoPlay", base); }
        emit("play");
      },
      pause: function () { emit("pause"); },
      ended: function () { emit("ended", 100); },
      // chamado periodicamente com o tempo atual e a duração
      tick: function (current, duration) {
        if (!duration || !isFinite(duration)) return;
        if (last !== null) {
          var delta = current - last;
          if (delta > 0 && delta < 2.5) watched += delta; // ignora saltos
        }
        last = current;
        var pct = (watched / duration) * 100;
        emit("progress", Math.min(pct, 100));
        MILESTONES.forEach(function (m) {
          // 100% aceita pequena margem para créditos/arredondamento do player
          var target = m === 100 ? 97 : m;
          if (!reached[m] && pct >= target) {
            reached[m] = true;
            track("MetodologiaVideo" + m, Object.assign({ percent: m }, base));
          }
        });
      },
      seek: function () { last = null; }
    };
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  /* ---------- HTML5 ---------- */
  function mountHtml5(frame, progress) {
    var v = document.createElement("video");
    v.src = cfg.src;
    if (cfg.poster) v.poster = cfg.poster;
    v.controls = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.setAttribute("title", cfg.title || "");
    frame.appendChild(v);

    v.addEventListener("play", progress.play);
    v.addEventListener("timeupdate", function () { progress.tick(v.currentTime, v.duration); });
    v.addEventListener("seeking", progress.seek);
    v.addEventListener("pause", function () { if (!v.ended) progress.pause(); });
    v.addEventListener("ended", function () { progress.tick(v.duration, v.duration); progress.ended(); });

    var p = v.play();
    if (p && p.catch) p.catch(function () { /* o usuário usa os controles */ });
  }

  /* ---------- YouTube ---------- */
  function mountYouTube(frame, progress) {
    var holder = document.createElement("div");
    frame.appendChild(holder);

    var ready = window.YT && window.YT.Player
      ? Promise.resolve()
      : new Promise(function (resolve) {
          var prev = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = function () { if (prev) prev(); resolve(); };
          loadScript("https://www.youtube.com/iframe_api");
        });

    ready.then(function () {
      var timer = null;
      var player = new window.YT.Player(holder, {
        videoId: cfg.id,
        host: "https://www.youtube-nocookie.com",
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: function (e) {
            var S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              progress.play();
              clearInterval(timer);
              timer = setInterval(function () {
                progress.tick(player.getCurrentTime(), player.getDuration());
              }, 500);
            } else {
              clearInterval(timer);
              if (e.data === S.ENDED) { progress.tick(player.getDuration(), player.getDuration()); progress.ended(); }
              else { progress.seek(); if (e.data === S.PAUSED) progress.pause(); }
            }
          }
        }
      });
      player.getIframe && frame.querySelector("iframe") && frame.querySelector("iframe").setAttribute("title", cfg.title || "");
    });
  }

  /* ---------- Vimeo ---------- */
  function mountVimeo(frame, progress) {
    var iframe = document.createElement("iframe");
    iframe.src = "https://player.vimeo.com/video/" + encodeURIComponent(cfg.id) + "?autoplay=1&dnt=1&title=0&byline=0&portrait=0";
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.title = cfg.title || "";
    frame.appendChild(iframe);

    loadScript("https://player.vimeo.com/api/player.js").then(function () {
      var player = new window.Vimeo.Player(iframe);
      player.on("play", progress.play);
      player.on("timeupdate", function (d) { progress.tick(d.seconds, d.duration); });
      player.on("seeked", progress.seek);
      player.on("pause", progress.pause);
      player.on("ended", function (d) { progress.tick(d.duration, d.duration); progress.ended(); });
    });
  }

  function isConfigured() {
    if (cfg.provider === "html5") return !!cfg.src;
    return !!cfg.id;
  }

  function init() {
    var frame = document.querySelector("[data-video]");
    if (!frame) return;
    var cover = frame.querySelector("[data-video-play]");
    var poster = frame.querySelector("[data-poster]");

    if (cfg.poster && poster) poster.src = cfg.poster;
    if (poster) poster.addEventListener("error", function () { poster.remove(); });

    if (!isConfigured()) {
      cover.disabled = true;
      cover.style.cursor = "default";
      cover.querySelector(".video__label").textContent = "Vídeo em configuração";
      return;
    }

    cover.addEventListener("click", function () {
      var progress = createProgress();
      cover.remove();
      if (cfg.provider === "youtube") mountYouTube(frame, progress);
      else if (cfg.provider === "vimeo") mountVimeo(frame, progress);
      else mountHtml5(frame, progress);
    }, { once: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
