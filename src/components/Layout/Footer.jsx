import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
	return (
		<footer className="flex justify-between px-10 w-full mt-auto py-4 bg-background border-t border-outline-variant/15">
          <div className="font-label text-xs uppercase tracking-widest text-on-secondary-container opacity-70">
            /* © 2026 CodeTrip - System Status: Optimal */
          </div>
          <div className="flex gap-6">
            <a
              className="font-label text-xs uppercase tracking-widest text-on-secondary-container opacity-70 hover:opacity-100 hover:underline"
              href="https://www.wififree.kr/index.do"
              target="_blank"
              rel="noopener noreferrer"
            >
              Public_Wifi
            </a>
            <a
              className="font-label text-xs uppercase tracking-widest text-on-secondary-container opacity-70 hover:opacity-100 hover:underline"
              href="https://safestay.visitkorea.or.kr/usr/main/mainSelectList.kto"
              target="_blank"
              rel="noopener noreferrer"
            >
              Safestay
            </a>
            <Link
              to="/info"
              className="font-label text-xs uppercase tracking-widest text-on-secondary-container opacity-70 hover:opacity-100 hover:underline"
            >
              Info
            </Link>
          </div>
        </footer>
	);
};

export default Footer;
