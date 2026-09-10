import React from 'react';
import { Link } from 'react-router-dom';

const footerLinkClass = 'font-label text-[9px] uppercase tracking-[0.12em] text-on-secondary-container/65 transition-colors hover:text-primary sm:text-[10px]';

const Footer = () => (
  <footer className="w-full border-t border-outline-variant/15 bg-background px-5 py-5 pb-20 text-center md:px-10 md:py-6 md:pb-6 md:text-left">
    <div className="relative mx-auto max-w-6xl">
      <nav aria-label="푸터 바로가기" className="mb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 xl:absolute xl:right-0 xl:top-0 xl:mb-0 xl:justify-end">
        <a className={footerLinkClass} href="https://www.wififree.kr/index.do" target="_blank" rel="noopener noreferrer">Public_Wifi</a>
        <a className={footerLinkClass} href="https://safestay.visitkorea.or.kr/usr/main/mainSelectList.kto" target="_blank" rel="noopener noreferrer">Safestay</a>
        <Link to="/info" className={footerLinkClass}>Info</Link>
      </nav>

      <div className="mx-auto max-w-2xl text-center">
        <p className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-primary sm:text-[11px]">
          CodeTrip · Travel decision companion
        </p>
        <p className="mt-2 text-[11px] leading-5 text-on-secondary-container/75 sm:text-xs">
          여행지를 고르기 어려운 순간부터 일정 저장과 여행 준비까지, 조건을 바탕으로<br />나만의 여행 결정을 돕습니다.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] leading-4 text-on-secondary-container/55 sm:text-[10px]">
          <span>Travel information · Korea Tourism Organization TourAPI</span>
          <span aria-hidden="true">·</span>
          <span>Built with React · Firebase · Gemini</span>
        </div>
      </div>

      <div className="mt-4 border-t border-outline-variant/10 pt-3 text-center font-label text-[9px] uppercase tracking-[0.1em] text-on-secondary-container/50 sm:text-[10px]">
        /* © 2026 CodeTrip · Plan with context, travel with confidence. */
      </div>
    </div>
  </footer>
);

export default Footer;
