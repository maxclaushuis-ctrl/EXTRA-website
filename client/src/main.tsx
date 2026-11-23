// Eerst: de inhoud die de server in #root zette bewaren, vóór React hem vervangt.
import "@/lib/serverHtml";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Design 3.0 meteen meeladen, niet pas met de pagina zelf. Anders staat de
// geprerenderde inhoud uit de server de eerste seconde zonder opmaak in beeld.
// Alle regels hangen onder .d3 of .sf, dus de andere delen van de app merken er niets van.
import "@/design3/d3.css";
import "@/design3/d3-extra.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { bewaarHerkomstEenmalig } from "@/lib/herkomst";

// Suppress the harmless Vite HMR WebSocket error in Replit's environment
// that would otherwise trigger the error overlay
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('string did not match the expected pattern')) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);

// Waar kwam deze bezoeker vandaan? Vastleggen vóór de eerste render, want
// wouter vervangt de URL zodra de app draait en dan is de landingspagina weg.
bewaarHerkomstEenmalig();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <App />
    </TooltipProvider>
  </QueryClientProvider>
);
