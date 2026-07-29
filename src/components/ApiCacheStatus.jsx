import React, { useEffect, useState } from 'react';

const SOURCE_LABEL = {
  memory: 'MEMORY',
  local: 'LOCAL',
  remote: 'REMOTE_DB',
  network: 'NETWORK',
  stale: 'STALE_CACHE',
};

const SOURCE_STYLE = {
  memory: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  local: 'bg-sky-50 text-sky-700 border-sky-100',
  remote: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  network: 'bg-amber-50 text-amber-700 border-amber-100',
  stale: 'bg-rose-50 text-rose-700 border-rose-100',
};

const formatTime = (timestamp) => {
  if (!timestamp) return '--:--';
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const ApiCacheStatus = () => {
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    const handleStatus = (event) => {
      setLatest(event.detail);
    };

    window.addEventListener('codetrip:api-cache-status', handleStatus);
    return () => window.removeEventListener('codetrip:api-cache-status', handleStatus);
  }, []);

  if (!import.meta.env.DEV || !latest) return null;

  const style = SOURCE_STYLE[latest.source] || SOURCE_STYLE.network;

  return (
    <div className="pointer-events-none fixed bottom-36 left-4 z-[80] hidden max-w-[280px] rounded-2xl border border-outline-variant/20 bg-white/90 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur md:block">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">api_cache.log</p>
        <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${style}`}>
          {SOURCE_LABEL[latest.source] || latest.source}
        </span>
      </div>
      <div className="mt-2 space-y-1 font-mono text-[10px] text-slate-500">
        <p className="truncate">
          service: <span className="font-bold text-slate-700">{latest.scope}/{latest.service}</span>
        </p>
        <p>
          checked_at: <span className="font-bold text-slate-700">{formatTime(latest.checkedAt)}</span>
        </p>
      </div>
    </div>
  );
};

export default ApiCacheStatus;
