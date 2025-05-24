
import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-16 py-8 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 text-center">
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
      </div>
    </footer>
  );
};

export default Footer;
