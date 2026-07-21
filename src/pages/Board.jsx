import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBoardPosts } from '../api/boardApi';
import useAuthStore from '../store/useAuthStore';
import useBoardWriteStore from '../store/useBoardWriteStore';
import useToast from '../hooks/useToast';
import PageHeader from '../components/PageHeader';

const NUM_OF_ROWS = 10;

const Board = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const resetForm = useBoardWriteStore((s) => s.resetForm);
  const showToast = useToast();

  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState('created_at');

  const SORT_OPTIONS = [
    { value: 'created_at', label: 'CREATED_AT' },
    { value: 'updated_at', label: 'UPDATED_AT' },
    { value: 'likes', label: 'MOST_LIKED' },
  ];

  const fetchPosts = useCallback(async (page, kw, sortBy) => {
    setLoading(true);
    try {
      const data = await getBoardPosts({ pageNo: page, numOfRows: NUM_OF_ROWS, keyword: kw, sort: sortBy });
      setPosts(data.posts || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
      showToast('게시글을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPosts(currentPage, keyword, sort);
  }, [currentPage, keyword, sort, fetchPosts]);

  const handleSortChange = (newSort) => {
    setSort(newSort);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setKeyword(searchInput);
  };

  const handleNewPost = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    resetForm();
    navigate('/board/write');
  };

  const totalPages = Math.ceil(totalCount / NUM_OF_ROWS);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="bg-background text-on-surface font-body min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <PageHeader
            label="board.log"
            title="여행 게시판"
            description="여행 경험을 공유하고 여행지를 태그해보세요."
            action={(
              <button
              onClick={handleNewPost}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold font-label hover:brightness-110 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-sm">edit_square</span>
                NEW_POST.SH
              </button>
            )}
          />
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-3 bg-white border border-outline-variant/20 rounded-xl px-4 py-3 focus-within:border-primary transition-colors shadow-sm">
              <span className="material-symbols-outlined text-outline text-lg">search</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="// search_posts..."
                className="flex-1 bg-transparent font-mono text-sm text-on-surface placeholder:text-outline outline-none"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setKeyword(''); setCurrentPage(1); }}>
                  <span className="material-symbols-outlined text-outline hover:text-on-surface text-lg transition-colors">close</span>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-primary text-white rounded-xl text-xs font-bold font-label hover:brightness-110 transition-all"
            >
              SEARCH
            </button>
          </div>
        </form>

        {/* Post Count & Sort */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-mono text-outline">
            <span className="text-primary">{totalCount}</span> posts_found
            {keyword && <span className="ml-2 text-tertiary">// query: "{keyword}"</span>}
          </p>
          <div className="flex items-center gap-3">
            <p className="text-xs font-mono text-outline">
              page {currentPage} / {totalPages || 1}
            </p>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-surface-container-low text-[10px] font-mono px-3 py-1.5 rounded-lg outline-none border border-outline-variant/10 cursor-pointer uppercase font-bold tracking-tighter"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Post List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-xs font-mono text-outline animate-pulse">// loading_posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <span className="material-symbols-outlined text-5xl text-outline/30">article</span>
            <p className="text-sm font-mono text-outline">// no_posts_found</p>
            {isLoggedIn && (
              <button onClick={handleNewPost} className="mt-2 text-xs font-bold text-primary font-label hover:underline">
                첫 번째 게시글을 작성해보세요 →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/board/${post.id}`}
                className="block bg-white border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
              >
                {/* Meta */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-xs">person</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">@{post.nickname}</span>
                  </div>
                  <span className="text-[10px] font-mono text-outline">{formatDate(post.created_at)}</span>
                </div>

                {/* Title */}
                <h2 className="font-headline font-bold text-base text-on-surface group-hover:text-primary transition-colors mb-2 leading-snug">
                  {post.title}
                </h2>

                {/* Content Preview */}
                <p className="text-sm font-mono text-slate-500 leading-relaxed line-clamp-2 mb-4">
                  {post.content}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-mono font-bold border border-primary/10"
                      >
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {tag.title}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="px-2 py-1 bg-slate-50 text-outline rounded-lg text-[10px] font-mono border border-outline-variant/10">
                        +{post.tags.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-outline">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">favorite</span>
                      {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">chat_bubble</span>
                      {post.comment_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      {post.view_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg text-xs font-mono text-outline border border-outline-variant/20 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page;
              if (totalPages <= 7) page = i + 1;
              else if (currentPage <= 4) page = i + 1;
              else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
              else page = currentPage - 3 + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                    currentPage === page
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'text-outline border-outline-variant/20 hover:border-primary hover:text-primary'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg text-xs font-mono text-outline border border-outline-variant/20 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Board;
