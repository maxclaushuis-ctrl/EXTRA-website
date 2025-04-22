import { useAnalytics } from "@/hooks/use-analytics";

export default function Footer() {
  const { trackEvent } = useAnalytics();
  
  const handleSocialClick = (platform: string) => {
    trackEvent({
      name: "social_click",
      properties: { platform }
    });
  };
  
  return (
    <footer className="bg-[hsl(var(--primary))] py-6 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          <svg className="h-6 mb-4" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 5H100C111.046 5 120 13.9543 120 25C120 36.0457 111.046 45 100 45H20C8.95431 45 0 36.0457 0 25C0 13.9543 8.95431 5 20 5Z" fill="white"/>
            <path d="M16.936 28.816H29.296V33H11.512V17.064H16.936V28.816ZM47.4273 17.064V33H41.9913V26.44H36.1353V33H30.6993V17.064H36.1353V22.288H41.9913V17.064H47.4273ZM62.7544 33L60.7384 28.816H60.4904H56.6904V33H51.2664V17.064H60.4904C62.2797 17.064 63.8184 17.4053 65.1064 18.088C66.4157 18.7707 67.4237 19.72 68.1304 20.936C68.8371 22.152 69.1904 23.528 69.1904 25.064C69.1904 26.6 68.8371 27.976 68.1304 29.192C67.4237 30.3867 66.4051 31.32 65.0744 31.992L67.7544 33H62.7544ZM63.7544 25.064C63.7544 24.0667 63.4757 23.304 62.9184 22.776C62.3611 22.2267 61.5384 21.952 60.4504 21.952H56.6904V28.176H60.4504C61.5384 28.176 62.3611 27.9013 62.9184 27.352C63.4757 26.8027 63.7544 26.04 63.7544 25.064ZM87.3865 17.064L80.1465 33H73.3865L66.1465 17.064H72.1145L76.7865 28.296L81.4745 17.064H87.3865Z" fill="#7E3FF2"/>
          </svg>
          
          <div className="flex space-x-4 mb-4">
            <a 
              href="https://twitter.com/extra" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => handleSocialClick("twitter")}
              className="hover:text-[hsl(var(--accent))] transition"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </a>
            <a 
              href="https://instagram.com/extra" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => handleSocialClick("instagram")}
              className="hover:text-[hsl(var(--accent))] transition"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
              </svg>
            </a>
            <a 
              href="https://facebook.com/extra" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => handleSocialClick("facebook")}
              className="hover:text-[hsl(var(--accent))] transition"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
              </svg>
            </a>
          </div>
          
          <div className="text-center text-sm">
            <p className="mb-1">© {new Date().getFullYear()} EXTRA Uitzendbureau. Alle rechten voorbehouden.</p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="hover:underline hover:text-[hsl(var(--accent))]">Privacybeleid</a>
              <a href="#" className="hover:underline hover:text-[hsl(var(--accent))]">Voorwaarden</a>
              <a href="#" className="hover:underline hover:text-[hsl(var(--accent))]">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
