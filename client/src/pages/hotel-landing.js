
// Hotel Landing Page JavaScript

// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Initialize functionality
    initContactForm();
    initSmoothScrolling();
    initFloatingCTA();
    initAnimations();
    initAnalytics();
});

// Contact Form Handling
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Basic validation
        if (!data.name || !data.company || !data.email) {
            showNotification('Vul alle verplichte velden in.', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showNotification('Voer een geldig e-mailadres in.', 'error');
            return;
        }
        
        // Track form submission
        trackEvent('hotel_contact_form_submit', {
            company: data.company,
            email: data.email
        });
        
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'VERSTUREN...';
        submitButton.disabled = true;
        
        // Simulate form submission (replace with actual endpoint)
        setTimeout(() => {
            showNotification('Bedankt! We nemen binnen 2 uur contact met je op.', 'success');
            form.reset();
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }, 1500);
        
        // In production, replace above with actual form submission:
        /*
        fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showNotification('Bedankt! We nemen binnen 2 uur contact met je op.', 'success');
                form.reset();
            } else {
                showNotification('Er ging iets mis. Probeer het opnieuw.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Er ging iets mis. Probeer het opnieuw.', 'error');
        })
        .finally(() => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        });
        */
    });
}

// Smooth Scrolling for Anchor Links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Track CTA clicks
                const cta = this.textContent.trim();
                if (cta.includes('CONTACT') || cta.includes('Contact')) {
                    trackEvent('hotel_cta_click', {
                        location: this.closest('section')?.className || 'unknown',
                        cta_text: cta
                    });
                }
            }
        });
    });
}

// Floating CTA Visibility
function initFloatingCTA() {
    const floatingCTA = document.querySelector('.floating-cta');
    const contactSection = document.getElementById('contact');
    
    if (!floatingCTA || !contactSection) return;
    
    window.addEventListener('scroll', function() {
        const contactRect = contactSection.getBoundingClientRect();
        const isContactVisible = contactRect.top < window.innerHeight && contactRect.bottom > 0;
        
        if (isContactVisible) {
            floatingCTA.style.opacity = '0';
            floatingCTA.style.pointerEvents = 'none';
        } else {
            floatingCTA.style.opacity = '1';
            floatingCTA.style.pointerEvents = 'auto';
        }
    });
}

// Scroll Animations
function initAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.problem-card, .solution-card, .testimonial-card, .usp-item').forEach(el => {
        observer.observe(el);
    });
    
    // Counter animation for impact number
    const impactNumber = document.querySelector('.impact-number');
    if (impactNumber) {
        const impactObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target, 25000);
                    impactObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        impactObserver.observe(impactNumber);
    }
}

// Counter Animation
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString('nl-NL') + '+';
    }, 20);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease-out;
        ${type === 'success' ? 'background-color: #059669;' : 'background-color: #dc2626;'}
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .notification-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }
    `;
    
    if (!document.querySelector('#notification-styles')) {
        style.id = 'notification-styles';
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Analytics Tracking
function trackEvent(eventName, properties = {}) {
    // Google Analytics 4 tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
    
    // Facebook Pixel tracking
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', eventName, properties);
    }
    
    // Console log for development
    console.log('Event tracked:', eventName, properties);
}

// Phone Click Tracking
document.addEventListener('click', function(e) {
    const target = e.target.closest('a[href^="tel:"]');
    if (target) {
        trackEvent('hotel_phone_click', {
            phone_number: target.getAttribute('href').replace('tel:', ''),
            location: target.closest('section')?.className || 'unknown'
        });
    }
});

// WhatsApp Click Tracking
document.addEventListener('click', function(e) {
    const target = e.target.closest('a[href*="wa.me"]');
    if (target) {
        trackEvent('hotel_whatsapp_click', {
            location: target.closest('section')?.className || 'unknown'
        });
    }
});

// Scroll Depth Tracking
let scrollDepthTracked = [];
window.addEventListener('scroll', function() {
    const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    
    [25, 50, 75, 90].forEach(threshold => {
        if (scrollPercent >= threshold && !scrollDepthTracked.includes(threshold)) {
            scrollDepthTracked.push(threshold);
            trackEvent('scroll_depth', {
                depth_percentage: threshold
            });
        }
    });
});

// Page Load Tracking
window.addEventListener('load', function() {
    trackEvent('page_load', {
        page_title: document.title,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        referrer: document.referrer
    });
});

// Exit Intent Tracking (Desktop only)
if (!('ontouchstart' in window)) {
    document.addEventListener('mouseout', function(e) {
        if (e.clientY <= 0) {
            trackEvent('exit_intent', {
                time_on_page: Math.round((Date.now() - performance.timing.navigationStart) / 1000)
            });
        }
    });
}

// Form Field Focus Tracking
document.addEventListener('focus', function(e) {
    if (e.target.matches('#contactForm input, #contactForm textarea')) {
        trackEvent('form_field_focus', {
            field_name: e.target.name || e.target.id,
            field_type: e.target.type || 'textarea'
        });
    }
}, true);

// Hotel Logo Click Tracking (if logos are clickable)
document.addEventListener('click', function(e) {
    const target = e.target.closest('.logo-placeholder');
    if (target) {
        trackEvent('hotel_logo_click', {
            logo_name: target.textContent.trim()
        });
    }
});

// Social Proof Interaction Tracking
document.addEventListener('click', function(e) {
    const testimonialCard = e.target.closest('.testimonial-card');
    if (testimonialCard) {
        trackEvent('testimonial_click', {
            testimonial_author: testimonialCard.querySelector('.testimonial-author')?.textContent || 'unknown'
        });
    }
});

// Performance Monitoring
window.addEventListener('load', function() {
    // Wait a bit for all resources to load
    setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
            trackEvent('page_performance', {
                load_time: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                dom_content_loaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                first_paint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)
            });
        }
    }, 1000);
});

// Error Tracking
window.addEventListener('error', function(e) {
    trackEvent('javascript_error', {
        error_message: e.message,
        error_filename: e.filename,
        error_line: e.lineno,
        error_column: e.colno
    });
});

// Utility Functions
function isMobile() {
    return window.innerWidth <= 768;
}

function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function getDeviceType() {
    if (isMobile()) return 'mobile';
    if (isTablet()) return 'tablet';
    return 'desktop';
}

// Track device type on load
trackEvent('device_info', {
    device_type: getDeviceType(),
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight
});
