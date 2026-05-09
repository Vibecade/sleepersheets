import React from 'react';

const features = [
  {
    num: '01',
    title: 'Real-Time Salary Tracking',
    desc: 'See cap usage and realistic space instantly. Every roster move stays compliant.',
  },
  {
    num: '02',
    title: 'Contract Management',
    desc: 'Manage terms, years remaining, and dead cap. Import from one place.',
  },
  {
    num: '03',
    title: 'Trade Simulator',
    desc: 'Model trade outcomes before you commit, including cap and roster effects.',
  },
  {
    num: '04',
    title: 'Ownership Protection',
    desc: 'Protect commissioner-level actions with verification controls.',
  },
  {
    num: '05',
    title: 'Advanced Analytics',
    desc: 'Use trend and comparison views to make faster, smarter weekly decisions.',
  },
  {
    num: '06',
    title: 'Data Export & Backup',
    desc: 'Export clean reports for your league chat, docs, or offseason planning.',
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section id="features-section" className="relative py-12 sm:py-16">
      {/* Section kicker rule */}
      <div className="flex items-baseline gap-4 mb-6 sm:mb-8">
        <div
          className="font-mono text-[10px] sm:text-[11px] font-semibold text-primary"
          style={{ letterSpacing: '0.25em' }}
        >
          ● 01 / CORE TOOLS
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>

      <h2
        className="font-headline font-bold uppercase text-foreground m-0 max-w-4xl"
        style={{
          fontSize: 'clamp(32px, 5.5vw, 56px)',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        Everything to run your league.{' '}
        <span className="text-muted-foreground">Nothing else.</span>
      </h2>

      {/* Feature grid — gap=1px draws gridlines via the bg-border parent */}
      <div
        className="mt-8 sm:mt-10 border border-border"
        style={{ background: 'hsl(var(--border))' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px">
          {features.map((f) => (
            <div key={f.num} className="bg-card px-6 py-7 sm:px-7 sm:py-8 relative">
              <div
                className="font-headline font-bold text-primary mb-4"
                style={{ fontSize: 14, letterSpacing: '0.15em' }}
              >
                ● {f.num}
              </div>
              <div
                className="font-headline font-bold uppercase text-foreground mb-3"
                style={{ fontSize: 22, letterSpacing: '0.025em', lineHeight: 1.1 }}
              >
                {f.title}
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
