import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'connect' | 'auth' | 'demo') => void;
}

type OptionId = 'connect' | 'auth' | 'demo';

interface PathCard {
  id: OptionId;
  tag: string;
  icon: string;
  title: string;
  desc: string;
  cta: string;
  primary?: boolean;
}

const cards: PathCard[] = [
  {
    id: 'connect',
    tag: 'SMART DETECTION',
    icon: '⊕',
    title: 'Connect Your League',
    desc: 'Enter your League ID or Username to get started instantly.',
    cta: 'CONNECT',
    primary: true,
  },
  {
    id: 'auth',
    tag: 'FULL ACCESS',
    icon: '⌬',
    title: 'Sign In to Manage',
    desc: 'Create an account to save and manage multiple leagues.',
    cta: 'SIGN IN',
  },
  {
    id: 'demo',
    tag: 'NO SETUP',
    icon: '▶',
    title: 'Try a Demo League',
    desc: 'Explore features with a sample dynasty league.',
    cta: 'EXPLORE',
  },
];

const GetStartedModal: React.FC<GetStartedModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
}) => {
  const handleSelect = (id: OptionId) => {
    onClose();
    setTimeout(() => onSelectOption(id), 150);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl p-0 bg-card border-border"
        style={{ borderTop: '3px solid hsl(var(--primary))' }}
      >
        <div className="px-6 pt-10 pb-6 sm:px-10 text-center">
          <div
            className="font-mono text-[11px] font-semibold text-primary mb-3"
            style={{ letterSpacing: '0.25em' }}
          >
            ● CHOOSE YOUR PATH
          </div>
          <DialogTitle
            asChild
          >
            <h2
              className="font-headline font-bold uppercase text-foreground m-0"
              style={{
                fontSize: 'clamp(28px, 4.5vw, 48px)',
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              How will you
              <br />
              <span className="text-primary">kick off?</span>
            </h2>
          </DialogTitle>
          <p className="mt-4 text-sm text-muted-foreground">
            Pick the path that matches your setup. You can always switch later.
          </p>
        </div>

        <div className="px-6 pb-10 sm:px-10 grid grid-cols-1 md:grid-cols-3 gap-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="p-5 sm:p-6 flex flex-col"
              style={{
                background: 'hsl(var(--card-light))',
                border: card.primary
                  ? '1px solid hsl(var(--primary))'
                  : '1px solid hsl(var(--border))',
                position: 'relative',
              }}
            >
              {card.primary && (
                <span
                  aria-hidden
                  className="absolute -top-px left-0 right-0 bg-primary"
                  style={{ height: 2 }}
                />
              )}
              <div className="flex items-start justify-between mb-6">
                <div
                  className="flex items-center justify-center font-headline font-bold"
                  style={{
                    width: 44,
                    height: 44,
                    fontSize: 22,
                    background: card.primary ? 'hsl(var(--primary))' : 'hsl(var(--background))',
                    color: card.primary ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))',
                    border: card.primary ? 'none' : '1px solid hsl(var(--border-light))',
                  }}
                >
                  {card.icon}
                </div>
                <span
                  className="font-mono font-bold"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    padding: '3px 8px',
                    background: card.primary ? 'hsl(var(--primary))' : 'transparent',
                    color: card.primary ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))',
                    border: card.primary ? 'none' : '1px solid hsl(var(--primary) / 0.3)',
                  }}
                >
                  {card.tag}
                </span>
              </div>

              <h3
                className="font-headline font-bold uppercase text-foreground m-0 mb-2"
                style={{ fontSize: 22, letterSpacing: '0.02em', lineHeight: 1.05 }}
              >
                {card.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                {card.desc}
              </p>

              <button
                onClick={() => handleSelect(card.id)}
                className="font-headline font-bold uppercase cursor-pointer transition-colors"
                style={{
                  fontSize: 13,
                  letterSpacing: '0.15em',
                  padding: '12px 16px',
                  background: card.primary ? 'hsl(var(--primary))' : 'transparent',
                  color: card.primary
                    ? 'hsl(var(--primary-foreground))'
                    : 'hsl(var(--foreground))',
                  border: card.primary ? 'none' : '1px solid hsl(var(--border-light))',
                  clipPath: card.primary
                    ? 'polygon(6% 0, 100% 0, 94% 100%, 0 100%)'
                    : undefined,
                }}
              >
                {card.cta} →
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GetStartedModal;
