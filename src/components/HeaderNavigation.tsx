import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/ui/mobile-nav';
import { useAuth } from '@/contexts/auth-context';
import UserMenu from '@/components/UserMenu';
// Single shared implementation — this file used to carry its own private
// copy of the week math, which could drift from src/utils/nflWeek.ts.
import { getLiveNflWeek } from '@/utils/nflWeek';

const navigationItems = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/how-to', label: 'How to Use' },
  { path: '/export', label: 'Export & AI' },
];

const Brand: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const badge = size === 'sm' ? 32 : 40;
  const word = size === 'sm' ? 18 : 24;
  return (
    <Link to="/" className="inline-flex items-center gap-3">
      <span
        className="bg-primary text-primary-foreground font-headline font-bold flex items-center justify-center"
        style={{
          width: badge,
          height: badge,
          fontSize: badge * 0.55,
          clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
        }}
      >
        S
      </span>
      <span className="flex flex-col leading-none">
        <span
          className="font-headline font-bold text-foreground"
          style={{ fontSize: word, letterSpacing: '0.1em' }}
        >
          SLEEPERSHEETS
        </span>
        <span
          className="font-mono text-muted-foreground mt-1"
          style={{ fontSize: 9, letterSpacing: '0.2em' }}
        >
          LEAGUE OPS · COMMAND CENTER
        </span>
      </span>
    </Link>
  );
};

const LiveDot: React.FC = () => (
  <span
    aria-hidden
    className="inline-block text-primary"
    style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'currentColor',
      animation: 'livePulse 1.6s ease-out infinite',
    }}
  />
);

const HeaderNavigation: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const liveWeek = getLiveNflWeek();

  if (isMobile) {
    return (
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Brand size="sm" />

          <div className="flex items-center gap-2">
            {user && <UserMenu />}
            <MobileNav>
              {navigationItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-4 py-3 font-headline font-bold uppercase border-l-2 transition-colors ${
                      active
                        ? 'text-primary border-primary bg-primary/5'
                        : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                    }`}
                    style={{ fontSize: 14, letterSpacing: '0.125em' }}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {user ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="block w-full text-left px-4 py-3 font-headline font-bold uppercase border-l-2 border-transparent text-secondary hover:text-secondary-glow"
                  style={{ fontSize: 14, letterSpacing: '0.125em' }}
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="block px-4 py-3 font-headline font-bold uppercase border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  style={{ fontSize: 14, letterSpacing: '0.125em' }}
                >
                  Sign In
                </Link>
              )}
            </MobileNav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 lg:px-10 h-[72px] flex items-center gap-8">
        <Brand />

        <nav className="flex items-stretch ml-4">
          {navigationItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 lg:px-5 font-headline font-bold uppercase transition-colors border-b-[3px] -mb-px ${
                  active
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
                style={{ fontSize: 12, letterSpacing: '0.15em', height: 72 }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-5">
          {liveWeek !== null && (
            <span
              className="hidden lg:inline-flex items-center gap-2 font-mono text-muted-foreground"
              style={{ fontSize: 10, letterSpacing: '0.15em' }}
            >
              <LiveDot /> WK {liveWeek} · LIVE
            </span>
          )}
          {user ? (
            <UserMenu />
          ) : (
            // "HIT THE FIELD →" used to live next to "Sign In" here, but it
            // linked to "/" — i.e. the same page the user was already on
            // when they could see this header. The path-picker modal opened
            // by HeroSection's "GET STARTED FREE" button covers the
            // get-started flow; this header just needs the direct
            // sign-in shortcut for returning users.
            <Link
              to="/auth"
              className="font-headline font-bold uppercase text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: 12, letterSpacing: '0.15em' }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderNavigation;
