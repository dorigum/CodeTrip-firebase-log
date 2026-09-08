import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getBoardPost, deleteBoardPost, toggleBoardPostLike,
  getBoardComments, createBoardComment, updateBoardComment, deleteBoardComment, toggleBoardCommentLike,
} from '../api/boardApi';
import useAuthStore from '../store/useAuthStore';
import useBoardWriteStore from '../store/useBoardWriteStore';
import ConfirmModal from '../components/ConfirmModal';

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const { setTitle, setContent, setTags, setEditId } = useBoardWriteStore();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [postDeleteConfirmOpen, setPostDeleteConfirmOpen] = useState(false);
  const [postDeleting, setPostDeleting] = useState(false);

  const [boardComments, setBoardComments] = useState([]);
  const [boardCommentText, setBoardCommentText] = useState('');
  const [boardCommentSubmitting, setBoardCommentSubmitting] = useState(false);
  const [boardCommentEditingId, setBoardCommentEditingId] = useState(null);
  const [boardCommentEditText, setBoardCommentEditText] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [postData, commentsData] = await Promise.all([
          getBoardPost(id),
          getBoardComments(id),
        ]);
        setPost(postData);
        setBoardComments(commentsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleEdit = () => {
    setEditId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setTags(post.tags || []);
    navigate('/board/write', { state: { edit: true } });
  };

  const handleDelete = () => {
    setPostDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (postDeleting) return;
    try {
      setPostDeleting(true);
      await deleteBoardPost(id);
      navigate('/board', { replace: true, state: { deletedPostId: id } });
    } catch (err) {
      console.error(err);
    } finally {
      setPostDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!postDeleting) setPostDeleteConfirmOpen(false);
  };

  const handleBoardCommentFocus = (e) => {
    if (!isLoggedIn) {
      e.target.blur();
      setShowLoginDialog(true);
    }
  };

  const handleBoardCommentSubmit = async () => {
    if (!isLoggedIn || !boardCommentText.trim() || boardCommentSubmitting) return;
    try {
      setBoardCommentSubmitting(true);
      await createBoardComment(id, boardCommentText.trim());
      setBoardCommentText('');
      setBoardComments(await getBoardComments(id));
    } catch (err) {
      console.error(err);
    } finally {
      setBoardCommentSubmitting(false);
    }
  };

  const handleBoardCommentEditStart = (comment) => {
    setBoardCommentEditingId(comment.id);
    setBoardCommentEditText(comment.body);
  };

  const handleBoardCommentEditCancel = () => {
    setBoardCommentEditingId(null);
    setBoardCommentEditText('');
  };

  const handleBoardCommentEditSubmit = async (commentId) => {
    if (!boardCommentEditText.trim()) return;
    try {
      await updateBoardComment(commentId, boardCommentEditText.trim());
      setBoardCommentEditingId(null);
      setBoardCommentEditText('');
      setBoardComments(await getBoardComments(id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBoardCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteBoardComment(commentId);
      setBoardComments(await getBoardComments(id));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostLike = async () => {
    if (!isLoggedIn) { setShowLoginDialog(true); return; }
    setPost((prev) => ({
      ...prev,
      liked: !prev.liked,
      like_count: prev.liked ? prev.like_count - 1 : prev.like_count + 1,
    }));
    try {
      const { liked, likes } = await toggleBoardPostLike(id);
      setPost((prev) => ({ ...prev, liked, like_count: likes }));
    } catch {
      setPost((prev) => ({
        ...prev,
        liked: !prev.liked,
        like_count: prev.liked ? prev.like_count - 1 : prev.like_count + 1,
      }));
    }
  };

  const handleBoardCommentLike = async (commentId) => {
    if (!isLoggedIn) { setShowLoginDialog(true); return; }
    setBoardComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
    try {
      const { liked, likes } = await toggleBoardCommentLike(commentId);
      setBoardComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, liked, likes } : c))
      );
    } catch {
      setBoardComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
            : c
        )
      );
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-xs font-mono text-outline animate-pulse">// loading_post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-on-secondary-container">
        <span className="material-symbols-outlined text-5xl mb-4 opacity-30">article</span>
        <p className="font-label text-sm syntax-comment">// post_not_found</p>
        <button onClick={() => navigate('/board')} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-label">BACK_TO_BOARD</button>
      </div>
    );
  }

  const isOwner = user?.id && post.user_id === user.id;

  return (
    <div className="bg-background text-on-surface font-body min-h-screen pb-20">

      <ConfirmModal
        open={postDeleteConfirmOpen}
        title="게시글을 삭제할까요?"
        description="삭제한 게시글은 복구할 수 없습니다. 계속 진행하시겠습니까?"
        confirmText={postDeleting ? '삭제 중...' : '삭제'}
        cancelText="취소"
        icon="delete_forever"
        confirmDisabled={postDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        onClose={handleDeleteCancel}
      />

      {/* Login Dialog */}
      {showLoginDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(186,26,26,0.6)' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(90,95,101,0.6)' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(0,184,212,0.6)' }} />
              </div>
              <span className="text-[10px] font-mono text-outline uppercase tracking-widest">auth_required.sh</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                <div>
                  <p className="font-headline font-bold text-on-surface text-sm">로그인이 필요합니다</p>
                  <p className="text-xs text-outline font-mono mt-0.5">// 해당 기능은 로그인 후 이용 가능합니다.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowLoginDialog(false)} className="flex-1 py-2.5 rounded-lg text-xs font-bold font-label border border-outline-variant/30 text-on-secondary-container hover:bg-surface-container-high transition-all">CANCEL</button>
                <button onClick={() => { setShowLoginDialog(false); navigate('/login'); }} className="flex-1 py-2.5 rounded-lg text-xs font-bold font-label bg-primary text-white hover:brightness-110 transition-all">GO_TO_LOGIN.SH</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-xs font-mono text-outline">
          <Link to="/board" className="hover:text-primary transition-colors">board.log</Link>
          <span>/</span>
          <span className="text-on-surface">post_{post.id}</span>
        </div>

        {/* Post Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden mb-8">
          {/* Card Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-50 bg-slate-50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(186,26,26,0.6)' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(90,95,101,0.6)' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(0,184,212,0.6)' }} />
            </div>
            <span className="text-[10px] font-mono text-outline uppercase tracking-widest">post_{post.id}.md</span>
          </div>

          <div className="p-8">
            {/* Post Meta */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-primary">@{post.nickname}</span>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-mono text-outline">{formatDate(post.created_at)}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-outline">
                      <span className="material-symbols-outlined text-xs">visibility</span>
                      {post.view_count}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-outline">
                      <span className="material-symbols-outlined text-xs">chat_bubble</span>
                      {boardComments.length}
                    </span>
                  </div>
                </div>
              </div>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono font-bold text-outline border border-outline-variant/20 rounded-lg hover:text-primary hover:border-primary transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    EDIT
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono font-bold text-outline border border-outline-variant/20 rounded-lg hover:text-error hover:border-error transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    DEL
                  </button>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight mb-6 leading-snug">
              {post.title}
            </h1>

            {/* Content */}
            <div className="border-t border-slate-50 pt-6">
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Post Like Button */}
            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-center">
              <button
                onClick={handlePostLike}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all text-sm font-mono font-bold ${
                  post.liked
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-white border-outline-variant/20 text-outline hover:border-primary hover:text-primary'
                }`}
              >
                <span className={`material-symbols-outlined text-base ${post.liked ? 'filled' : ''}`}>favorite</span>
                {post.like_count ?? 0}
              </button>
            </div>

            {/* Tagged Destinations */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] font-mono text-primary uppercase tracking-widest">tagged_destinations.log</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/explore/${tag.content_id}`}
                      className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all hover:shadow-md"
                    >
                      <div className="h-24 bg-slate-100 overflow-hidden">
                        {tag.firstimage ? (
                          <img
                            src={tag.firstimage}
                            alt={tag.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-300 text-3xl">image</span>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2 bg-white">
                        <p className="text-xs font-mono font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          <span className="text-primary/60 mr-1">#</span>{tag.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/board')}
          className="flex items-center gap-2 text-xs font-mono text-outline hover:text-primary transition-colors mb-8"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          BACK_TO_BOARD.SH
        </button>

        {/* Comments Section */}
        <div>
          <h3 className="font-headline font-bold text-lg mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">chat</span>
            댓글
            <span className="text-sm font-mono text-outline font-normal">({boardComments.length})</span>
          </h3>

          {/* Comment Input */}
          <div className="bg-white p-1 rounded-xl mb-6 shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/20 rounded-t-[4px]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(186,26,26,0.6)' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(90,95,101,0.6)' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(0,184,212,0.6)' }} />
              </div>
              <span className="text-[10px] font-mono text-outline uppercase tracking-widest">new_comment.md</span>
            </div>
            <div className="p-5">
              <div className="flex gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                </div>
                <textarea
                  className="flex-1 bg-transparent font-mono text-sm text-on-surface placeholder:text-outline resize-none outline-none leading-relaxed"
                  rows={3}
                  placeholder="// 댓글을 남겨주세요..."
                  value={boardCommentText}
                  onChange={(e) => setBoardCommentText(e.target.value)}
                  onFocus={handleBoardCommentFocus}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleBoardCommentSubmit}
                  disabled={boardCommentSubmitting || !boardCommentText.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold font-label hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {boardCommentSubmitting ? '// posting...' : 'COMMIT_COMMENT.SH'}
                </button>
              </div>
            </div>
          </div>

          {/* Comment List */}
          {boardComments.length === 0 ? (
            <p className="text-sm font-mono text-outline text-center py-6">// 아직 댓글이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {boardComments.map((comment) => {
                const isCommentOwner = user?.id && comment.user_id === user.id;
                const isEditing = boardCommentEditingId === comment.id;
                return (
                  <div key={comment.id} className="bg-white rounded-xl p-5 border border-outline-variant/10 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-sm">person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-xs font-mono font-bold text-primary">@{comment.nickname}</span>
                            <span className="text-[10px] text-outline font-mono ml-3">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isCommentOwner && !isEditing && (
                              <>
                                <button
                                  onClick={() => handleBoardCommentEditStart(comment)}
                                  className="text-[11px] font-mono text-outline hover:text-primary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button
                                  onClick={() => handleBoardCommentDelete(comment.id)}
                                  className="text-[11px] font-mono text-outline hover:text-error transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleBoardCommentLike(comment.id)}
                              className={`flex items-center gap-1 transition-colors text-[11px] font-mono ${comment.liked ? 'text-primary' : 'text-outline hover:text-primary'}`}
                            >
                              <span className={`material-symbols-outlined text-sm ${comment.liked ? 'filled' : ''}`}>favorite</span>
                              {comment.likes}
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div>
                            <textarea
                              className="w-full bg-surface-container-low font-mono text-sm text-on-surface resize-none outline-none leading-relaxed rounded-lg p-3 border border-primary/30 focus:border-primary transition-colors"
                              rows={3}
                              value={boardCommentEditText}
                              onChange={(e) => setBoardCommentEditText(e.target.value)}
                              autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={handleBoardCommentEditCancel}
                                className="px-3 py-1.5 text-xs font-bold font-label border border-outline-variant/30 rounded-lg text-on-secondary-container hover:bg-surface-container-high transition-all"
                              >
                                CANCEL
                              </button>
                              <button
                                onClick={() => handleBoardCommentEditSubmit(comment.id)}
                                disabled={!boardCommentEditText.trim()}
                                className="px-3 py-1.5 text-xs font-bold font-label bg-primary text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-40"
                              >
                                SAVE.SH
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 leading-relaxed font-mono">
                            <span className="text-outline">"</span>
                            {comment.body}
                            <span className="text-outline">"</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardDetail;
