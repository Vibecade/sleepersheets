import React from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  type?: 'website' | 'article';
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

const SEO: React.FC<SEOProps> = ({ 
  title = 'SleeperSheets - Fantasy Football Salary Cap Management',
  description = 'The ultimate salary cap and contract management tool for your fantasy football dynasty league.',
  type = 'website',
  breadcrumbs
}) => {
  React.useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }
    
    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) {
      ogType.setAttribute('content', type);
    }
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }
    
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description);
    }
    
    // Add breadcrumb structured data if provided
    if (breadcrumbs && breadcrumbs.length > 0) {
      const existingBreadcrumb = document.querySelector('script[data-breadcrumb]');
      if (existingBreadcrumb) {
        existingBreadcrumb.remove();
      }
      
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'name': crumb.name,
          'item': `https://sleepersheets.com${crumb.url}`
        }))
      };
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-breadcrumb', 'true');
      script.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(script);
    }
  }, [title, description, type, breadcrumbs]);
  
  return null;
};

export default SEO;
