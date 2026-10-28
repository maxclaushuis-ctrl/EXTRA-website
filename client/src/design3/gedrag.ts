/**
 * Het gedrag uit de mock-up van design 3.0 als React-hooks: carrousels,
 * kopteksten die zich aan de breedte aanpassen, sticky stapels en confetti.
 * Alles werkt op de gerenderde DOM, net als de scripts in de mock-up, en
 * ruimt zichzelf op bij het verlaten van de pagina.
 */
import { useEffect, type RefObject } from "react";

const zacht = (): ScrollBehavior =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/** Review-carrousel: één slide per scherm, met teller en stippen. */
export function useCarrousel(ref: RefObject<HTMLElement>, deps: unknown[] = []) {
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const sp = c.querySelector<HTMLElement>(".spoor");
    if (!sp) return;
    const teller = c.querySelector<HTMLElement>(".teller");
    const stw = c.querySelector<HTMLElement>(".stippen");
    const aantal = () => sp.children.length;
    const nu = () => Math.round(sp.scrollLeft / Math.max(1, sp.clientWidth));
    const ga = (i: number) => {
      const n = aantal();
      if (!n) return;
      i = (i + n) % n;
      sp.scrollTo({ left: i * sp.clientWidth, behavior: zacht() });
    };
    const opruimen: (() => void)[] = [];
    if (stw) {
      stw.innerHTML = "";
      for (let i = 0; i < aantal(); i++) {
        const d = document.createElement("i");
        if (!i) d.className = "aan";
        const klik = () => ga(i);
        d.addEventListener("click", klik);
        stw.appendChild(d);
      }
    }
    const bij = () => {
      const i = nu();
      if (teller) teller.innerHTML = `<b>${i + 1}</b> / ${aantal()}`;
      if (stw) Array.from(stw.children).forEach((d, j) => d.classList.toggle("aan", i === j));
    };
    bij();
    const vorige = c.querySelector(".vorige");
    const volgende = c.querySelector(".volgende");
    const v = () => ga(nu() - 1);
    const w = () => ga(nu() + 1);
    const toets = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); ga(nu() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); ga(nu() - 1); }
    };
    vorige?.addEventListener("click", v);
    volgende?.addEventListener("click", w);
    sp.addEventListener("scroll", bij, { passive: true });
    sp.addEventListener("keydown", toets);
    opruimen.push(() => {
      vorige?.removeEventListener("click", v);
      volgende?.removeEventListener("click", w);
      sp.removeEventListener("scroll", bij);
      sp.removeEventListener("keydown", toets);
    });
    return () => opruimen.forEach((f) => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Horizontaal spoor met kaarten (functies, scorekaarten). Bediening zit in
 * een apart element (bijv. .fbedien of .scbedien) binnen dezelfde sectie.
 */
export function useSpoor(ref: RefObject<HTMLElement>, spoorSel: string, bedienSel: string, klikOpKop = false) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const sp = root.querySelector<HTMLElement>(spoorSel);
    const bed = root.querySelector<HTMLElement>(bedienSel);
    if (!sp) return;
    const sl = Array.from(sp.children) as HTMLElement[];
    const t = bed?.querySelector<HTMLElement>(".teller b");
    const stap = () => (sl[1] ? sl[1].offsetLeft - sl[0].offsetLeft : sp.clientWidth);
    const nu = () => Math.round(sp.scrollLeft / Math.max(1, stap()));
    const ga = (i: number) => {
      i = Math.max(0, Math.min(sl.length - 1, i));
      sp.scrollTo({ left: i * stap(), behavior: zacht() });
    };
    const vorige = bed?.querySelector(".vorige");
    const volgende = bed?.querySelector(".volgende");
    const v = () => ga(nu() - 1);
    const w = () => ga(nu() + 1);
    const scroll = () => { if (t) t.textContent = String(nu() + 1); };
    const toets = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); ga(nu() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); ga(nu() - 1); }
    };
    const koppen: [HTMLElement, () => void][] = [];
    if (klikOpKop) {
      sl.forEach((s, i) => {
        const h = s.querySelector<HTMLElement>("h3");
        if (!h) return;
        const f = (e: Event) => { if ((e.target as HTMLElement).closest("a")) return; ga(i + 1); };
        h.addEventListener("click", f);
        koppen.push([h, f as () => void]);
      });
    }
    vorige?.addEventListener("click", v);
    volgende?.addEventListener("click", w);
    sp.addEventListener("scroll", scroll, { passive: true });
    sp.addEventListener("keydown", toets);
    return () => {
      vorige?.removeEventListener("click", v);
      volgende?.removeEventListener("click", w);
      sp.removeEventListener("scroll", scroll);
      sp.removeEventListener("keydown", toets);
      koppen.forEach(([h, f]) => h.removeEventListener("click", f));
    };
  }, [ref, spoorSel, bedienSel, klikOpKop]);
}

