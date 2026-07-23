import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    id: 'home',
    tag: '01 // MAIN_NODE',
    title: '메인 홈',
    subtitle: '날씨와 위치 기반의 여행지 추천',
    description:
      '현재 위치와 날씨 데이터를 실시간으로 분석해 지금 이 순간 어울리는 여행지를 추천합니다. 슬롯머신 버튼 하나로 랜덤 여행지를 뽑아보세요.',
    icon: 'home',
    path: '/',
    chips: ['Geolocation', '날씨 연동', '슬롯머신 랜덤 추천', '축제 트렌딩'],
    details: [
      { icon: 'wb_sunny', label: '날씨 기반 추천', desc: '현재 날씨 키워드로 어울리는 여행지를 자동으로 탐색합니다.' },
      { icon: 'location_on', label: '지역 기반 추천', desc: 'GPS로 현재 위치를 파악해 근처 명소를 우선 노출합니다.' },
      { icon: 'casino', label: '슬롯머신', desc: '주사위 버튼을 눌러 랜덤으로 여행지를 뽑아보세요.' },
      { icon: 'celebration', label: '축제 미리보기', desc: '현재 진행 중이거나 곧 열리는 축제 3개를 카드로 보여줍니다.' },
    ],
  },
  {
    id: 'explore',
    tag: '02 // EXPLORE_NODE',
    title: '여행지 탐색',
    subtitle: '지역·테마·키워드로 원하는 여행지를 찾아보세요',
    description:
      '전국 16개 시도와 8가지 테마 필터로 원하는 여행지를 정밀하게 탐색합니다. 키워드 검색과 페이지 직접 이동도 지원합니다.',
    icon: 'explore',
    path: '/explore',
    chips: ['지역 필터', '테마 필터', '키워드 검색', '페이지네이션'],
    details: [
      { icon: 'map', label: '지역 필터', desc: '전국 + 서울·부산·제주 등 16개 시도를 멀티 선택할 수 있습니다.' },
      { icon: 'category', label: '테마 필터', desc: '관광지, 문화시설, 레포츠, 숙박, 음식점 등 8가지 테마를 제공합니다.' },
      { icon: 'search', label: '키워드 검색', desc: '여행지 이름이나 지명을 직접 검색해 빠르게 찾을 수 있습니다.' },
      { icon: 'favorite', label: '찜 기능', desc: '하트 버튼 또는 이미지 더블클릭으로 관심 여행지를 저장합니다.' },
    ],
  },
  {
    id: 'detail',
    tag: '03 // DETAIL_NODE',
    title: '여행지 상세',
    subtitle: '정보·지도·코멘트를 한 화면에',
    description:
      '선택한 여행지의 소개, 이미지 갤러리, 운영 정보를 확인하고 카카오 지도로 위치를 파악합니다. 다녀온 여행자들의 코멘트도 남기고 읽어보세요.',
    icon: 'article',
    path: '/explore',
    chips: ['상세 정보', '카카오 지도', '이미지 갤러리', '코멘트'],
    details: [
      { icon: 'image', label: '이미지 갤러리', desc: '관광공사 제공 고화질 이미지를 갤러리 형태로 볼 수 있습니다.' },
      { icon: 'terminal', label: '운영 정보', desc: '전화번호, 개방시간, 입장료, 주차 등 실용 정보를 제공합니다.' },
      { icon: 'location_on', label: '카카오 지도', desc: '지도를 클릭하면 카카오맵 앱에서 길찾기로 바로 연결됩니다.' },
      { icon: 'chat', label: '코멘트', desc: '여행 후기를 남기고 다른 여행자의 코멘트에 좋아요를 누를 수 있습니다.' },
    ],
  },
  {
    id: 'festivals',
    tag: '04 // FESTIVAL_NODE',
    title: '축제 및 행사',
    subtitle: '전국 축제 일정을 한눈에',
    description:
      '2025년 이후 전국에서 열리는 축제와 행사를 날짜순으로 정렬해 보여줍니다. 관심 있는 축제를 클릭하면 상세 정보로 바로 이동합니다.',
    icon: 'celebration',
    path: '/festivals',
    chips: ['날짜순 정렬', '페이지네이션', '상세 연결'],
    details: [
      { icon: 'sort', label: '날짜 정렬', desc: '시작일 기준 오름차순·내림차순 정렬을 지원합니다.' },
      { icon: 'calendar_today', label: '기간 표시', desc: '각 축제 카드에 시작일~종료일이 배지로 표시됩니다.' },
      { icon: 'open_in_new', label: '상세 연결', desc: '카드를 클릭하면 해당 축제의 상세 페이지로 이동합니다.' },
    ],
  },
  {
    id: 'wishlist',
    tag: '05 // WISHLIST_NODE',
    title: '위시리스트',
    subtitle: '관심 여행지를 폴더로 분류해서 보관',
    description:
      '마음에 드는 여행지를 저장하고 나만의 폴더로 정리합니다. 로그인 후 어떤 기기에서도 동일한 위시리스트를 확인할 수 있습니다.',
    icon: 'favorite',
    path: '/mypage',
    chips: ['폴더 분류', '실시간 동기화', '정렬'],
    details: [
      { icon: 'folder', label: '폴더 관리', desc: '여행 계획별로 폴더를 만들어 여행지를 분류합니다.' },
      { icon: 'sync', label: '실시간 동기화', desc: '서버와 실시간으로 동기화되어 어디서든 같은 목록을 볼 수 있습니다.' },
      { icon: 'swap_vert', label: '정렬', desc: '최신순, 이름 A-Z, Z-A 세 가지 방식으로 정렬합니다.' },
    ],
  },
];

