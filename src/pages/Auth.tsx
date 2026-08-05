import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Shield, Trophy, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import PageHead from '@/components/PageHead';

const AUTH_BENEFITS = [
  'Claim league ownership for protected edits',
  'Lock salary and contract settings to your account',
  'Keep commissioner and roster management data in sync',
];

const Auth = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      toast({
        title: 'Sign In Error',
        description: 'Failed to sign in with Google. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHead
        title="Sign In"
        description="Sign in to SleeperSheets to claim league ownership and manage protected salary cap data."
        canonicalUrl="https://sleepersheets.com/auth"
      />

      <header className="page-hero">
        <div className="page-hero-backdrop" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="page-hero-icon bg-gradient-to-br from-primary to-primary-glow">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-tech uppercase tracking-[0.24em] text-primary/80 mb-2">
                  Account Access
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display text-white tracking-[0.04em] mb-2">
                  Protect Your League
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-3xl">
                  Sign in once to claim league ownership, keep management actions tied to your account, and prevent accidental edits from the wrong user.
                </p>
              </div>
            </div>

            <Button asChild variant="ghost" className="self-start">
              <Link to="/">
                <Trophy className="w-4 h-4" />
                Return Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="page-panel bg-card/70 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-display tracking-[0.04em]">What sign-in unlocks</CardTitle>
              <CardDescription className="text-base">
                SleeperSheets stays read-only until the right user claims league ownership.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {AUTH_BENEFITS.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/35 px-4 py-3"
                >
                  <Users className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-sm sm:text-base text-foreground/90">{benefit}</p>
                </div>
              ))}

              <div className="rounded-2xl border border-border/60 bg-background/25 px-4 py-4 text-sm text-muted-foreground">
                Authentication only covers protected league actions. Viewing league data and exports remains available without sign-in.
              </div>
            </CardContent>
          </Card>

          <Card className="page-panel bg-card/80 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-display tracking-[0.04em]">Continue with Google</CardTitle>
              <CardDescription className="text-base">
                Use the same Google account you want tied to commissioner and ownership actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full h-12 sm:h-14 justify-center text-sm sm:text-base border-border/70 bg-background/40 hover:bg-background/55"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="rounded-2xl border border-border/60 bg-background/25 px-4 py-4 text-sm text-muted-foreground">
                By signing in, you are authenticating league-management actions. No public route or viewing flow changes here.
              </div>

              <Button asChild variant="ghost" className="w-full justify-center">
                <Link to="/">
                  Browse first
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Auth;
