import React from 'react';

const PageHeader = ({ label, title, description, action, className = '', compact = false }) => (
  <section className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}>
    <div>
      <p className="text-primary text-[10px] font-bold uppercase tracking-[0.28em] font-label mb-2">
        // {label}
      </p>
      <h1 className={`${compact ? 'text-2xl' : 'text-3xl md:text-4xl'} font-headline font-black tracking-tight text-on-surface`}>
        {title}
        <span className="text-primary">.</span>
      </h1>
      {description && (
        <p className="text-sm text-slate-500 mt-2 leading-6">
          {description}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </section>
);

export default PageHeader;
