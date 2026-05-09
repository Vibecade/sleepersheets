import * as React from 'react';
import { cn } from '@/lib/utils';

interface TurfPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Mono kicker shown above the title, e.g. "● TOP 6 ADVANCE". Adds the leading dot automatically. */
  kicker?: string;
  /** Section title in Oswald uppercase. */
  title?: React.ReactNode;
  /** Use the larger 22px heading instead of the default 17px. */
  big?: boolean;
  /** Right-aligned slot in the panel header (e.g. status chip, filter buttons). */
  action?: React.ReactNode;
  /** Body content. Already padded; pass `noBodyPadding` to opt out. */
  children?: React.ReactNode;
  /** Skip the default 16px body padding (useful for full-bleed children). */
  noBodyPadding?: boolean;
}

/**
 * Turf Field section panel — sharp corners, accent kicker, Oswald title.
 * Mirrors `BPanel` from the design prototype (see VariationB.jsx).
 */
export const TurfPanel = React.forwardRef<HTMLDivElement, TurfPanelProps>(
  ({ kicker, title, action, children, big, className, noBodyPadding, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative bg-card border border-border', className)}
        {...rest}
      >
        {(title || kicker || action) && (
          <div className="flex items-start gap-3 px-5 py-4 border-b border-border">
            <div className="flex-1 min-w-0">
              {kicker && (
                <div
                  className="font-mono text-[9px] sm:text-[10px] font-semibold text-primary mb-1"
                  style={{ letterSpacing: '0.25em' }}
                >
                  {kicker.startsWith('●') ? kicker : `● ${kicker}`}
                </div>
              )}
              {title && (
                <h3
                  className="font-headline font-bold uppercase text-foreground m-0"
                  style={{
                    fontSize: big ? 22 : 17,
                    letterSpacing: '0.05em',
                    lineHeight: 1,
                  }}
                >
                  {title}
                </h3>
              )}
            </div>
            {action && <div className="flex items-center gap-2">{action}</div>}
          </div>
        )}
        <div className={cn(noBodyPadding ? '' : 'p-5')}>{children}</div>
      </div>
    );
  },
);

TurfPanel.displayName = 'TurfPanel';
