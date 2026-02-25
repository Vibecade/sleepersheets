import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-16 py-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 p-5 sm:p-6">
          <p className="text-sm sm:text-base text-foreground/90 font-medium">
            SleeperSheets is focused on league management, not monetized ad placements.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Fast, clean, and built for commissioners and managers who want fewer distractions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <h3 className="text-white font-semibold mb-3">SleeperSheets</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              The ultimate salary cap and contract management tool for your fantasy football dynasty league.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/how-to" className="block text-white/60 hover:text-white text-sm transition-colors">
                How to Use
              </Link>
              <Link to="/about" className="block text-white/60 hover:text-white text-sm transition-colors">
                About
              </Link>
              <Link to="/export" className="block text-white/60 hover:text-white text-sm transition-colors">
                Export & AI
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            <div className="space-y-2">
              <Link to="/privacy" className="block text-white/60 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-white/60 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="block text-white/60 hover:text-white text-sm transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-white/60 text-sm">
            Built by{' '}
            <a 
              href="https://x.com/dustybeerbong" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors underline"
            >
              Sadpepe.exe
            </a>
          </p>
          <p className="text-white/40 text-xs mt-2">
            © {new Date().getFullYear()} SleeperSheets. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
