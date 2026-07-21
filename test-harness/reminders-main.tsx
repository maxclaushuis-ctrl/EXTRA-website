import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { CrmRemindersTab } from '@/components/crm/CrmModule';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <CrmRemindersTab onOpenCompany={(id) => console.log('[harness] open bedrijf', id)} />
    <Toaster />
  </QueryClientProvider>
);