/** Grote slotkop die de breedte van zijn kolom vult. */
export function useReus(ref: RefObject<HTMLElement>, factor = 0.55) {
  useEffect(() => {
    const h = ref.current;
    if (!h) return;
    const fit = () => {
      const smal = window.innerWidth < 761;
      const doel = (h.parentElement?.clientWidth ?? 0) * (smal ? 0.94 : factor);
      h.style.fontSize = "100px";
      let w = 0;
      h.querySelectorAll("span").forEach((s) => { w = Math.max(w, s.getBoundingClientRect().width); });
      if (w) h.style.fontSize = (100 * doel) / w + "px";
    };
    fit();
    window.addEventListener("resize", fit);
    // De lettertypen komen met de CSS van de pagina mee en kunnen dus na de
    // eerste meting binnenkomen: dan opnieuw passen.
    document.fonts?.ready.then(fit).catch(() => {});
    document.fonts?.addEventListener?.("loadingdone", fit);
    return () => {
      window.removeEventListener("resize", fit);
      document.fonts?.removeEventListener?.("loadingdone", fit);
    };
  }, [ref, factor]);
}

/**
 * Dekeffect bij stapels en de kleurovergang naar Kortingsacties. Het vlak dat
 * wordt bedekt krijgt --dek (0 tot 1), de branchekleur krijgt --kleur. Dit
 * stond eerst op benoemde scroll-timelines met timeline-scope; Safari kent
 * die niet en toonde daardoor meteen de eindstand (wazig, grijs, geen kleur).
 * De voortgang volgt dezelfde "entry"-reeks als die timelines.
 */
export function useDekking(ref: RefObject<HTMLElement>, deps: unknown[] = []) {
  useEffect(() => {
    const r = ref.current;
    if (!r || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    type Paar = { doelen: HTMLElement[]; dekker: HTMLElement; van: number; tot: number; varNaam: string; attr: string };
    const paren: Paar[] = [];
    const volgende = (el: HTMLElement) => {
      let n = el.nextElementSibling as HTMLElement | null;
      while (n && n.classList.contains("stapel-pauze")) n = n.nextElementSibling as HTMLElement | null;
      return n;
    };
    r.querySelectorAll<HTMLElement>(".stapel > .loon, .stapel2 > .vacs").forEach((el) => {
      const d = volgende(el);
      if (d) paren.push({ doelen: [el], dekker: d, van: 0, tot: 1, varNaam: "--dek", attr: "data-dek" });
    });
    const deals = r.querySelector<HTMLElement>(".deals.deals-kleur");
    if (deals) {
      const doelen = [deals, ...Array.from(r.querySelectorAll<HTMLElement>(".dag.dag-roze"))];
      paren.push({ doelen, dekker: deals, van: 0.25, tot: 0.85, varNaam: "--kleur", attr: "data-kleur" });
    }
    if (!paren.length) return;
    let wacht = 0;
    const zet = () => {
      wacht = 0;
      const vh = window.innerHeight;
      paren.forEach((p) => {
        const b = p.dekker.getBoundingClientRect();
        const entry = (vh - b.top) / Math.max(1, Math.min(b.height, vh));
        const v = Math.min(1, Math.max(0, (entry - p.van) / (p.tot - p.van)));
        p.doelen.forEach((el) => {
          if (v > 0) { el.setAttribute(p.attr, ""); el.style.setProperty(p.varNaam, v.toFixed(3)); }
          else { el.removeAttribute(p.attr); el.style.removeProperty(p.varNaam); }
        });
      });
    };
    const plan = () => { if (!wacht) wacht = window.requestAnimationFrame(zet); };
    zet();
    window.addEventListener("scroll", plan, { passive: true });
    window.addEventListener("resize", plan);
    return () => {
      window.removeEventListener("scroll", plan);
      window.removeEventListener("resize", plan);
      if (wacht) window.cancelAnimationFrame(wacht);
      paren.forEach((p) => p.doelen.forEach((el) => { el.removeAttribute(p.attr); el.style.removeProperty(p.varNaam); }));
    };
  }, [ref, ...deps]);
}

/** Sticky sectie die langer is dan het scherm: plakt pas als de onderkant in beeld is. */
export function useStapelTop(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const zet = () => { el.style.top = Math.min(0, window.innerHeight - el.offsetHeight) + "px"; };
    zet();
    window.addEventListener("resize", zet);
    document.fonts?.ready.then(zet).catch(() => {});
    const t = window.setTimeout(zet, 600);
    return () => { window.removeEventListener("resize", zet); window.clearTimeout(t); };
  }, [ref]);
}

/** Confetti achter het dagbetaling-beeld. */
export function useConfetti(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const c = ref.current;
    if (!c || c.childElementCount) return;
    const kl = ["#EBD0E4", "#CEDBBC", "#C7DFF4", "#37352C", "#EBD0E4", "#CEDBBC", "#C7DFF4"];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement("i");
      const w = 6 + Math.random() * 7;
      const h = Math.random() < 0.5 ? w : w * 2.2;
      p.style.cssText = `left:${Math.random() * 100}%;width:${w}px;height:${h}px;background:${kl[i % kl.length]};border-radius:${Math.random() < 0.3 ? "50%" : "2px"};animation-duration:${5 + Math.random() * 5}s;animation-delay:-${Math.random() * 10}s;--dx:${Math.random() * 120 - 60}px;--r:${360 + Math.random() * 720}deg`;
      c.appendChild(p);
    }
  }, [ref]);
}
