/*
 * Pitchdeck-tracker (zie server/pitchdeckTracker.ts).
 * Meldt de opening, telt de tijd dat de pagina echt bekeken wordt en onthoudt
 * de verste slide. Geen cookies, geen IP-adres; de code uit ?k= wijst naar de
 * ontvanger in het dashboard. Draait de server niet mee, dan merkt de lezer niets.
 */
(function () {
  var deck = (location.pathname.split("/")[2] || "").toLowerCase();
  var k = "";
  try { k = new URLSearchParams(location.search).get("k") || ""; } catch (e) {}
  var id = null, sleutel = null, sec = 0, verste = 0, verstuurdSec = -1, verstuurdSlide = -1, laatsteActie = Date.now();
  var STIL = 120000; // na 2 minuten zonder scrollen, tikken of bewegen telt de tijd niet meer

  function slides() {
    return [].slice.call(document.querySelectorAll("main > .slide")).filter(function (s) { return !s.hidden; });
  }

  function meetSlide() {
    var z = slides(), n = 0, grens = innerHeight * 0.6;
    for (var i = 0; i < z.length; i++) if (z[i].getBoundingClientRect().top < grens) n = i + 1;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) n = z.length;
    if (n > verste) verste = n;
  }

  function stuur(beacon) {
    if (!id || (sec === verstuurdSec && verste === verstuurdSlide)) return;
    var data = JSON.stringify({ id: id, sleutel: sleutel, sec: sec, slide: verste });
    verstuurdSec = sec; verstuurdSlide = verste;
    try {
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/pitchdeck/ping", new Blob([data], { type: "application/json" }));
      } else {
        fetch("/api/pitchdeck/ping", { method: "POST", headers: { "Content-Type": "application/json" }, body: data, keepalive: true, credentials: "same-origin" });
      }
    } catch (e) {}
  }

  function actie() { laatsteActie = Date.now(); }
  ["scroll", "keydown", "mousemove", "touchstart", "click"].forEach(function (t) { addEventListener(t, actie, { passive: true }); });
  addEventListener("scroll", meetSlide, { passive: true });

  function start() {
    meetSlide();
    fetch("/api/pitchdeck/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ deck: deck, k: k, slides: slides().length }),
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.id) return;
        id = j.id; sleutel = j.sleutel;
        setInterval(function () {
          if (document.visibilityState === "visible" && Date.now() - laatsteActie < STIL) sec++;
        }, 1000);
        setInterval(function () { stuur(false); }, 15000);
        document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") stuur(true); });
        addEventListener("pagehide", function () { stuur(true); });
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
