/*
 * Mensuração e consentimento (LGPD).
 * - Cookies necessários: apenas a escolha de consentimento (localStorage).
 * - Mensuração e publicidade: Meta Pixel, carregado somente após autorização.
 * Eventos ficam em fila até a decisão do visitante; se ele recusar, a fila é descartada.
 * Cada evento marcado como `once` é enviado no máximo uma vez por carregamento de página.
 */
(function () {
  "use strict";

  var cfg = (window.WECARE_CONFIG || {}).pixel || {};
  var KEY = "wecare_consent";
  var VERSION = 2; // aumente para pedir o consentimento novamente após mudar a política
  var queue = [];
  var sent = {};
  var pixelReady = false;

  window.dataLayer = window.dataLayer || [];

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      return v && v.v === VERSION ? v : null;
    } catch (e) { return null; }
  }
  function write(ads) {
    var v = { v: VERSION, ads: !!ads, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* modo privado */ }
    return v;
  }

  function loadPixel() {
    if (pixelReady || !cfg.id) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("init", cfg.id);
    window.fbq("track", "PageView");
    pixelReady = true;
  }

  function dispatch(evt) {
    if (pixelReady && window.fbq) {
      if (evt.standard) window.fbq("track", evt.name, evt.params);
      else window.fbq("trackCustom", evt.name, evt.params);
    }
    window.dataLayer.push(Object.assign({ event: evt.name }, evt.params));
  }

  function allowed() {
    if (!cfg.requireConsent) return true;
    var c = read();
    return !!(c && c.ads);
  }

  function apply(consent) {
    if (consent.ads) {
      loadPixel();
      while (queue.length) dispatch(queue.shift());
    } else {
      queue.length = 0;
      // revogação: remove os cookies do Meta Pixel já gravados neste domínio
      ["_fbp", "_fbc"].forEach(function (n) {
        document.cookie = n + "=; Max-Age=0; path=/";
        document.cookie = n + "=; Max-Age=0; path=/; domain=." + location.hostname.replace(/^www\./, "");
      });
    }
    document.dispatchEvent(new CustomEvent("wecare:consent", { detail: consent }));
  }

  /**
   * @param {string} name
   * @param {object} [params]
   * @param {{standard?: boolean, once?: boolean}} [opts]
   */
  function track(name, params, opts) {
    opts = opts || {};
    if (opts.once) {
      if (sent[name]) return;
      sent[name] = true;
    }
    var evt = { name: name, params: params || {}, standard: !!opts.standard };
    if (allowed()) { loadPixel(); dispatch(evt); return; }
    if (!read()) queue.push(evt); // ainda sem decisão: aguarda
  }

  function init() {
    var bar = document.querySelector("[data-consent]");
    var dialog = document.querySelector("[data-consent-dialog]");
    var adsBox = document.querySelector("[data-pref-ads]");
    var current = read();

    function decide(ads) {
      var c = write(ads);
      if (bar) bar.hidden = true;
      if (dialog && dialog.open) dialog.close();
      apply(c);
    }
    function openPrefs() {
      var c = read();
      if (adsBox) adsBox.checked = !!(c && c.ads);
      if (dialog && dialog.showModal) dialog.showModal();
    }

    if (!cfg.requireConsent) { loadPixel(); }
    else if (current) { apply(current); }
    else if (bar) { bar.hidden = false; }

    if (bar) {
      bar.querySelector("[data-consent-accept]").addEventListener("click", function () { decide(true); });
      bar.querySelector("[data-consent-deny]").addEventListener("click", function () { decide(false); });
      bar.querySelector("[data-consent-custom]").addEventListener("click", openPrefs);
    }
    if (dialog) {
      dialog.querySelector("[data-prefs-save]").addEventListener("click", function () { decide(adsBox && adsBox.checked); });
      dialog.querySelector("[data-prefs-deny]").addEventListener("click", function () { decide(false); });
    }
    document.querySelectorAll("[data-consent-open]").forEach(function (b) {
      b.addEventListener("click", openPrefs);
    });
  }

  window.WeCareTrack = { track: track, consent: read };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
