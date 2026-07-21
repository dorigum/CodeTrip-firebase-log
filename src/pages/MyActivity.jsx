import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { getMyBoardPosts, getMyBoardComments, getMyTravelComments, getMyLikedPosts, deleteBoardPost, deleteBoardComment, toggleBoardPostLike } from '../api/boardApi';
import { deleteTravelComment } from '../api/travelCommentApi';
import useToast from '../hooks/useToast';
import useRecentlyViewedStore from '../store/useRecentlyViewedStore';
import PageHeader from '../components/PageHeader';

const TABS = [
  { key: 'likedPosts',     label: 'Liked Posts',      icon: 'favorite' },
  { key: 'posts',          label: 'Board Posts',      icon: 'article' },
  { key: 'boardComments',  label: 'Board Comments',   icon: 'comment' },
  { key: 'travelComments', label: 'Travel Comments',  icon: 'chat' },
];

const PAGE_SIZE = 5;
const VALID_TABS = new Set(TABS.map(t => t.key));

const formatDate = (str) => {
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <span className="material-symbols-outlined text-5xl text-slate-200">inbox</span>
    <p className="text-xs font-mono text-slate-400">{message}</p>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 mt-6 font-mono">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-on-secondary-container hover:bg-surface-container-high disabled:opacity-30 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
            page === currentPage
              ? 'bg-primary text-white shadow-md scale-110'
              : 'text-on-secondary-container hover:bg-surface-container-high'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-on-secondary-container hover:bg-surface-container-high disabled:opacity-30 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
};

