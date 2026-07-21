import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createBoardPost, updateBoardPost } from '../api/boardApi';
import useAuthStore from '../store/useAuthStore';
import useBoardWriteStore from '../store/useBoardWriteStore';
import MarkdownEditor from '../components/MarkdownEditor';
import PageHeader from '../components/PageHeader';

const BoardWrite = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { isLoggedIn } = useAuthStore();
  const { title, content, tags, editId, setTitle, setContent, setTags, resetForm } = useBoardWriteStore();

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isMounted = useRef(false);

  // 초기 마운트: 인증 확인 및 폼 초기화
  useEffect(() => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    isMounted.current = true;
    if (!state?.fromTagSearch && !state?.edit) {
      resetForm();
    }
  }, []);

  // 작성 중 로그아웃 감지 → 게시글 목록으로 이동
  useEffect(() => {
    if (!isMounted.current) return;
    if (!isLoggedIn) navigate('/board');
  }, [isLoggedIn]);

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = '제목을 입력해주세요.';
    if (!content.trim()) errs.content = '내용을 입력해주세요.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    try {
      setSubmitting(true);
      if (editId) {
        await updateBoardPost(editId, { title: title.trim(), content: content.trim(), tags });
        resetForm();
        navigate(`/board/${editId}`);
      } else {
        const result = await createBoardPost({ title: title.trim(), content: content.trim(), tags });
        resetForm();
        navigate(`/board/${result.id}`);
      }
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if ((title.trim() || content.trim()) && !window.confirm('작성 중인 내용이 있습니다. 취소하시겠습니까?')) return;
    resetForm();
    navigate(editId ? `/board/${editId}` : '/board');
  };

  const handleTagSearch = () => {
    navigate('/board/tag-search', { state: { fromBoardWrite: true } });
  };

  const removeTag = (contentId) => {
    setTags(tags.filter((t) => t.content_id !== contentId));
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <PageHeader
          className="mb-8"
          label={editId ? 'edit_post.md' : 'new_post.md'}
          title={editId ? '게시글 수정' : '새 게시글 작성'}
          description="여행 경험을 마크다운으로 정리하고 관련 여행지를 함께 태그하세요."
        />

        {/* Editor Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">

          {/* Window Chrome */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(186,26,26,0.6)' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(90,95,101,0.6)' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(0,184,212,0.6)' }} />
            </div>
            <span className="text-[10px] font-mono text-outline uppercase tracking-widest">
              {editId ? `edit_post_${editId}.md` : 'new_post.md'}
            </span>
          </div>

          <div className="p-8 space-y-8">

            {/* Title Field */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-outline uppercase tracking-widest mb-2">
                title<span className="text-error ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: '' })); }}
                placeholder="// 제목을 입력하세요..."
                className={`w-full bg-transparent font-mono text-base text-on-surface placeholder:text-outline outline-none border-b pb-3 transition-colors ${
                  errors.title ? 'border-error' : 'border-outline-variant/20 focus:border-primary'
                }`}
              />
              {errors.title && (
                <p className="text-[10px] font-mono text-error mt-1">// {errors.title}</p>
              )}
            </div>

            {/* Content Field */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-outline uppercase tracking-widest mb-2">
                content<span className="text-error ml-0.5">*</span>
              </label>
              <MarkdownEditor
                value={content}
                onChange={(v) => { setContent(v); if (errors.content) setErrors((p) => ({ ...p, content: '' })); }}
                placeholder="// 여행 경험을 공유해주세요..."
                minRows={16}
              />
              {errors.content && (
                <p className="text-[10px] font-mono text-error mt-1">// {errors.content}</p>
              )}
            </div>

            {/* Tagged Destinations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-mono font-bold text-outline uppercase tracking-widest">
                  tagged_destinations
                  <span className="ml-2 text-outline/60 normal-case">({tags.length})</span>
                </label>
                <button
                  onClick={handleTagSearch}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary border border-primary/20 rounded-lg text-[11px] font-mono font-bold hover:bg-primary/10 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add_location_alt</span>
                  TAG_DESTINATION.SH
                </button>
              </div>

              {tags.length === 0 ? (
                <div
                  onClick={handleTagSearch}
                  className="flex flex-col items-center justify-center gap-2 py-8 border border-dashed border-outline-variant/30 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
                >
                  <span className="material-symbols-outlined text-outline/40 text-3xl">add_location_alt</span>
                  <p className="text-xs font-mono text-outline/60">// 여행지를 태그하면 게시글에 표시됩니다</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {tags.map((tag) => (
                    <div
                      key={tag.content_id}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-white"
                    >
                      <div className="h-20 bg-slate-100 overflow-hidden">
                        {tag.firstimage ? (
                          <img src={tag.firstimage} alt={tag.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-300 text-2xl">image</span>
                          </div>
                        )}
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="text-[11px] font-mono font-bold text-on-surface truncate">
                          <span className="text-primary/60 mr-0.5">#</span>{tag.title}
                        </p>
                      </div>
                      <button
                        onClick={() => removeTag(tag.content_id)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleTagSearch}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-outline-variant/30 hover:border-primary/40 hover:bg-primary/[0.02] transition-all min-h-[100px]"
                  >
                    <span className="material-symbols-outlined text-outline/40 text-2xl">add</span>
                    <p className="text-[10px] font-mono text-outline/60">추가</p>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 text-xs font-bold font-label border border-outline-variant/30 rounded-xl text-on-secondary-container hover:bg-slate-50 transition-all"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold font-label hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                // committing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                {editId ? 'UPDATE_POST.SH' : 'COMMIT_POST.SH'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardWrite;
