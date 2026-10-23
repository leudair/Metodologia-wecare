/*
 * Mensuração: consentimento (LGPD), Meta Pixel e dataLayer.
 * Os eventos ficam em fila até o consentimento ser concedido e cada evento
 * de vídeo é enviado no máximo uma vez por carregamento de página.
 */
(function () {
  "use strict";

  var cfg = (window.WECARE_CONFIG || {}).pixel || {};
  var CONSENT_KEY = "wecare_consent";
  var queue = [];
  var sent = {};
  var pixelReady = false;

  window.dataLayer = window.dataLayer || [];

  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function writeConsent(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) { /* modo privado */ }
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
    flush();
  }

  function dispatch(evt) {
    if (pixelReady && window.fbq) {
      if (evt.standard) window.fbq("track", evt.name, evt.params);
      else window.fbq("trackCustom", evt.name, evt.params);
    }
    window.dataLayer.push(Object.assign({ event: evt.name }, evt.params));
  }

  function flush() {
    while (queue.length) dispatch(queue.shift());
  }

  function hasConsent() {
    return !cfg.requireConsent || readConsent() === "granted";
  }

  /**
   * Envia um evento. `once` evita duplicidade na mesma página.
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
    if (hasConsent() && (pixelReady || !cfg.id)) dispatch(evt);
    else if (readConsent() !== "denied") queue.push(evt);
  }

  function initConsent() {
    var bar = document.querySelector("[data-consent]");
    var state = readConsent();

    if (!cfg.requireConsent || state === "granted") { loadPixel(); flush(); return; }
    if (state === "denied" || !bar) return;
    if (!cfg.id) { flush(); return; } // sem Pixel configurado, não há o que consentir

    bar.hidden = false;
    bar.querySelector("[data-consent-accept]").addEventListener("click", function () {
      writeConsent("granted"); bar.hidden = true; loadPixel(); flush();
    });
    bar.querySelector("[data-consent-deny]").addEventListener("click", function () {
      writeConsent("denied"); bar.hidden = true; queue.length = 0;
    });
  }

  window.WeCareTrack = { track: track };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initConsent);
  else initConsent();
})();
