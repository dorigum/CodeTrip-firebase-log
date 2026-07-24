import React from 'react';

const Toast = ({ visible, text, type = 'error' }) => {
  const styleByType = {
    error: {
      className: 'bg-red-600 text-white',
      icon: 'warning',
    },
    success: {
      className: 'bg-emerald-600 text-white',
      icon: 'check_circle',
    },
    info: {
      className: 'bg-primary text-white',
      icon: 'info',
    },
  };
  const toastStyle = styleByType[type] || styleByType.info;

  return (
    <div
      className={`fixed bottom-6 inset-x-0 mx-auto w-fit z-[200] flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-xl text-sm font-mono font-bold transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      } ${toastStyle.className}`}
    >
      <span className="material-symbols-outlined text-base">
        {toastStyle.icon}
      </span>
      {text}
    </div>
  );
};

export default Toast;
