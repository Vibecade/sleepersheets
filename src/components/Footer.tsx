import React from 'react';
import { Link } from 'react-router-dom';

type ColumnLink = { label: string; to?: string; href?: string };

const productLinks: ColumnLink[] = [
  { label: 'How to Use', to: '/how-to' },
  { label: 'About', to: '/about' },
  { label: 'Export & AI', to: '/export' },
];

const legalLinks: ColumnLink[] = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Cookie Policy', to: '/cookies' },
];

const socialLinks: ColumnLink[] = [
  { label: 'X / Twitter', href: 'https://x.com/dustybeerbong' },
];

const renderLink = (l: ColumnLink) => {
  const cls =
    'text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-[13px]';
  if (l.href) {
    return (
      <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {l.label}
      </a>
    );
  }
  return (
    <Link key={l.label} to={l.to ?? '/'} className={cls}>
      {l.label}
    </Link>
  );
};

const Column: React.FC<{ title: string; links: ColumnLink[] }> = ({ title, links }) => (
  <div>
    <div
      className="font-headline font-bold text-primary mb-4"
      style={{ fontSize: 12, letterSpacing: '0.2em' }}
    >
      {title}
    </div>
    <div className="flex flex-col gap-2">{links.map(renderLink)}</div>
  </div>
);

const Footer: React.FC = () => (
  <footer className="mt-16 border-t border-border bg-background/50">
    <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-6">
      <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-12 mb-8">
        <div className="col-span-2 md:col-span-1">
          <div
            className="font-headline font-bold text-foreground mb-3"
            style={{ fontSize: 18, letterSpacing: '0.15em' }}
          >
            SLEEPERSHEETS
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            The ultimate salary cap and contract management tool for your fantasy
            football dynasty league.
          </p>
        </div>

        <Column title="PRODUCT" links={productLinks} />
        <Column title="LEGAL" links={legalLinks} />
        <Column title="SOCIAL" links={socialLinks} />
      </div>

      <div
        className="border-t border-border pt-4 flex flex-col sm:flex-row sm:justify-between gap-2 font-mono text-muted-foreground"
        style={{ fontSize: 10, letterSpacing: '0.15em' }}
      >
        <span>© {new Date().getFullYear()} SLEEPERSHEETS · ALL RIGHTS RESERVED</span>
        <span>
          BUILT BY{' '}
          <a
            href="https://x.com/dustybeerbong"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors underline"
          >
            SADPEPE.EXE
          </a>
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
