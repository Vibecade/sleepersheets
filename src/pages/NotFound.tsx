import { Compass, Home, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHead from '@/components/PageHead';

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <PageHead
        title="Page Not Found"
        description="The page you requested could not be found."
      />

      <header className="page-hero">
        <div className="page-hero-backdrop" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="page-hero-icon bg-gradient-to-br from-secondary to-secondary-glow">
              <Compass className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-tech uppercase tracking-[0.24em] text-primary/80 mb-2">
                Navigation Error
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display text-white tracking-[0.04em] mb-2">
                Route Not Found
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-3xl">
                SleeperSheets could not match <span className="text-foreground">{location.pathname}</span> to a live route.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <Card className="page-panel bg-card/75 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl font-display tracking-[0.04em]">Where to go next</CardTitle>
            <CardDescription className="text-base">
              The link may be outdated, mistyped, or tied to an earlier route structure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-border/60 bg-background/30 px-4 py-4 text-sm text-muted-foreground">
              Try returning to the landing page, reconnecting your league, or opening the how-to guide if you were following an older bookmark.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link to="/">
                  <Home className="w-4 h-4" />
                  Return Home
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/how-to">
                  <Search className="w-4 h-4" />
                  Open How-to Guide
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotFound;
