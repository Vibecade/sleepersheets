import { logger } from './logger';
import { apiCache } from './apiCache';

// Resource preloader for critical resources
export class ResourcePreloader {
  private static instance: ResourcePreloader;
  private preloadedResources = new Set<string>();

  static getInstance(): ResourcePreloader {
    if (!ResourcePreloader.instance) {
      ResourcePreloader.instance = new ResourcePreloader();
    }
    return ResourcePreloader.instance;
  }

  // Preload critical CSS
  preloadCSS(href: string): void {
    if (this.preloadedResources.has(href)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  // Preload scripts
  preloadScript(src: string): void {
    if (this.preloadedResources.has(src)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
    this.preloadedResources.add(src);
  }

  // Prefetch pages
  prefetchPage(href: string): void {
    if (this.preloadedResources.has(href)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  // Preconnect to external domains
  preconnect(domain: string): void {
    if (this.preloadedResources.has(domain)) return;
    
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
    this.preloadedResources.add(domain);
  }

  // Initialize critical resource preloading
  initializeCriticalResources(): void {
    // Preconnect to Sleeper API
    this.preconnect('https://api.sleeper.app');
    
    // Prefetch critical pages
    this.prefetchPage('/auth');
    this.prefetchPage('/export');

    // Hydrate long-lived players cache in the background.
    setTimeout(() => {
      void apiCache.warmPlayersCache();
    }, 0);
    
    logger.info('🚀 Critical resources preloaded for better performance');
  }

  // Preload resources on hover (for navigation)
  setupHoverPreloading(): void {
    // Add hover listeners to navigation links
    const navLinks = document.querySelectorAll('a[href^="/"]');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        link.addEventListener('mouseenter', () => {
          this.prefetchPage(href);
        }, { once: true });
      }
    });
  }
}

// Auto-initialize on module load
export const preloader = ResourcePreloader.getInstance();

// Initialize critical resources when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    preloader.initializeCriticalResources();
    setTimeout(() => preloader.setupHoverPreloading(), 1000);
  });
} else {
  preloader.initializeCriticalResources();
  setTimeout(() => preloader.setupHoverPreloading(), 1000);
}
