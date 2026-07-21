import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import SalesFlowTab from '@/pages/dashboard/SalesFlowTab';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <SalesFlowTab />
    <Toaster />
  </QueryClientProvider>
);
