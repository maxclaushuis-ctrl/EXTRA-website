import React, { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { BellIcon, CheckIcon, InfoIcon, AlertCircleIcon } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { connected, notifications, clearNotifications } = useWebSocket();
  const { toast } = useToast();

  // Toon een toast voor elke nieuwe notificatie
  useEffect(() => {
    if (notifications.length > 0) {
      // Haal de meest recente notificatie op
      const notification = notifications[notifications.length - 1];
      
      // Bepaal het type icon op basis van het type notificatie
      let Icon = InfoIcon;
      let variant: 'default' | 'destructive' | null = 'default';
      
      if (notification.type.includes('earned')) {
        Icon = CheckIcon;
      } else if (notification.type.includes('alert')) {
        Icon = AlertCircleIcon;
        variant = 'destructive';
      } else if (notification.type.includes('redeemed')) {
        Icon = BellIcon;
      }

      // Toon de toast
      toast({
        title: 'Notificatie',
        description: notification.message,
        variant: variant || undefined,
      });
    }
  }, [notifications, toast, clearNotifications]);

  // We retourneren hier geen UI componenten, enkel een indicator of we verbonden zijn
  return connected ? <span className="hidden">Verbonden met notificatie service</span> : null;
};

export default NotificationToast;