const InfoReveal = ({ children, className = '', delay = 0 }) => {
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
      { threshold: 0.16 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Info = () => {
  const [activeId, setActiveId] = useState('home');
  const active = FEATURES.find((f) => f.id === activeId);

  return (
    <div className="bg-background text-on-surface font-body min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 px-10 py-24 flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,184,212,0.15)_0%,_transparent_70%)]" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-widest font-label uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            system.info — v1.0.0
          </div>
          <h1 className="text-5xl lg:text-6xl font-headline font-extrabold text-white leading-tight tracking-tighter">
            Code Trip<span className="text-primary">.</span>
          </h1>
          <p className="text-white/70 text-lg font-body leading-relaxed">
            대한민국 곳곳의 여행지를 탐색하고, 날씨와 위치 기반으로 지금 이 순간 최적의 여행지를 추천받으세요.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              to="/explore"
              className="px-7 py-3 bg-primary text-white rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg font-label"
            >
              탐색 시작하기
            </Link>
            <Link
              to="/"
              className="px-7 py-3 bg-white/10 text-white border border-white/20 rounded-full font-bold text-sm hover:bg-white/20 transition-all font-label backdrop-blur-md"
            >
              메인으로
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <InfoReveal>
        <div className="bg-white border-b border-outline-variant/10 px-10 py-5">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '60,000+', label: '등록 여행지' },
              { value: '16', label: '전국 시도 커버' },
              { value: '8', label: '여행 테마' },
              { value: '실시간', label: '날씨·위치 연동' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-2xl font-headline font-extrabold text-primary">{stat.value}</p>
                <p className="text-[11px] font-label uppercase tracking-widest text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </InfoReveal>

      {/* Feature Navigator + Detail */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-20 space-y-16">

        <InfoReveal className="text-center space-y-3">
          <p className="text-[11px] font-label uppercase tracking-[0.2em] text-primary font-bold">Features</p>
          <h2 className="text-3xl font-headline font-bold text-on-surface">주요 기능 소개</h2>
          <p className="text-slate-400 text-sm font-body">탭을 클릭해 각 기능의 상세 내용을 확인하세요.</p>
        </InfoReveal>

        {/* Tab Nav */}
        <InfoReveal className="flex flex-wrap justify-center gap-2" delay={80}>
          {FEATURES.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveId(f.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold font-label uppercase tracking-tight transition-all border ${
                activeId === f.id
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white text-slate-500 border-outline-variant/20 hover:border-primary/30 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{f.icon}</span>
              {f.title}
            </button>
          ))}
        </InfoReveal>

        {/* Active Feature Detail */}
        {active && (
          <InfoReveal className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden" delay={120}>
            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* Left: Description */}
              <div className="p-10 lg:p-12 flex flex-col justify-between space-y-8 border-b lg:border-b-0 lg:border-r border-outline-variant/10">
                <div className="space-y-5">
                  <p className="text-[10px] font-mono text-primary font-bold tracking-widest">{active.tag}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-3xl">{active.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-headline font-bold text-on-surface">{active.title}</h3>
                      <p className="text-sm text-slate-400 font-body mt-0.5">{active.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 font-body text-sm leading-relaxed">{active.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {active.chips.map((chip) => (
                      <span key={chip} className="px-3 py-1 bg-primary/8 text-primary text-[11px] font-bold rounded-full font-label border border-primary/15">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  to={active.path}
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline font-label uppercase tracking-widest"
                >
                  <span>바로 이동</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              {/* Right: Detail List */}
              <div className="p-10 lg:p-12 grid grid-cols-1 sm:grid-cols-2 gap-6 content-start">
                {active.details.map((d) => (
                  <div key={d.label} className="flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-outline-variant/10">
                      <span className="material-symbols-outlined text-slate-400 text-lg">{d.icon}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-on-surface font-headline">{d.label}</p>
                      <p className="text-[12px] text-slate-400 font-body leading-relaxed">{d.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </InfoReveal>
        )}
      </div>

      {/* How to Use */}
      <section className="bg-surface-container-low border-t border-outline-variant/10 px-6 py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <InfoReveal className="text-center space-y-3">
            <p className="text-[11px] font-label uppercase tracking-[0.2em] text-primary font-bold">How to use</p>
            <h2 className="text-3xl font-headline font-bold text-on-surface">이렇게 이용하세요</h2>
          </InfoReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: 'search', title: '여행지 탐색', desc: 'Explore 메뉴에서 지역·테마·키워드로 원하는 여행지를 검색합니다.' },
              { step: '02', icon: 'favorite', title: '위시리스트 저장', desc: '마음에 드는 여행지를 하트로 저장하고 폴더로 정리합니다.' },
              { step: '03', icon: 'celebration', title: '축제 일정 확인', desc: 'Festivals 메뉴에서 전국 축제 일정을 날짜순으로 확인합니다.' },
            ].map((s, index) => (
              <InfoReveal key={s.step} delay={index * 90}>
                <div className="bg-white p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-5 relative overflow-hidden">
                <p className="absolute top-5 right-6 text-6xl font-headline font-extrabold text-slate-50 leading-none select-none">{s.step}</p>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">{s.icon}</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-headline font-bold text-on-surface">{s.title}</h4>
                  <p className="text-sm text-slate-400 font-body leading-relaxed">{s.desc}</p>
                </div>
              </div>
              </InfoReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Data Source */}
      <section className="px-6 py-16 max-w-4xl mx-auto space-y-8">
        <InfoReveal className="text-center space-y-3">
          <p className="text-[11px] font-label uppercase tracking-[0.2em] text-primary font-bold">Data Source</p>
          <h2 className="text-3xl font-headline font-bold text-on-surface">활용 데이터</h2>
        </InfoReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: 'travel_explore', title: '한국관광공사 API', desc: '전국 여행지, 축제, 숙박, 음식점 등 60,000개 이상의 관광 정보를 제공합니다.', tag: 'KTO Open API' },
            { icon: 'map', title: '카카오 지도 API', desc: '여행지의 정확한 위치를 지도로 표시하고 길찾기를 지원합니다.', tag: 'Kakao Maps SDK' },
            { icon: 'wb_cloudy', title: '날씨 API', desc: '현재 위치의 실시간 날씨를 분석해 상황에 맞는 여행지를 추천합니다.', tag: 'Weather API' },
          ].map((d, index) => (
            <InfoReveal key={d.title} delay={index * 90}>
              <div className="bg-white p-7 rounded-2xl border border-outline-variant/10 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">{d.icon}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{d.tag}</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-headline font-bold text-on-surface text-sm">{d.title}</h4>
                <p className="text-[12px] text-slate-400 font-body leading-relaxed">{d.desc}</p>
              </div>
            </div>
            </InfoReveal>
          ))}
        </div>
      </section>

      {/* Transportation Links */}
      <section className="bg-white border-y border-outline-variant/10 px-6 py-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <InfoReveal className="text-center space-y-3">
            <p className="text-[11px] font-label uppercase tracking-[0.2em] text-primary font-bold">External Modules</p>
            <h2 className="text-3xl font-headline font-bold text-on-surface">교통수단 예매 허브</h2>
            <p className="text-slate-400 text-sm font-body">원활한 여행을 위해 외부 예매 시스템으로 즉시 연결합니다.</p>
          </InfoReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                id: 'ktx', 
                tag: 'SYS_01 // KORAIL', 
                title: 'KTX / 레츠코레일', 
                desc: '전국 철도망 KTX 및 일반 열차 예매를 지원하는 공식 플랫폼입니다.',
                icon: 'train',
                url: 'https://www.letskorail.com/'
              },
              { 
                id: 'srt', 
                tag: 'SYS_02 // SR_TRAIN', 
                title: 'SRT (수서고속철도)', 
                desc: '수서에서 출발하는 고속열차 SRT 전용 예매 시스템으로 연결합니다.',
                icon: 'directions_railway',
                url: 'https://etk.srail.kr/'
              },
              { 
                id: 'bus', 
                tag: 'SYS_03 // EXPRESS_BUS', 
                title: '고속 / 시외버스', 
                desc: '티머니 및 고속버스 통합 예매 시스템을 통해 버스 노선을 확인하세요.',
                icon: 'directions_bus',
                url: 'https://txbus.t-money.co.kr/'
              },
            ].map((sys, index) => (
              <InfoReveal key={sys.id} delay={index * 90}>
                <div className="group bg-slate-50/50 p-8 rounded-3xl border border-outline-variant/10 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all duration-500 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-primary tracking-tighter bg-primary/5 px-2 py-1 rounded border border-primary/10 uppercase">
                      {sys.tag}
                    </span>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-2xl">
                      {sys.icon}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-headline font-bold text-slate-900">{sys.title}</h4>
                    <p className="text-[13px] text-slate-500 font-body leading-relaxed">{sys.desc}</p>
                  </div>
                </div>
                <a 
                  href={sys.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-white border border-outline-variant/20 rounded-xl text-[11px] font-mono font-bold uppercase tracking-widest text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2 group/btn shadow-sm"
                >
                  Link_Start
                  <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">open_in_new</span>
                </a>
              </div>
              </InfoReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 px-6 py-20 text-center">
        <InfoReveal className="space-y-6">
          <h2 className="text-3xl font-headline font-bold text-white">
            지금 바로 여행을 시작하세요<span className="text-primary">.</span>
          </h2>
          <p className="text-white/60 font-body text-sm max-w-md mx-auto leading-relaxed">
            회원가입 없이도 여행지 탐색과 축제 정보를 바로 이용할 수 있습니다.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/explore"
              className="px-8 py-3 bg-primary text-white rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg font-label"
            >
              탐색 시작하기
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3 bg-white/10 text-white border border-white/20 rounded-full font-bold text-sm hover:bg-white/20 transition-all font-label backdrop-blur-md"
            >
              회원가입
            </Link>
          </div>
        </InfoReveal>
      </section>
    </div>
  );
};

export default Info;
