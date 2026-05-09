import React from 'react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const handleSeeDashboard = () => {
    const target = document.getElementById('features-section');
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Verifiable claims, no fake counters.
  const stats = [
    { value: 'FREE', label: 'ALWAYS, NO ADS' },
    { value: 'LIVE', label: 'SLEEPER API SYNC' },
    { value: 'DYNASTY', label: 'KEEPER · REDRAFT' },
    { value: 'OPEN', label: 'NO LOGIN NEEDED' },
  ];

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent 0 80px, hsl(var(--border)) 80px 81px)',
        }}
        aria-hidden
      />

      <div className="relative px-2 sm:px-4 pt-10 pb-8 sm:pt-14 sm:pb-12">
        <div
          className="font-mono text-[10px] sm:text-[11px] font-semibold text-primary mb-3 sm:mb-4"
          style={{ letterSpacing: '0.25em' }}
        >
          ● COMMISSIONER OPS / DYNASTY · KEEPER · REDRAFT
        </div>

        <h1
          className="font-headline font-bold uppercase text-foreground m-0"
          style={{
            fontSize: 'clamp(44px, 10vw, 144px)',
            letterSpacing: '-0.02em',
            lineHeight: 0.88,
          }}
        >
          Run your league
          <br />
          <span className="text-primary">like a franchise.</span>
        </h1>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16 items-start">
          <p className="text-base sm:text-lg leading-relaxed text-foreground max-w-xl m-0">
            One clean workspace for contracts, cap tracking, transactions, and exports.
            Built for commissioners who want speed, clarity, and control —
            without the upsells, ads, or weekly setup tax.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onGetStarted}
                className="flex-1 px-7 py-5 bg-primary text-primary-foreground font-headline text-sm sm:text-base font-bold uppercase cursor-pointer border-0 hover:bg-primary-glow transition-colors"
                style={{
                  letterSpacing: '0.125em',
                  clipPath: 'polygon(6% 0, 100% 0, 94% 100%, 0 100%)',
                }}
              >
                GET STARTED FREE →
              </button>
              <button
                onClick={handleSeeDashboard}
                className="flex-1 px-7 py-5 bg-transparent text-foreground font-headline text-sm sm:text-base font-bold uppercase cursor-pointer border hover:border-primary/60 transition-colors"
                style={{ letterSpacing: '0.125em', borderColor: 'hsl(var(--border-light))' }}
              >
                SEE DASHBOARD
              </button>
            </div>
            <div
              className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] text-muted-foreground"
              style={{ letterSpacing: '0.15em' }}
            >
              <span>● NO CARD REQUIRED</span>
              <span>● 2 MIN SETUP</span>
              <span>● UNLIMITED LEAGUES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip — gap=1px creates the gridlines via parent bg */}
      <div
        className="relative border-y border-border"
        style={{ background: 'hsl(var(--border))' }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-background px-4 py-6 sm:px-6 sm:py-8"
            >
              <div
                className="font-headline font-bold text-foreground"
                style={{
                  fontSize: 'clamp(32px, 5.5vw, 56px)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {s.value}
              </div>
              <div
                className="font-mono font-semibold text-muted-foreground"
                style={{ fontSize: 10, letterSpacing: '0.2em' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
