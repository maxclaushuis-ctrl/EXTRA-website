import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import WebsiteStatsTab from '@/pages/dashboard/WebsiteStatsTab';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <div className="bg-white min-h-screen"><WebsiteStatsTab /></div>
  </QueryClientProvider>
);
