import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getWeather, getLocationName } from '../api/weatherApi';
import { getPhotoList, getFestivalList, getCityBasedPlaces, searchKeywordPlaces, getSpontaneousTravel } from '../api/travelApi';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';

const MOCK_NODE_HEADER = [
  { galContentId: 'm1', galTitle: '감성 여행', galPhotographyLocation: '대한민국', galWebImageUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=2070' },
  { galContentId: 'm2', galTitle: '평화로운 산책', galPhotographyLocation: '전국 팔도', galWebImageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2094' }
];

const FALLBACK_TRAVEL_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070';

const GUEST_FEATURES = [
  {
    emoji: '🧭',
    icon: 'explore',
    label: 'DESTINATION.DATA',
    title: '공공 여행지 데이터를 탐색합니다',
    desc: '한국관광공사 데이터 기반 여행지, 이미지, 주소, 상세 정보를 한 화면에서 확인할 수 있습니다.',
    snippet: ['region: "Busan"', 'theme: "culture"', 'source: "TourAPI"'],
    to: '/explore',
    gradient: 'from-sky-500/15 via-cyan-400/10 to-white',
    accent: 'text-sky-600 bg-sky-50 border-sky-100'
  },
  {
    emoji: '💗',
    icon: 'favorite',
    label: 'WISHLIST.NODE',
    title: '마음에 드는 장소를 폴더로 정리합니다',
    desc: '관심 여행지를 저장하고 폴더별 메모와 체크리스트로 여행 준비 흐름을 이어갑니다.',
    snippet: ['folder: "서울 실내"', 'memo: true', 'checklist: true'],
    to: '/login',
    gradient: 'from-rose-500/15 via-pink-400/10 to-white',
    accent: 'text-rose-600 bg-rose-50 border-rose-100'
  },
  {
    emoji: '✨',
    icon: 'auto_awesome',
    label: 'AI_TRIP.PLANNER',
    title: 'CodeTrip이 여행 코스를 생성합니다',
    desc: '지역, 인원, 예산, 취향 또는 위시리스트 폴더를 기준으로 하루 단위 일정을 만듭니다.',
    snippet: ['mode: "wishlist"', 'days: 1', 'pace: "relaxed"'],
    to: '/login',
    gradient: 'from-violet-500/15 via-indigo-400/10 to-white',
    accent: 'text-violet-600 bg-violet-50 border-violet-100'
  },
  {
    emoji: '📝',
    icon: 'article',
    label: 'BOARD.LOG',
    title: '여행 기록과 후기를 공유합니다',
    desc: '게시글, 댓글, 좋아요, 활동 기록을 통해 여행 경험을 커뮤니티 데이터로 남깁니다.',
    snippet: ['post: "travel-log"', 'comments: true', 'likes: true'],
    to: '/board',
    gradient: 'from-emerald-500/15 via-teal-400/10 to-white',
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-100'
  }
];

const GUEST_STEPS = [
  { step: '01', emoji: '🧭', command: '$ codetrip explore', title: '탐색', desc: '지역과 테마로 여행지를 찾습니다.' },
  { step: '02', emoji: '💾', command: '$ wishlist save', title: '저장', desc: '좋은 장소를 위시리스트 폴더에 담습니다.' },
  { step: '03', emoji: '✨', command: '$ course generate', title: '생성', desc: 'CodeTrip이 조건에 맞는 코스를 제안합니다.' }
];

const MEMBER_PREVIEW = [
  { icon: 'favorite', title: '위시리스트 폴더', value: '3 folders', desc: '서울 실내 문화 여행, 부산 맛집 투어처럼 목적별 저장' },
  { icon: 'auto_awesome', title: 'AI 코스 생성', value: '1 day plan', desc: '예산, 동행, 날씨, 저장 장소를 반영한 일정 추천' },
  { icon: 'forum', title: '여행 게시판', value: 'share log', desc: '게시글, 댓글, 좋아요로 여행 경험 공유' }
];

const GuestReveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`guest-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const GuestHome = () => (
  <div className="relative flex-1 overflow-y-auto bg-background p-6 lg:p-10">
    <style>{`
      @keyframes codetrip-hero-pan {
        0%, 100% { transform: scale(1.02) translate3d(0, 0, 0); }
        50% { transform: scale(1.08) translate3d(-1.5%, -1%, 0); }
      }
      @keyframes codetrip-fade-up {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes codetrip-scan {
        0% { transform: translateX(-120%); opacity: 0; }
        22% { opacity: .9; }
        100% { transform: translateX(120%); opacity: 0; }
      }
      @keyframes codetrip-pulse {
        0%, 100% { transform: scale(1); opacity: .72; }
        50% { transform: scale(1.25); opacity: 1; }
      }
      @keyframes codetrip-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes codetrip-shine-text {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .guest-hero-image { animation: codetrip-hero-pan 16s ease-in-out infinite; }
      .guest-fade-up { animation: codetrip-fade-up .75s cubic-bezier(.16,1,.3,1) both; }
      .guest-scan-line { animation: codetrip-scan 4.5s ease-in-out infinite; }
      .guest-pulse-dot { animation: codetrip-pulse 2s ease-in-out infinite; }
      .guest-floating { animation: codetrip-float 4s ease-in-out infinite; }
      .guest-gradient-text {
        background: linear-gradient(120deg, #7ee7f4 0%, #00b8d4 32%, #a7f3d0 62%, #ffffff 100%);
        background-size: 240% auto;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: codetrip-shine-text 5s ease-in-out infinite;
        text-shadow: none;
      }
      .guest-feature-card { transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s ease, border-color .35s ease; }
      .guest-feature-card:hover { transform: translateY(-8px) scale(1.015); box-shadow: 0 20px 46px rgba(0, 120, 143, .15); border-color: rgba(0, 120, 143, .34); }
      .guest-step-card { transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s ease, border-color .35s ease; }
      .guest-step-card:hover { transform: translateY(-7px); box-shadow: 0 18px 38px rgba(15, 23, 42, .08); border-color: rgba(0, 120, 143, .28); }
      .guest-reveal { opacity: 0; transform: translateY(24px); transition: opacity .72s cubic-bezier(.16,1,.3,1), transform .72s cubic-bezier(.16,1,.3,1); }
      .guest-reveal.is-visible { opacity: 1; transform: translateY(0); }
      .guest-emoji-badge { filter: drop-shadow(0 10px 18px rgba(15, 23, 42, .12)); }
      @media (prefers-reduced-motion: reduce) {
        .guest-hero-image, .guest-fade-up, .guest-scan-line, .guest-pulse-dot, .guest-floating, .guest-gradient-text { animation: none; }
        .guest-reveal { opacity: 1; transform: none; transition: none; }
        .guest-feature-card:hover, .guest-step-card:hover { transform: none; }
      }
    `}</style>

    <section className="relative min-h-[460px] overflow-hidden rounded-2xl bg-slate-950 shadow-2xl">
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070"
        alt="CodeTrip service preview"
        className="guest-hero-image absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-900/20" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/20">
        <div className="guest-scan-line h-px w-1/2 bg-primary-container/90" />
      </div>

      <div className="relative z-10 grid min-h-[460px] grid-cols-1 items-center gap-8 px-7 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-12">
        <div className="max-w-3xl">
          <div className="guest-fade-up inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-md font-label">
            <span className="guest-pulse-dot h-2 w-2 rounded-full bg-primary-container" />
            codetrip.service
          </div>
          <h1 className="guest-fade-up mt-6 font-headline text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl" style={{ animationDelay: '.08s' }}>
            여행 데이터를<br />
            <span className="guest-gradient-text">나만의 코스</span>로 연결하세요<span className="text-primary-container">.</span>
          </h1>
          <p className="guest-fade-up mt-5 max-w-2xl break-keep text-base leading-8 text-white/80 sm:text-lg" style={{ animationDelay: '.16s' }}>
            CodeTrip은 여행지 탐색, 위시리스트 저장, AI 여행 코스 생성, 여행 게시판을 하나의 흐름으로 연결하는 개발자 감성의 여행 큐레이션 서비스입니다.
          </p>
          <div className="guest-fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: '.24s' }}>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-container font-label">
              <span className="material-symbols-outlined text-lg">login</span>
              로그인하고 시작하기
            </Link>
            <Link to="/explore" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/15 px-7 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/25 font-label">
              <span className="material-symbols-outlined text-lg">travel_explore</span>
              여행지 둘러보기
            </Link>
          </div>
        </div>

        <div className="guest-fade-up guest-floating hidden overflow-hidden rounded-2xl border border-white/20 bg-slate-950/55 shadow-2xl backdrop-blur-xl lg:block" style={{ animationDelay: '.32s' }}>
          <div className="flex items-center justify-between border-b border-white/10 bg-white/10 px-5 py-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary-container" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/55 font-label">trip.config.js</p>
          </div>
          <div className="p-5 font-mono text-xs leading-7 text-white/75">
            <p><span className="text-primary-container">const</span> trip = <span className="text-primary-container">CodeTrip</span>.generate({'{'}</p>
            <div className="pl-4">
              <p>region: <span className="text-emerald-200">"Busan"</span>,</p>
              <p>mood: <span className="text-emerald-200">"healing"</span>,</p>
              <p>budget: <span className="text-emerald-200">"normal"</span>,</p>
              <p>source: [<span className="text-emerald-200">"TourAPI"</span>, <span className="text-emerald-200">"Wishlist"</span>]</p>
            </div>
            <p>{'}'});</p>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-container font-label">output.preview</span>
                <span className="rounded-full bg-primary-container/20 px-2 py-0.5 text-[10px] font-black text-primary-container">200 OK</span>
              </div>
              {['10:00 실내 전시', '12:30 로컬 맛집', '15:00 감성 산책'].map((item) => (
                <p key={item} className="border-t border-white/10 py-2 first:border-t-0 first:pt-0 last:pb-0">
                  <span className="text-primary-container">-</span> {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-4">
      {GUEST_FEATURES.map((feature, index) => (
        <GuestReveal key={feature.label} delay={index * 90}>
          <Link
            to={feature.to}
            className={`guest-feature-card group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant/20 bg-gradient-to-br ${feature.gradient} p-6 shadow-sm`}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className={`guest-emoji-badge flex h-14 w-14 items-center justify-center rounded-2xl border text-3xl ${feature.accent}`}>
                {feature.emoji}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-label">{feature.label}</span>
            </div>
            <h3 className="break-keep text-xl font-black leading-snug text-on-surface font-headline">{feature.title}</h3>
            <p className="mt-3 break-keep text-sm leading-6 text-slate-600">{feature.desc}</p>
            <div className="mt-5 rounded-xl border border-slate-900/5 bg-white/70 p-3 font-mono text-[11px] leading-5 text-slate-500">
              <p className="font-bold text-primary">## {feature.label.toLowerCase()}</p>
              {feature.snippet.map((line) => (
                <p key={line} className="truncate">- {line}</p>
              ))}
            </div>
            <div className="mt-auto flex items-center gap-2 pt-5 text-[11px] font-black uppercase tracking-widest text-primary font-label">
              launch_node
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </div>
          </Link>
        </GuestReveal>
      ))}
    </section>

    <section className="mt-8">
      <GuestReveal>
      <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white p-7 shadow-sm">
        <div className="max-w-2xl">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <p className="text-[11px] font-bold uppercase tracking-widest font-label">how_it_works.exe</p>
            </div>
            <h2 className="mt-4 break-keep text-2xl font-black text-on-surface font-headline">처음 방문해도 3단계면 충분합니다.</h2>
          </div>
          <p className="mt-3 break-keep text-sm leading-6 text-outline">
            둘러보기에서 시작해 저장과 AI 코스까지 자연스럽게 이어지는 흐름입니다.
          </p>
        </div>
        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
          {GUEST_STEPS.map((item, index) => (
            <React.Fragment key={item.step}>
              <div className="guest-step-card rounded-2xl border border-outline-variant/10 bg-gradient-to-br from-white to-surface-container-high p-5">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{item.emoji}</span>
                  <p className="font-mono text-xs font-black text-primary">{item.step}</p>
                </div>
                <p className="mt-4 rounded-lg border border-outline-variant/15 bg-slate-50 px-3 py-2 font-mono text-[11px] font-bold text-primary">{item.command}</p>
                <h3 className="mt-5 text-lg font-black text-on-surface font-headline">{item.title}</h3>
                <p className="mt-2 break-keep text-sm leading-6 text-outline">{item.desc}</p>
              </div>
              {index < GUEST_STEPS.length - 1 && (
                <div className="hidden items-center justify-center text-primary/50 md:flex">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      </GuestReveal>
    </section>

    <GuestReveal delay={80}>
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-600/25 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white shadow-xl">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_520px]">
          <div className="p-8 lg:p-10">
            <div className="flex items-center gap-2 text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <p className="text-[11px] font-bold uppercase tracking-widest font-label">member.workspace</p>
            </div>
            <h2 className="mt-5 break-keep text-3xl font-black leading-tight font-headline">
              <span className="text-primary">로그인하면</span> 여행 계획이<br className="hidden sm:block" />
              <span className="relative inline-block text-cyan-100 drop-shadow-sm">
                하나의 작업 공간
                <span className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded-full bg-primary/55" />
              </span>으로 이어집니다.
            </h2>
            <p className="mt-4 max-w-2xl break-keep text-sm leading-7 text-white/80">
              저장한 장소를 폴더로 묶고, CodeTrip이 코스를 제안하면 체크리스트와 메모까지
              <br className="hidden sm:block" />
              같은 흐름에서 관리할 수 있습니다.
            </p>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {MEMBER_PREVIEW.map((item) => (
                <div key={item.title} className="flex min-h-[230px] flex-col rounded-2xl border border-white/12 bg-slate-900/25 p-5 transition-all hover:-translate-y-1 hover:bg-slate-900/35">
                  <div className="flex h-9 items-center gap-2">
                    <span className="material-symbols-outlined flex h-7 w-7 items-center justify-center text-primary" style={{fontVariationSettings: "'FILL' 1"}}>{item.icon}</span>
                    <p className="inline-flex min-h-7 items-center rounded-full border border-primary/25 bg-primary/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-100 font-label">{item.value}</p>
                  </div>
                  <h3 className="mt-4 text-sm font-bold">{item.title}</h3>
                  <p className="mt-3 break-keep text-xs leading-5 text-white/70">{item.desc}</p>
                  <div className="mt-auto border-t border-white/10 pt-4">
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/65 font-label">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      synced
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-900/15 p-6 lg:border-l lg:border-t-0">
            <div className="rounded-2xl border border-white/15 bg-slate-800/75 p-5 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary font-label">saved_course.json</p>
                  <h3 className="mt-1 text-xl font-black font-headline">부산 가족 힐링 여행</h3>
                </div>
                <span className="rounded-xl bg-primary px-3 py-1 text-[10px] font-black text-white font-label">AI READY</span>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {['가족여행', '맛집', '실내코스'].map((tag) => (
                  <span key={tag} className="rounded-full border border-primary/25 bg-primary/15 px-2.5 py-1 text-[10px] font-black text-cyan-100 font-label">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary font-label">day 1</p>
                    <p className="mt-0.5 text-sm font-bold text-white">해운대와 실내 전시를 잇는 하루</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">route</span>
                </div>
                <div className="divide-y divide-white/10">
                  {[
                    { time: '10:00', place: '해운대 산책', memo: '바다를 따라 천천히 시작' },
                    { time: '12:30', place: '로컬 맛집 점심', memo: '이동 동선 안의 식사 후보' },
                    { time: '15:00', place: '실내 전시 관람', memo: '날씨와 가족 동선을 고려' },
                  ].map((item) => (
                    <div key={item.time} className="grid grid-cols-[52px_minmax(0,1fr)_24px] gap-3 px-4 py-3">
                      <span className="font-mono text-[11px] font-black text-primary">{item.time}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{item.place}</p>
                        <p className="mt-1 truncate text-[11px] text-white/55">{item.memo}</p>
                      </div>
                      <span className="material-symbols-outlined text-lg text-primary">check_circle</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { icon: 'checklist', label: 'checklist', value: '4 items' },
                  { icon: 'folder', label: 'folder', value: 'saved' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/10 p-3">
                    <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/45 font-label">{item.label}</p>
                    <p className="mt-0.5 text-sm font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </GuestReveal>

    <GuestReveal delay={120}>
      <section className="mt-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-white via-primary/5 to-cyan-50 p-7 shadow-sm lg:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary font-label">next.action</p>
            <h2 className="mt-4 break-keep text-3xl font-black text-on-surface font-headline">
              비회원은 먼저 둘러보고,{' '}
              <span className="relative inline-block text-primary">
                관심 여행지
                <span className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded-full bg-cyan-200/80" />
              </span>
              는 계정으로 저장하세요.
            </h2>
            <p className="mt-3 max-w-2xl break-keep text-sm leading-6 text-outline">
              여행지 탐색과 서비스 소개는 열어두고, AI 코스 생성·게시판·마이페이지는 로그인 후 사용할 수 있도록 안내합니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link to="/explore" className="rounded-xl border border-outline-variant/30 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary font-label">
              explore_first
            </Link>
            <Link to="/login" className="rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-container font-label">
              sign_in
            </Link>
          </div>
        </div>
      </section>
    </GuestReveal>
  </div>
);

const Home = () => {
  const { isLoggedIn, user } = useAuthStore();
  const {
    wishlistItems,
    folders,
    initWishlist,
    loading: wishlistLoading
  } = useWishlistStore();
  const [weather, setWeather] = useState({ temp: 24, label: 'Sunny', icon: 'sunny', keywords: ['여행'], location: '서울' });
  const [province, setProvince] = useState('서울');
  const [topImgList, setTopImgList] = useState(MOCK_NODE_HEADER);
  const [topImgIndex, setTopImgIndex] = useState(0);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyIndex, setNearbyIndex] = useState(0);
  const [weatherRec, setWeatherRec] = useState(null);
  const [spontaneousMeta, setSpontaneousMeta] = useState(null);
  const [slotImg, setSlotImg] = useState(FALLBACK_TRAVEL_IMAGE); 
  const [trendingItems, setTrendingItems] = useState([]);
  
  const [loading, setLoading] = useState({ nearby: true, trending: true, weather: true });
  const [isSlotSpinning, setIsSlotSpinning] = useState(false);
  const [hasPicked, setHasPicked] = useState(false);
  const [typedBriefing, setTypedBriefing] = useState('');
  const hasPickedRef = useRef(false); // fetchMainData에서 최신 상태 참조용
  
  const isInitialMount = useRef(true); 
  const currentProvinceRef = useRef(''); // 현재 지역 고정용
  const topImgTimerRef = useRef(null);

  // hasPicked 상태와 Ref 동기화
  useEffect(() => {
    hasPickedRef.current = hasPicked;
  }, [hasPicked]);

  const fetchMainData = useCallback(async (locProv = '서울', locCity = '서울', lat = 37.5665, lon = 126.9780, isUpdate = false) => {
    try {
      // 1. 지역이 같으면 불필요한 재호출 방지
      const isProvinceChanged = locProv !== currentProvinceRef.current;
      
      if (isUpdate && !isProvinceChanged) {
        // 지역은 같지만 상세 위치(City)나 날씨가 바뀔 수 있으므로 날씨 데이터만 업데이트
        const weatherData = await getWeather(lat, lon);
        setWeather({ ...weatherData, location: locCity });
        return; 
      }

      if (isProvinceChanged) {
        setProvince(locProv);
        currentProvinceRef.current = locProv;
        setNearbyPlaces([]); // 이전 지역 데이터 즉시 초기화
        setLoading(prev => ({ ...prev, nearby: true }));
      }

      // 2. 지역 기반 데이터 (isProvinceChanged 일 때만 셔플 및 업데이트)
      if (isProvinceChanged || !isUpdate) {
        const [tops, near, festData] = await Promise.all([
          getPhotoList(null, 20),
          getCityBasedPlaces(locProv),
          getFestivalList(1, 10) // 1페이지에서 10개 요청
        ]);

        if (tops.length > 0) setTopImgList(tops);

        if (near && near.length > 0) {
          const shuffledNear = [...near].sort(() => Math.random() - 0.5);
          setNearbyPlaces(shuffledNear);
          setNearbyIndex(0);
        } else {
          setNearbyPlaces([]); // 데이터 없을 경우 빈 배열 유지
        }
        setLoading(prev => ({ ...prev, nearby: false }));

        const fests = festData?.items || festData || [];
        const festItems = fests.slice(0, 3).map(f => ({
          type: 'festival', 
          icon: 'celebration', 
          title: f.title, 
          subtitle: f.eventstartdate && typeof f.eventstartdate === 'string' && f.eventstartdate.length >= 8 
            ? `${f.eventstartdate.slice(4, 6)}.${f.eventstartdate.slice(6, 8)}` 
            : 'NOW',
          location: f.addr1?.split(' ')[0] || '전국', 
          image: f.firstimage,
          contentid: f.contentid
        }));
        setTrendingItems(festItems);
        setLoading(prev => ({ ...prev, trending: false }));
      }

      // 3. 날씨 데이터 (매 호출마다 업데이트 가능하지만 슬롯머신 결과는 보호)
      const weatherData = await getWeather(lat, lon);
      setWeather({ ...weatherData, location: locCity });
      
      const recs = await searchKeywordPlaces(weatherData.keywords[0], 1);
      if (recs.length > 0 && !hasPickedRef.current) {
        setWeatherRec(recs[0]);
      }
      setLoading(prev => ({ ...prev, weather: false }));
    } catch (err) { console.error('Data fetch error:', err); }
  }, []); // 의존성 배열을 비워 함수 안정화 (Ref 사용)

  useEffect(() => {
    if (!isLoggedIn) return;

    if (isInitialMount.current) {
      fetchMainData();
      isInitialMount.current = false;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const locData = await getLocationName(pos.coords.latitude, pos.coords.longitude);
          fetchMainData(locData.state, locData.city, pos.coords.latitude, pos.coords.longitude, true);
        },
        () => {}, { timeout: 10000 }
      );
    }
  }, [fetchMainData, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    initWishlist();
  }, [initWishlist, isLoggedIn]);

  const handleSlotSpin = async () => {
    if (isSlotSpinning) return;
    setIsSlotSpinning(true);
    setHasPicked(false);
    setSpontaneousMeta(null);
    let didPick = false;

    if (isLoggedIn) {
      const result = await getSpontaneousTravel(weather.keywords[0], weather.korLabel);
      if (result?.item) {
        await new Promise(r => setTimeout(r, 500));
        setWeatherRec(result.item);
        setSlotImg(result.item.firstimage || FALLBACK_TRAVEL_IMAGE);
        setSpontaneousMeta(result);
        didPick = true;
      }
    }
    
    const candidates = didPick ? [] : await searchKeywordPlaces(weather.keywords[0], 1);
    
    if (candidates && candidates.length > 0) {
      const spinCount = 15;
      for (let i = 0; i < spinCount; i++) {
        setSlotImg(candidates[i % candidates.length].firstimage || FALLBACK_TRAVEL_IMAGE);
        await new Promise(r => setTimeout(r, 80)); // 스핀 속도 증가
      }
      const finalResult = candidates[Math.floor(Math.random() * candidates.length)];
      setWeatherRec(finalResult);
      setSlotImg(finalResult.firstimage || FALLBACK_TRAVEL_IMAGE);
    }
    
    setIsSlotSpinning(false);
    setHasPicked(true);
  };

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    topImgTimerRef.current = setInterval(() => {
      setTopImgIndex(prev => (prev + 1) % (topImgList.length || 1));
    }, 5000);
    return () => clearInterval(topImgTimerRef.current);
  }, [topImgList, isLoggedIn]);

  const currentNodeHeader = topImgList[topImgIndex] || MOCK_NODE_HEADER[0];
  const slotModeLabel = isLoggedIn ? 'PERSONAL RANDOM' : 'GUEST PREVIEW';
  const slotTitle = isLoggedIn
    ? (spontaneousMeta?.hasPreferences === false ? '관심 지역 설정 전 랜덤 추천' : '관심 지역 기반 즉흥 추천')
    : '전국 랜덤 여행지 미리보기';
  const slotSubtitle = isLoggedIn
    ? (spontaneousMeta?.hasPreferences === false
      ? '관심 지역을 설정하면 지역과 날씨를 반영해 더 정확히 추천합니다.'
      : '회원님의 관심 지역과 현재 날씨를 반영해 추천합니다.')
    : '로그인하면 관심 지역 기반 맞춤 추천을 사용할 수 있습니다.';
  const slotAddress = isSlotSpinning
    ? '추천 후보를 계산하는 중입니다...'
    : (hasPicked ? weatherRec?.addr1 : slotSubtitle);
  const slotWeather = spontaneousMeta?.weather || weather;
  const slotWeatherRegion = spontaneousMeta?.weather?.regionName || `${province} ${weather.location}`;
  const slotWeatherLabel = slotWeather?.label || 'Weather';
  const slotWeatherTemp = Number.isFinite(slotWeather?.temp) ? `${slotWeather.temp}°C` : '--°C';
  const slotWeatherIcon = slotWeather?.icon || weather.icon || 'partly_cloudy_day';
  const getFolderId = (folder) => String(folder?.id ?? folder?.folder_id ?? '');
  const getFolderName = (folder) => folder?.name ?? folder?.folderName ?? '새 여행 폴더';
  const getFolderItemCount = (folder) => {
    const folderId = getFolderId(folder);
    return wishlistItems.filter(item => String(item.folder_id ?? item.folderId ?? '') === folderId).length;
  };
  const formatFolderDate = (folder) => {
    const start = folder?.startDate ?? folder?.start_date ?? folder?.start;
    const end = folder?.endDate ?? folder?.end_date ?? folder?.end;
    if (!start && !end) return '일정 미정';

    const toLabel = (value) => {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value).replaceAll('-', '.');
      return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}`;
    };

    const startLabel = toLabel(start);
    const endLabel = toLabel(end);
    return endLabel && endLabel !== startLabel ? `${startLabel} - ${endLabel}` : startLabel;
  };
  const sortedFolders = [...folders].sort((a, b) => {
    const aTime = new Date(a.updated_at ?? a.updatedAt ?? a.created_at ?? a.createdAt ?? 0).getTime();
    const bTime = new Date(b.updated_at ?? b.updatedAt ?? b.created_at ?? b.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
  const dashboardFolders = sortedFolders.slice(0, 3);
  const scheduledFolders = sortedFolders.filter(folder => folder.startDate || folder.start_date || folder.endDate || folder.end_date).slice(0, 3);
  const primaryFolder = scheduledFolders[0] || dashboardFolders[0];
  const uncategorizedCount = wishlistItems.filter(item => !item.folder_id && !item.folderId).length;
  const weatherSummary = weather.korLabel || weather.label || '여행하기 좋은 날씨';
  const todayBriefing = `${user?.name || 'traveler'}님, 오늘 ${province} ${weather.location}의 날씨는 ${weatherSummary}, ${weather.temp}°C입니다. 저장한 여행지 ${wishlistItems.length}개와 폴더 ${folders.length}개를 이어서 가볍게 다음 코스를 준비해보세요.`;

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedBriefing(todayBriefing.slice(0, index));
      if (index >= todayBriefing.length) window.clearInterval(timer);
    }, 26);

    return () => window.clearInterval(timer);
  }, [todayBriefing, isLoggedIn]);

  if (!isLoggedIn) {
    return <GuestHome />;
  }

  return (
    <div className="p-6 lg:p-10 gap-5 flex-1 flex flex-col bg-background overflow-hidden">
      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] gap-5">
        <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm p-6 lg:p-7 overflow-hidden">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-primary font-label">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                my_travel.dashboard
              </p>
              <h2 className="font-headline text-2xl lg:text-3xl font-bold text-slate-950 break-keep">
                {user?.name || 'traveler'}님의 여행 데이터를 한눈에 확인하세요.
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed break-keep">
                저장한 여행지와 폴더를 기준으로 다음 여행 준비 상태를 빠르게 확인할 수 있습니다.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link to="/ai-planner" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-bold text-primary transition hover:-translate-y-0.5 hover:bg-primary/15 font-label whitespace-nowrap">
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                AI 여행 계획 생성하기
              </Link>
              <Link to="/mypage" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 font-label whitespace-nowrap">
                <span className="material-symbols-outlined text-base">folder_open</span>
                MY WISHLIST
              </Link>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800/10 bg-slate-900 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400"></span>
                <span className="h-3 w-3 rounded-full bg-amber-300"></span>
                <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-label">TodayBriefing.java</p>
            </div>
            <div className="grid gap-2 px-4 py-4 font-mono text-sm leading-7 sm:px-5">
              <p className="text-slate-500"><span className="inline-block w-6 text-slate-600">1</span>// CodeTrip daily travel briefing</p>
              <p className="text-slate-200">
                <span className="inline-block w-6 text-slate-600">2</span>
                <span className="text-rose-300">public static</span> <span className="text-cyan-300">String</span> todayCourse() {'{'}
              </p>
              <p className="min-h-7 break-keep text-slate-100">
                <span className="inline-block w-6 text-slate-600">3</span>
                <span className="text-rose-300">return</span> <span className="text-emerald-200">"{typedBriefing}</span><span className="member-type-cursor"></span><span className="text-emerald-200">"</span>;
              </p>
              <p className="text-slate-200"><span className="inline-block w-6 text-slate-600">4</span>{'}'}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: 'favorite', label: 'SAVED_NODES', value: wishlistItems.length, helper: '저장 여행지' },
              { icon: 'folder', label: 'FOLDERS', value: folders.length, helper: '여행 폴더' },
              { icon: 'inventory_2', label: 'UNCATEGORIZED', value: uncategorizedCount, helper: '미분류' }
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">{stat.icon}</span>
                  <span className="font-headline text-2xl font-bold text-slate-950">{wishlistLoading ? '-' : stat.value}</span>
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 font-label">{stat.label}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {dashboardFolders.length > 0 ? dashboardFolders.map((folder) => (
              <Link key={getFolderId(folder)} to="/mypage" className="group rounded-2xl border border-outline-variant/20 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-headline text-base font-bold text-slate-950">{getFolderName(folder)}</p>
                    <p className="mt-1 text-[11px] text-slate-400 font-label uppercase tracking-widest">{formatFolderDate(folder)}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{getFolderItemCount(folder)}</span>
                </div>
              </Link>
            )) : (
              <div className="md:col-span-3 rounded-2xl border border-dashed border-outline-variant/40 p-5 text-center">
                <p className="text-sm font-bold text-slate-500">// 아직 저장된 위시리스트 폴더가 없습니다.</p>
                <Link to="/explore" className="mt-2 inline-flex text-xs font-bold text-primary hover:underline font-label uppercase tracking-widest">Explore_First</Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 lg:p-7 text-white overflow-hidden relative">
          <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary-container font-label">travel_schedule.json</p>
              <h3 className="mt-2 font-headline text-2xl font-bold break-keep">다가오는 여행 일정</h3>
            </div>
            <span className="material-symbols-outlined text-primary-container">event_available</span>
          </div>

          <div className="relative mt-6 space-y-3">
            {primaryFolder ? (
              <>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary-container font-label">next_folder</p>
                  <p className="mt-2 text-xl font-headline font-bold">{getFolderName(primaryFolder)}</p>
                  <p className="mt-1 text-sm text-white/60">{formatFolderDate(primaryFolder)} · 저장 여행지 {getFolderItemCount(primaryFolder)}개</p>
                </div>
                {(scheduledFolders.length > 0 ? scheduledFolders : dashboardFolders).slice(0, 3).map((folder, index) => (
                  <div key={getFolderId(folder) || index} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-primary-container">{String(index + 1).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{getFolderName(folder)}</p>
                      <p className="text-[11px] text-white/45">{formatFolderDate(folder)}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-primary-container">add_location_alt</span>
                <p className="mt-3 text-sm font-bold text-white/70">// 여행 폴더를 만들면 일정 대시보드가 채워집니다.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 1. 상단 Node_Header 섹션 */}
      <section className="relative w-full min-h-[260px] rounded-2xl overflow-hidden shadow-xl bg-surface-container-high shrink-0">
        <img src={currentNodeHeader.galWebImageUrl || currentNodeHeader.image} key={currentNodeHeader.galContentId || currentNodeHeader.id} className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000" alt="bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/45 to-slate-900/10 flex items-center px-6 py-6 sm:px-10 lg:px-12">
          <div className="max-w-[min(36rem,calc(100%-11rem))] space-y-3 sm:max-w-[min(40rem,calc(100%-13rem))]">
            <div className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20 w-fit text-white text-[10px] font-bold tracking-widest uppercase font-label">system.log: node_header_active</div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold text-white leading-tight drop-shadow-lg">Build your next <span className="text-primary-container">Adventure.</span></h1>
            <p className="text-white/80 text-sm sm:text-base font-body max-w-lg leading-relaxed break-keep">대한민국 곳곳의 숨겨진 데이터 노드들을 탐험하세요.</p>
            <div className="pt-1"><Link to="/explore" className="bg-white/50 backdrop-blur-md text-slate-900 px-7 py-2.5 rounded-full font-bold hover:bg-white/70 transition-all flex items-center justify-center gap-2 w-fit min-w-[170px] text-sm shadow-lg font-label border border-white/20 whitespace-nowrap"><span>GET STARTED</span><span className="material-symbols-outlined text-sm font-bold">arrow_right_alt</span></Link></div>
          </div>
          <div className="absolute right-6 bottom-6 sm:right-8 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 min-w-[132px] bg-white/75 backdrop-blur-2xl p-4 rounded-xl shadow-xl border border-white/30 text-slate-900">
            <p className="text-slate-500 text-[9px] uppercase mb-0.5 font-bold tracking-widest font-label whitespace-nowrap">{province} {weather.location}</p>
            <div className="flex items-center gap-3 whitespace-nowrap"><span className="text-3xl font-headline font-bold text-primary">{weather.temp}°C</span><span className="material-symbols-outlined text-2xl text-primary" style={{fontVariationSettings: "'FILL' 1"}}>{weather.icon}</span></div>
          </div>
        </div>
      </section>

      {/* 2. 카드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Card 1: Regional (Near Me) */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-outline-variant/10 relative overflow-hidden flex flex-col group">
            {loading.nearby && <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex min-h-[86px] justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary font-bold"><span className="material-symbols-outlined text-sm">location_on</span><p className="text-[10px] uppercase tracking-widest font-label whitespace-nowrap">NEAR ME ({province} {weather.location})</p></div>
                  <h3 className="font-headline text-xl font-bold text-slate-900 leading-tight break-keep">🛫지역 기반 추천: {province}</h3>
                </div>
                <button onClick={() => setNearbyIndex(i => (i+1) % (nearbyPlaces.length || 1))} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-900 rounded-xl hover:bg-primary hover:text-white transition-all shadow-md"><span className="material-symbols-outlined">navigate_next</span></button>
              </div>
              <div className="h-52 w-full rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                <img src={nearbyPlaces[nearbyIndex]?.firstimage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="n" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070'; }} />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-lg text-slate-900 truncate font-headline">{nearbyPlaces.length > 0 ? nearbyPlaces[nearbyIndex]?.title : <span className="text-slate-300 italic text-sm font-mono">// no_travelInfo_found</span>}</h4>
                  {nearbyPlaces.length > 0 && <Link to={`/explore/${nearbyPlaces[nearbyIndex].contentid}`} className="shrink-0 text-[10px] font-bold text-primary hover:underline uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full font-label">View_Detail</Link>}
                </div>
                <div className="flex items-center gap-2 mt-2 text-slate-400 font-mono text-xs italic"><span className="text-primary-container">#</span><p className="truncate">{nearbyPlaces.length > 0 ? nearbyPlaces[nearbyIndex]?.addr1 : `${province} 인기 명소 탐색`}</p></div>
              </div>
            </div>
          </div>

          {/* Card 2: Slot Machine */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-outline-variant/10 relative overflow-hidden flex flex-col group">
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex min-h-[86px] justify-between items-start">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-primary font-bold"><span className="material-symbols-outlined text-sm">casino</span><p className="text-[9px] uppercase tracking-widest font-label">{slotModeLabel}</p></div>
                  <h3 className="font-headline text-xl font-bold text-slate-900 leading-tight break-keep">{slotTitle}</h3>
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-[10px] font-bold text-primary font-label uppercase tracking-widest whitespace-nowrap">
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>{slotWeatherIcon}</span>
                    <span className="truncate">{slotWeatherRegion}</span>
                    <span className="text-slate-300">|</span>
                    <span className="shrink-0">{slotWeatherLabel}</span>
                    <span className="shrink-0">{slotWeatherTemp}</span>
                  </div>
                </div>
                <button onClick={handleSlotSpin} disabled={isSlotSpinning} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-md ${isSlotSpinning ? 'bg-primary text-white animate-pulse' : 'bg-slate-50 text-slate-900 hover:bg-primary hover:text-white'}`}><span className={`material-symbols-outlined ${isSlotSpinning ? 'animate-bounce' : ''}`}>casino</span></button>
              </div>
              <div className={`h-52 w-full rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner ${isSlotSpinning ? 'scale-[1.02]' : ''}`}>
                <img 
                  src={slotImg} 
                  className={`w-full h-full object-cover transition-all duration-1000 ${isSlotSpinning ? 'blur-sm brightness-75' : (!hasPicked ? 'blur-[2px] brightness-90 group-hover:blur-0 group-hover:brightness-100' : 'blur-0 brightness-100 group-hover:scale-110')}`} 
                  alt="w" 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070'; }} 
                />
                {hasPicked && !isSlotSpinning && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-white/85 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-slate-900 shadow-md">
                    <span className="material-symbols-outlined text-sm text-primary" style={{fontVariationSettings: "'FILL' 1"}}>{slotWeatherIcon}</span>
                    <span>{slotWeatherRegion}</span>
                    <span className="text-slate-300">|</span>
                    <span>{slotWeatherTemp}</span>
                  </div>
                )}
                {isSlotSpinning ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-3 bg-black/30 backdrop-blur-[2px]">
                    <div className="flex gap-2">{[1, 2, 3].map(i => <div key={i} className="w-2 h-2 bg-primary-container rounded-full animate-bounce" style={{animationDelay: `${i * 0.15}s`}}></div>)}</div>
                    <div className="font-bold text-xs tracking-widest font-label uppercase animate-pulse">추천 여행지를 뽑는 중...</div>
                  </div>
                ) : !hasPicked && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-500">
                    <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 text-center">
                      <p className="text-white text-[11px] font-bold leading-relaxed drop-shadow-md">버튼을 눌러<br/>여행지를 뽑아보세요</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-lg text-slate-900 truncate font-headline">
                    {isSlotSpinning ? 'PICKING...' : (hasPicked ? weatherRec?.title : 'READY_TO_SPIN')}
                  </h4>
                  {weatherRec && hasPicked && !isSlotSpinning && <Link to={`/explore/${weatherRec.contentid}`} className="shrink-0 text-[10px] font-bold text-primary hover:underline uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full font-label">View_Detail</Link>}
                </div>
                <div className="flex items-center gap-2 mt-2 text-slate-400 font-mono text-xs italic">
                  <span className="text-primary-container">//</span>
                  <p className="truncate">{slotAddress}</p>
                </div>
                {spontaneousMeta?.reasons?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {spontaneousMeta.reasons.slice(0, 2).map((reason, index) => (
                      <p key={index} className="text-[11px] text-slate-500 leading-relaxed truncate">
                        {reason}
                      </p>
                    ))}
                  </div>
                )}
                {isLoggedIn && spontaneousMeta?.hasPreferences === false && (
                  <Link to="/settings" className="inline-flex mt-3 text-[10px] font-bold text-primary hover:underline uppercase tracking-widest font-label">
                    Set_Preference
                  </Link>
                )}
                {!isLoggedIn && (
                  <Link to="/login" className="inline-flex mt-3 text-[10px] font-bold text-primary hover:underline uppercase tracking-widest font-label">
                    Sign_In_For_Personal_Picks
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Trending */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-outline-variant/10 flex flex-col h-full overflow-hidden group">
          <div className="flex justify-between items-start mb-4 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-sm">celebration</span>
                <p className="text-[10px] uppercase tracking-widest font-label whitespace-nowrap">TRENDING.EVENTS</p>
              </div>
              <h3 className="font-headline text-xl font-bold text-slate-900 leading-tight break-keep">축제 및 행사</h3>
            </div>
            <Link to="/festivals" className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-900 rounded-xl hover:bg-primary hover:text-white transition-all shadow-md" aria-label="축제 및 행사 전체 보기">
              <span className="material-symbols-outlined text-lg">arrow_outward</span>
            </Link>
          </div>
          <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
            {loading.trending ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-mono uppercase tracking-tighter animate-pulse">fetching_events.exe</p>
              </div>
            ) : trendingItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <img src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070" className="w-16 h-16 rounded-full grayscale opacity-20" alt="empty" />
                <div className="text-slate-300 italic text-[10px] font-mono">// no_events_found</div>
              </div>
            ) : (
              trendingItems.map((item, i) => (
                <Link key={i} to={`/explore/${item.contentid}`} className="flex rounded-2xl overflow-hidden bg-slate-50/50 group/event cursor-pointer hover:bg-slate-50 hover:shadow-md transition-all p-3 border border-transparent hover:border-outline-variant/20 shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm"><img src={item.image || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070'} className="w-full h-full object-cover group-hover/event:scale-110 transition-transform duration-700" alt="t" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070'; }} /></div>
                  <div className="flex-1 p-2 min-w-0 flex flex-col justify-center">
                    <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary w-fit mb-2 font-label tracking-tight">{item.subtitle}</span>
                    <h4 className="font-bold text-sm truncate text-slate-900 font-headline leading-tight">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-1 font-mono tracking-tighter">{item.location}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
