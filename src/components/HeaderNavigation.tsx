import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/ui/mobile-nav';
import { NFL_SEASON } from '@/utils/constants';
import { useAuth } from '@/contexts/auth-context';
import UserMenu from '@/components/UserMenu';

const navigationItems = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/how-to', label: 'How to Use' },
  { path: '/export', label: 'Export & AI' },
];

// Returns the current NFL week if we're in regular season or playoffs;
// returns null during the offseason (no league data → don't fake "LIVE").
const getLiveNflWeek = (now: Date = new Date()): number | null => {
  const month = now.getMonth();
  const day = now.getDate();

  // In-season window: Sept 1 → Feb 14 (covers regular season + playoffs).
  const inSeason = month >= 8 || month === 0 || (month === 1 && day <= 14);
  if (!inSeason) return null;

  // Jan / early Feb belong to the previous calendar year's season.
  const seasonYear = month <= 1 ? now.getFullYear() - 1 : now.getFullYear();
  const seasonStart = new Date(
    seasonYear,
    NFL_SEASON.SEASON_START_MONTH,
    NFL_SEASON.SEASON_START_DAY,
  );
  const diffDays = Math.floor(
    (now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24),
  );
  const week = Math.floor((diffDays + 2) / 7) + 1;
  return Math.min(Math.max(week, NFL_SEASON.MIN_WEEK), NFL_SEASON.MAX_WEEKS);
};

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
            <>
              <Link
                to="/auth"
                className="hidden md:inline-flex font-headline font-bold uppercase text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontSize: 12, letterSpacing: '0.15em' }}
              >
                Sign In
              </Link>
              <Link
                to="/"
                className="bg-primary text-primary-foreground font-headline font-bold uppercase hover:bg-primary-glow transition-colors flex items-center"
                style={{
                  padding: '0 22px',
                  height: 44,
                  fontSize: 14,
                  letterSpacing: '0.15em',
                  clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)',
                }}
              >
                HIT THE FIELD →
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderNavigation;
