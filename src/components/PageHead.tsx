
import { useEffect } from 'react';

interface PageHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  leagueName?: string;
}

const PageHead: React.FC<PageHeadProps> = ({
  title,
  description,
  canonicalUrl,
  leagueName
}) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = leagueName 
        ? `${leagueName} - ${title} | SleeperSheets`
        : `${title} | SleeperSheets`;
    } else {
      document.title = 'SleeperSheets - Fantasy Football Salary Cap & Contract Management | Dynasty League Tools';
    }

    // Update meta description
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    } else {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Professional dynasty league management with real-time salary tracking, contract management, trade simulation & advanced analytics. Free fantasy football tools for Sleeper leagues.');
      }
    }

    // Update canonical URL
    if (canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    // Update Open Graph tags
    if (title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', leagueName ? `${leagueName} - ${title}` : title);
      }
    }

    if (description) {
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', description);
      }
    }
  }, [title, description, canonicalUrl, leagueName]);

  return null;
};

export default PageHead;
