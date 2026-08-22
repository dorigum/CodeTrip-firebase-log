import React, { useEffect, useId, useRef } from 'react';

const ConfirmModal = ({
  open,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  icon = 'terminal',
  tone = 'danger',
  onConfirm,
  onCancel,
  onClose,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousActiveElement = document.activeElement;
    confirmButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        (onClose || onCancel)?.();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const focusable = Array.from(focusableElements || [])
          .filter((element) => !element.disabled && element.offsetParent !== null);
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [open, onCancel, onClose]);

  if (!open) return null;

  const toneClass = tone === 'danger'
    ? 'bg-red-50 text-red-600 border-red-100'
    : 'bg-primary/5 text-primary border-primary/10';

  const confirmClass = tone === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-primary hover:bg-primary-dark text-white';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm px-4">
      <div
        ref={modalRef}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined flex h-9 w-9 items-center justify-center rounded-xl border text-lg ${toneClass}`}>
              {icon}
            </span>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">system.confirm</p>
              <h2 id={titleId} className="text-base font-black text-slate-950">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose || onCancel}
            className="material-symbols-outlined rounded-lg p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
            aria-label="닫기"
          >
            close
          </button>
        </div>

        <div className="px-5 py-5">
          <p id={descriptionId} className="text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-outline-variant/30 bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            ref={confirmButtonRef}
            className={`h-10 rounded-lg px-4 text-xs font-black uppercase tracking-wider transition-colors ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
