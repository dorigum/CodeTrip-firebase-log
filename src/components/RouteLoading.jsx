const RouteLoading = () => (
  <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
    <div className="flex items-center gap-3 rounded-xl border border-outline-variant/15 bg-white px-4 py-3 text-xs font-bold text-slate-500 shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      페이지를 불러오는 중입니다.
    </div>
  </div>
);

export default RouteLoading;
