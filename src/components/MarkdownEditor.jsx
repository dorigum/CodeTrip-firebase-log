import React, { useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Toolbar definition ────────────────────────────────────────────────────────
const TOOLBAR = [
  { icon: 'format_bold',           title: 'Bold',          prefix: '**',    suffix: '**'    },
  { icon: 'format_italic',         title: 'Italic',        prefix: '*',     suffix: '*'     },
  { icon: 'strikethrough_s',       title: 'Strikethrough', prefix: '~~',    suffix: '~~'    },
  { divider: true },
  { label: 'H1', title: 'Heading 1', prefix: '# ',   suffix: '', line: true },
  { label: 'H2', title: 'Heading 2', prefix: '## ',  suffix: '', line: true },
  { label: 'H3', title: 'Heading 3', prefix: '### ', suffix: '', line: true },
  { divider: true },
  { icon: 'code',     title: 'Inline Code', prefix: '`',      suffix: '`'     },
  { icon: 'terminal', title: 'Code Block',  prefix: '```\n',  suffix: '\n```', block: true },
  { divider: true },
  { icon: 'link',  title: 'Link',  prefix: '[', suffix: '](url)' },
  { icon: 'image', title: 'Image', prefix: '![', suffix: '](url)' },
  { divider: true },
  { icon: 'format_list_bulleted', title: 'Bullet List',   prefix: '- ',  suffix: '', line: true },
  { icon: 'format_list_numbered', title: 'Numbered List', prefix: '1. ', suffix: '', line: true },
  { icon: 'format_quote',         title: 'Blockquote',    prefix: '> ', suffix: '', line: true },
  { divider: true },
  { label: '─', title: 'Horizontal Rule', insert: '\n\n---\n\n' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const moveCursor = (el, start, end) => {
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start, end);
  });
};

// ── Main component ────────────────────────────────────────────────────────────
const MarkdownEditor = ({
  value,
  onChange,
  placeholder = '// 마크다운으로 작성하세요...',
  minRows = 16,
  onImageUpload,
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mode, setMode] = React.useState('split'); // 'edit' | 'preview' | 'split'
  const [uploadingImage, setUploadingImage] = React.useState(false);

  // Apply formatting to the selected text
  const applyFormat = useCallback((item) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const before = value.substring(0, start);
    const after  = value.substring(end);
    const selected = value.substring(start, end);

    // Simple insert (no wrap)
    if (item.insert !== undefined) {
      const newValue = before + item.insert + after;
      onChange(newValue);
      const cur = start + item.insert.length;
      moveCursor(ta, cur, cur);
      return;
    }

    // Line-prefix mode: prepend to the current line
    if (item.line) {
      const lineStart = before.lastIndexOf('\n') + 1;
      const lineContent = value.substring(lineStart, end || value.length);
      const newValue = value.substring(0, lineStart) + item.prefix + lineContent + after;
      onChange(newValue);
      const cur = lineStart + item.prefix.length + lineContent.length;
      moveCursor(ta, cur, cur);
      return;
    }

    // Block mode: wrap selection or placeholder
    const inner = selected || 'code';
    const wrapped = item.block
      ? `\n${item.prefix}${inner}${item.suffix}\n`
      : `${item.prefix}${inner}${item.suffix}`;
    const newValue = before + wrapped + after;
    onChange(newValue);
    const offset = item.block ? item.prefix.length + 1 : item.prefix.length;
    moveCursor(ta, start + offset, start + offset + inner.length);
  }, [value, onChange]);

  // Handle Tab key for indentation inside the textarea
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      moveCursor(ta, start + 2, start + 2);
    }
  }, [value, onChange]);

  const insertTextAtCursor = useCallback((text) => {
    const ta = textareaRef.current;
    if (!ta) {
      onChange(`${value}${text}`);
      return;
    }

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);
    moveCursor(ta, start + text.length, start + text.length);
  }, [value, onChange]);

  const handleImageFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload || uploadingImage) return;

    setUploadingImage(true);
    try {
      const imageUrl = await onImageUpload(file);
      insertTextAtCursor(`\n![${file.name.replace(/\.[^.]+$/, '')}](${imageUrl})\n`);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }, [insertTextAtCursor, onImageUpload, uploadingImage]);

  // Keep textarea height auto-growing
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || mode === 'preview') return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(ta.scrollHeight, minRows * 24)}px`;
  }, [value, mode, minRows]);

  const minHeight = `${minRows * 1.5}rem`;

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-outline-variant/20 overflow-hidden bg-white shadow-sm">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-outline-variant/15 bg-slate-50 flex-wrap">
        {/* Format buttons */}
        <div className="flex items-center gap-0.5 flex-wrap flex-1">
          {TOOLBAR.map((item, i) => {
            if (item.divider) {
              return <div key={i} className="w-px h-4 bg-outline-variant/30 mx-1" />;
            }
            return (
              <button
                key={i}
                type="button"
                title={item.title}
                onMouseDown={(e) => { e.preventDefault(); applyFormat(item); }}
                className="flex items-center justify-center w-7 h-7 rounded text-outline hover:text-primary hover:bg-primary/8 transition-all text-xs font-mono font-bold"
              >
                {item.icon
                  ? <span className="material-symbols-outlined text-[18px] leading-none">{item.icon}</span>
                  : <span className="text-[11px] font-bold">{item.label}</span>
                }
              </button>
            );
          })}
          {onImageUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
              <button
                type="button"
                title="Upload Image"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-7 h-7 rounded text-outline hover:text-primary hover:bg-primary/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {uploadingImage ? (
                  <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px] leading-none">upload_file</span>
                )}
              </button>
            </>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 ml-2 shrink-0">
          {[
            { key: 'edit',    icon: 'edit',           label: 'Write'   },
            { key: 'split',   icon: 'vertical_split',  label: 'Split'   },
            { key: 'preview', icon: 'visibility',      label: 'Preview' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              title={label}
              onClick={() => setMode(key)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                mode === key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] leading-none">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Editor / Preview panes ───────────────────────────────────────── */}
      <div className={`flex ${mode === 'split' ? 'divide-x divide-outline-variant/15' : ''}`}>

        {/* Write pane */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={`flex flex-col ${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <div className="px-3 py-1.5 border-b border-outline-variant/10 bg-slate-50/50">
              <span className="text-[10px] font-mono text-outline uppercase tracking-widest">editor</span>
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{ minHeight, resize: 'none' }}
              className="flex-1 p-5 font-mono text-sm text-on-surface placeholder:text-outline outline-none leading-relaxed bg-white overflow-y-auto"
            />
          </div>
        )}

        {/* Preview pane */}
        {(mode === 'preview' || mode === 'split') && (
          <div className={`flex flex-col ${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <div className="px-3 py-1.5 border-b border-outline-variant/10 bg-slate-50/50">
              <span className="text-[10px] font-mono text-outline uppercase tracking-widest">preview</span>
            </div>
            <div
              className="flex-1 p-5 overflow-y-auto"
              style={{ minHeight }}
            >
              {value.trim() ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {value}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-xs font-mono text-outline/50 italic">// 미리보기가 여기에 표시됩니다...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-outline-variant/10 bg-slate-50/50">
        <span className="text-[10px] font-mono text-outline/50">Markdown supported · GFM</span>
        <span className="text-[10px] font-mono text-outline/50">{value.length} chars</span>
      </div>
    </div>
  );
};

export default MarkdownEditor;