const MyActivity = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn } = useAuthStore();
  const showToast = useToast();

  const { items: recentlyViewed, clearAll: clearRecentlyViewed } = useRecentlyViewedStore();

  const activeTab = VALID_TABS.has(searchParams.get('tab')) ? searchParams.get('tab') : 'likedPosts';
  const currentPage = Math.max(1, parseInt(searchParams.get('page')) || 1);

  const setActiveTab = (key) => setSearchParams({ tab: key, page: '1' }, { replace: true });
  const setPage = (page) => setSearchParams({ tab: activeTab, page: String(page) }, { replace: true });

  const [posts, setPosts] = useState([]);
  const [boardComments, setBoardComments] = useState([]);
  const [travelComments, setTravelComments] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    const load = async () => {
      setLoading(true);
      try {
        const [p, bc, tc, lp] = await Promise.all([
          getMyBoardPosts(),
          getMyBoardComments(),
          getMyTravelComments(),
          getMyLikedPosts(),
        ]);
        setPosts(p);
        setBoardComments(bc);
        setTravelComments(tc);
        setLikedPosts(lp);
      } catch {
        showToast('활동 데이터를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isLoggedIn, navigate, showToast]);

  const handleDeletePost = async (id) => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;
    await deleteBoardPost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleDeleteBoardComment = async (id) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    await deleteBoardComment(id);
    setBoardComments(prev => prev.filter(c => c.id !== id));
  };

  const handleUnlikePost = async (id) => {
    if (!window.confirm('좋아요를 취소하시겠습니까?')) return;
    setLikedPosts(prev => prev.filter(p => p.id !== id));
    try {
      await toggleBoardPostLike(id);
    } catch {
      const lp = await getMyLikedPosts();
      setLikedPosts(lp);
    }
  };

  const handleDeleteTravelComment = async (id) => {
    if (!window.confirm('코멘트를 삭제하시겠습니까?')) return;
    await deleteTravelComment(id);
    setTravelComments(prev => prev.filter(c => c.id !== id));
  };

  const paginate = (data) => {
    const totalPages = Math.ceil(data.length / PAGE_SIZE);
    const safePage = Math.min(currentPage, Math.max(1, totalPages));
    const items = data.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    return { items, totalPages, safePage };
  };

  const counts = { posts: posts.length, boardComments: boardComments.length, travelComments: travelComments.length, likedPosts: likedPosts.length };

  const { items: pagedPosts,          totalPages: postPages,    safePage: postPage }    = paginate(posts);
  const { items: pagedBoardComments,  totalPages: bcPages,      safePage: bcPage }      = paginate(boardComments);
  const { items: pagedTravelComments, totalPages: tcPages,      safePage: tcPage }      = paginate(travelComments);
  const { items: pagedLikedPosts,     totalPages: lpPages,      safePage: lpPage }      = paginate(likedPosts);

  return (
    <div className="p-8 max-w-[1000px] mx-auto min-h-screen">
      <PageHeader
        className="mb-8"
        label="my_activity.log"
        title="내 활동"
        description="좋아요, 게시글, 댓글, 최근 본 여행지를 한 곳에서 확인하세요."
      />

      {/* Recently Viewed — pinned above tabs */}
      {recentlyViewed.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">history</span>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">recently_viewed.log</span>
            </div>
            <button
              onClick={clearRecentlyViewed}
              className="text-[10px] font-mono text-slate-400 hover:text-red-400 transition-colors"
            >
              전체 삭제
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            {recentlyViewed.map((item) => (
              <Link
                key={item.contentid}
                to={`/explore/${item.contentid}`}
                className="shrink-0 w-40 group"
              >
                <div className="relative h-28 rounded-xl overflow-hidden mb-2 border border-outline-variant/10 group-hover:border-primary/30 transition-all shadow-sm">
                  <img
                    src={item.firstimage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop'; }}
                  />
                </div>
                <p className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">{item.title}</p>
                <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{item.addr1 || '주소 정보 없음'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-surface-container-low p-1 rounded-xl border border-outline-variant/10 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-tighter transition-all ${
              activeTab === tab.key
                ? 'bg-white text-primary shadow-sm border border-outline-variant/10'
                : 'text-slate-400 hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
              activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          <p className="text-xs font-mono text-outline animate-pulse">// loading_activity...</p>
        </div>
      ) : (
        <>
          {/* Board Posts */}
          {activeTab === 'posts' && (
            <>
              <div className="space-y-3">
                {posts.length === 0 ? <EmptyState message="// no_posts_found" /> : pagedPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-xl border border-outline-variant/10 shadow-sm hover:border-primary/20 transition-all group">
                    <div className="flex items-start gap-4 p-5">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/board/${post.id}`}
                          className="block text-sm font-headline font-bold text-on-surface hover:text-primary transition-colors truncate mb-1.5"
                        >
                          {post.title}
                        </Link>
                        <p className="text-xs text-slate-400 line-clamp-1 font-body mb-3">
                          {post.content?.replace(/<[^>]+>/g, '') || ''}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">favorite</span>
                            {post.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">visibility</span>
                            {post.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">comment</span>
                            {post.comment_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/board/write`}
                          state={{ editPost: post }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </Link>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={postPage} totalPages={postPages} onPageChange={setPage} />
            </>
          )}

          {/* Board Comments */}
          {activeTab === 'boardComments' && (
            <>
              <div className="space-y-3">
                {boardComments.length === 0 ? <EmptyState message="// no_comments_found" /> : pagedBoardComments.map(comment => (
                  <div key={comment.id} className="bg-white rounded-xl border border-outline-variant/10 shadow-sm hover:border-primary/20 transition-all group">
                    <div className="flex items-start gap-4 p-5">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/board/${comment.post_id}`}
                          className="flex items-center gap-1.5 text-sm font-mono text-slate-400 hover:text-primary transition-colors mb-1.5 w-fit"
                        >
                          <span className="material-symbols-outlined text-xs">article</span>
                          <span className="truncate max-w-xs">{comment.post_title}</span>
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </Link>
                        <p className="text-xs text-slate-700 font-body line-clamp-1 mb-3">
                          <span className="text-outline font-mono">"</span>
                          {comment.body}
                          <span className="text-outline font-mono">"</span>
                        </p>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">favorite</span>
                            {comment.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBoardComment(comment.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={bcPage} totalPages={bcPages} onPageChange={setPage} />
            </>
          )}

          {/* Liked Posts */}
          {activeTab === 'likedPosts' && (
            <>
              <div className="space-y-3">
                {likedPosts.length === 0 ? <EmptyState message="// no_liked_posts_found" /> : pagedLikedPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-xl border border-outline-variant/10 shadow-sm hover:border-primary/20 transition-all group">
                    <div className="flex items-start gap-4 p-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 min-w-0">
                          <Link
                            to={`/board/${post.id}`}
                            className="text-sm font-headline font-bold text-on-surface hover:text-primary transition-colors truncate"
                          >
                            {post.title}
                          </Link>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">@{post.nickname}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 font-body mb-3">
                          {post.content?.replace(/<[^>]+>/g, '') || ''}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                          <span className="flex items-center gap-1 text-primary font-bold">
                            <span className="material-symbols-outlined text-xs filled">favorite</span>
                            {post.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">visibility</span>
                            {post.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">comment</span>
                            {post.comment_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnlikePost(post.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                        title="좋아요 취소"
                      >
                        <span className="material-symbols-outlined text-sm filled">favorite</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={lpPage} totalPages={lpPages} onPageChange={setPage} />
            </>
          )}

          {/* Travel Comments */}
          {activeTab === 'travelComments' && (
            <>
              <div className="space-y-3">
                {travelComments.length === 0 ? <EmptyState message="// no_travel_comments_found" /> : pagedTravelComments.map(comment => (
                  <div key={comment.id} className="bg-white rounded-xl border border-outline-variant/10 shadow-sm hover:border-primary/20 transition-all group">
                    <div className="flex items-start gap-4 p-5">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/explore/${comment.content_id}`}
                          className="flex items-center gap-1.5 text-sm font-mono text-slate-400 hover:text-primary transition-colors mb-1.5 w-fit"
                        >
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          <span className="truncate max-w-xs">{comment.title || comment.content_id}</span>
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </Link>
                        <p className="text-xs text-slate-700 font-body line-clamp-1 mb-3">
                          <span className="text-outline font-mono">"</span>
                          {comment.body}
                          <span className="text-outline font-mono">"</span>
                        </p>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">favorite</span>
                            {comment.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTravelComment(comment.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={tcPage} totalPages={tcPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyActivity;
