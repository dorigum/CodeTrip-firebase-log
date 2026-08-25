import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
	return (
		<footer className="flex w-full flex-col items-center justify-center gap-2 border-t border-outline-variant/15 bg-background px-5 py-4 pb-20 text-center md:flex-row md:justify-between md:px-10 md:pb-4">
          <div className="whitespace-nowrap font-label text-[8px] uppercase tracking-[0.12em] text-on-secondary-container opacity-70 sm:text-xs sm:tracking-widest">
            /* © 2026 CodeTrip - System Status: Optimal */
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            <a
              className="font-label text-[10px] uppercase tracking-widest text-on-secondary-container opacity-70 hover:opacity-100 hover:underline sm:text-xs"
              href="https://www.wififree.kr/index.do"
              target="_blank"
              rel="noopener noreferrer"
            >
              Public_Wifi
            </a>
            <a
              className="font-label text-[10px] uppercase tracking-widest text-on-secondary-container opacity-70 hover:opacity-100 hover:underline sm:text-xs"
              href="https://safestay.visitkorea.or.kr/usr/main/mainSelectList.kto"
              target="_blank"
              rel="noopener noreferrer"
            >
              Safestay
            </a>
            <Link
              to="/info"
              className="font-label text-[10px] uppercase tracking-widest text-on-secondary-container opacity-70 hover:opacity-100 hover:underline sm:text-xs"
            >
              Info
            </Link>
          </div>
        </footer>
	);
};

export default Footer;
