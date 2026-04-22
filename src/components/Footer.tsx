import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-border/70 bg-background/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 rounded-3xl border border-border/70 bg-gradient-to-r from-primary/8 via-background/70 to-secondary/10 p-5 sm:p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
          <p className="text-sm sm:text-base text-foreground/90 font-medium">
            SleeperSheets is focused on league management, not monetized ad placements.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Fast, clean, and built for commissioners and managers who want fewer distractions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_0.9fr_0.9fr] mb-6">
          <div>
            <h3 className="text-foreground font-display tracking-[0.04em] text-2xl mb-3">SleeperSheets</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              The ultimate salary cap and contract management tool for your fantasy football dynasty league.
            </p>
          </div>
          
          <div>
            <h3 className="text-foreground font-semibold mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/how-to" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">
                How to Use
              </Link>
              <Link to="/about" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">
                About
              </Link>
              <Link to="/export" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">
                Export & AI
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-foreground font-semibold mb-3">Legal</h3>
            <div className="space-y-2">
              <Link to="/privacy" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border/70 pt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Built by{' '}
            <a 
              href="https://x.com/dustybeerbong" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground/80 hover:text-foreground transition-colors underline"
            >
              Sadpepe.exe
            </a>
          </p>
          <p className="text-muted-foreground/80 text-xs mt-2">
            © {new Date().getFullYear()} SleeperSheets. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
