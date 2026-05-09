import React from 'react';

const editorial = [
  {
    tag: 'DYNASTY · KEEPER',
    title: 'Built for the long haul.',
    body:
      'Track contracts, dead cap, and long-term payroll strategy without spreadsheets. Multi-year contract templates, rookie scale tracking, and offseason planning views built in.',
  },
  {
    tag: 'REDRAFT · WEEKLY',
    title: 'Fast week-to-week ops.',
    body:
      'Measure trends, compare teams, and export league data for weekly recaps. Live sync with Sleeper means waiver moves and lineups update without a refresh.',
  },
];

const SocialProofSection: React.FC = () => {
  return (
    <section className="relative py-8 sm:py-12">
      {/* Editorial split */}
      <div className="flex items-baseline gap-4 mb-6 sm:mb-8">
        <div
          className="font-mono text-[10px] sm:text-[11px] font-semibold text-primary"
          style={{ letterSpacing: '0.25em' }}
        >
          ● 02 / FOR THE SERIOUS
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {editorial.map((x) => (
          <div
            key={x.tag}
            className="bg-card px-6 py-8 sm:px-8 sm:py-10 border-t-2 border-primary"
          >
            <div
              className="font-mono text-[10px] font-bold text-primary mb-3"
              style={{ letterSpacing: '0.2em' }}
            >
              {x.tag}
            </div>
            <h3
              className="font-headline font-bold uppercase text-foreground m-0 mb-4"
              style={{
                fontSize: 'clamp(24px, 3.5vw, 32px)',
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              {x.title}
            </h3>
            <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed m-0">
              {x.body}
            </p>
          </div>
        ))}
      </div>

      {/* Manifesto */}
      <div className="mt-10 sm:mt-12 bg-card px-6 py-10 sm:px-10 sm:py-12 border-l-4 border-primary">
        <div
          className="font-mono text-[10px] font-bold text-primary mb-4"
          style={{ letterSpacing: '0.2em' }}
        >
          ● THE PROMISE
        </div>
        <div
          className="font-headline font-bold uppercase text-foreground"
          style={{
            fontSize: 'clamp(22px, 3.5vw, 36px)',
            letterSpacing: '-0.005em',
            lineHeight: 1.15,
          }}
        >
          No ads. No upsells. No tracking blocks in your league workflow.{' '}
          <span className="text-muted-foreground">
            Just commissioner tools that respect your time and your league's integrity.
          </span>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
