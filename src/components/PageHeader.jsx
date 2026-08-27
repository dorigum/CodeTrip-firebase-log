import React from 'react';

const PageHeader = ({ label, title, description, action, className = '', compact = false }) => (
  <section className={`flex flex-col gap-3 md:flex-row md:items-end md:justify-between ${className}`}>
    <div className="min-w-0">
      <p className="mb-2 break-all font-label text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
        // {label}
      </p>
      <h1 className={`${compact ? 'text-2xl md:text-3xl' : 'text-[28px] md:text-4xl'} break-keep font-headline font-black leading-tight tracking-tight text-on-surface`}>
        {title}
        <span className="text-primary">.</span>
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl break-keep text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </section>
);

export default PageHeader;
