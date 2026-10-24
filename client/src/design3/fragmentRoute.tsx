/**
 * Lazy routes voor de inhoudspagina's van design 3.0. Bewust een apart, klein
 * bestand: App.tsx importeert dit statisch, en zo komen het sjabloon, de CSS
 * van design 3.0 en de pagina-inhoud pas mee als zo'n pagina geopend wordt.
 */
import { lazy, type ComponentType } from "react";
import type { FragmentData } from "./Fragment";

const LADERS = import.meta.glob<{ default: FragmentData }>("./paginas/*.ts");

/** Bijv. maakFragmentRoute("dagbetaling") laadt paginas/dagbetaling.ts in het sjabloon. */
export function maakFragmentRoute(sleutel: string): ComponentType<any> {
  return lazy(async () => {
    const laad = LADERS[`./paginas/${sleutel}.ts`];
    if (!laad) throw new Error(`Onbekende pagina: ${sleutel}`);
    const [{ default: FragmentPagina }, { default: d }] = await Promise.all([import("./Fragment"), laad()]);
    return { default: () => <FragmentPagina d={d} /> };
  });
}
