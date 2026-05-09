import type { LucideIcon } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PageHead from '@/components/PageHead';
import { cn } from '@/lib/utils';

interface StaticPageLayoutProps {
  title: string;
  description: string;
  headTitle?: string;
  headDescription?: string;
  canonicalUrl?: string;
  eyebrow?: string;
  icon: LucideIcon;
  iconClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

const StaticPageLayout = ({
  title,
  description,
  headTitle,
  headDescription,
  canonicalUrl,
  eyebrow,
  icon: Icon,
  iconClassName,
  contentClassName,
  children,
}: StaticPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <PageHead
        title={headTitle ?? title}
        description={headDescription ?? description}
        canonicalUrl={canonicalUrl}
      />

      <header className="page-hero">
        <div className="page-hero-backdrop" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
          <div className="flex items-start gap-4 sm:gap-5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0 mt-1"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className={cn('page-hero-icon', iconClassName)}>
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[11px] sm:text-xs font-tech uppercase tracking-[0.24em] text-primary/80 mb-2">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display text-white tracking-[0.04em] mb-2">
                {title}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-3xl">
                {description}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className={cn('max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12', contentClassName)}>
        {children}
      </main>
    </div>
  );
};

export default StaticPageLayout;
