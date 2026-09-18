import React from 'react';

const PageHeader = ({
  label,
  title,
  description,
  action,
  className = '',
  compact = false,
  actionBreakpoint = 'md',
  titleNoWrap = false,
}) => {
  const actionLayoutClass = actionBreakpoint === 'xl'
    ? 'xl:flex-row xl:items-end xl:justify-between'
    : 'md:flex-row md:items-end md:justify-between';
  const titleSizeClass = titleNoWrap
    ? (compact ? 'text-xl sm:text-2xl md:text-3xl' : 'text-[26px] sm:text-[28px] md:text-4xl')
    : (compact ? 'text-2xl md:text-3xl' : 'text-[28px] md:text-4xl');

  return (
  <section className={`flex flex-col gap-3 ${actionLayoutClass} ${className}`}>
    <div className="min-w-0">
      <p className="mb-2 truncate font-label text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
        // {label}
      </p>
      <h1 className={`${titleSizeClass} ${titleNoWrap ? 'whitespace-nowrap' : 'break-keep'} font-headline font-black leading-tight tracking-tight text-on-surface`}>
        {title}
        <span className="text-primary">.</span>
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl break-keep text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
    {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
  </section>
  );
};

export default PageHeader;
