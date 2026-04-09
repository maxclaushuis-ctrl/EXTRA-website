import { useCallback } from "react";

interface PageViewEvent {
  path: string;
  variant?: string;
  [key: string]: any;
}

interface TrackEvent {
  name: string;
  properties?: Record<string, any>;
}

export function useAnalytics() {
  // Track page view
  const trackPageView = useCallback((data: PageViewEvent) => {
    // In a real implementation, you would use Google Analytics or another analytics service
    console.log("Page View:", data);
    
    // Example implementation with Google Analytics (if it was added to the page)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'G-097EFEQ8YN', {
        page_path: data.path,
        page_title: document.title,
        page_variant: data.variant || 'default'
      });
    }
  }, []);
  
  // Track custom event
  const trackEvent = useCallback((event: TrackEvent) => {
    // In a real implementation, you would use Google Analytics or another analytics service
    console.log("Event:", event.name, event.properties);
    
    // Example implementation with Google Analytics (if it was added to the page)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, event.properties);
    }
  }, []);
  
  // Track conversion
  const trackConversion = useCallback((data: Record<string, any>) => {
    // In a real implementation, you would use Google Analytics or another analytics service
    console.log("Conversion:", data);
    
    // Example implementation with Google Analytics (if it was added to the page)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        send_to: 'GA-TRACKING-ID/CONVERSION-ID',
        ...data
      });
    }
  }, []);
  
  return {
    trackPageView,
    trackEvent,
    trackConversion
  };
}
