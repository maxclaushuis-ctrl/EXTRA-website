import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
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
