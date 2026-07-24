import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDetailCommon, getDetailIntro, getDetailInfo, getDetailImage } from '../api/travelInfoApi';
import { getTravelComments, postTravelComment, updateTravelComment, deleteTravelComment, toggleTravelCommentLike } from '../api/travelCommentApi';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import useRecentlyViewedStore from '../store/useRecentlyViewedStore';
import WishlistModal from '../components/WishlistModal';
import useToast from '../hooks/useToast';
import '../App.css';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

const CONTENT_TYPE = {
  12: '관광지', 14: '문화시설', 15: '축제공연행사',
  25: '여행코스', 28: '레포츠', 32: '숙박', 38: '쇼핑', 39: '음식점',
};

const INTRO_FIELD_MAP = {
  infocenter: { label: '문의 및 안내', icon: 'info' },
  usetime: { label: '개방시간', icon: 'schedule' },
  restdate: { label: '휴무일', icon: 'event_busy' },
  parking: { label: '주차장', icon: 'local_parking' },
  usefee: { label: '입장료', icon: 'payments' },
  homepage: { label: '홈페이지', icon: 'language' },
};

const TravelDetail = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [loading, setLoading] = useState(true);
  const [common, setCommon] = useState(null);
  const [intro, setIntro] = useState(null);
  const [infoItems, setInfoItems] = useState([]);
  const [images, setImages] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [travelCommentText, setTravelCommentText] = useState('');
  const [travelComments, setTravelComments] = useState([]);
  const [travelCommentSubmitting, setTravelCommentSubmitting] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [travelCommentEditingId, setTravelCommentEditingId] = useState(null);
  const [travelCommentEditText, setTravelCommentEditText] = useState('');

  // 모달 관련 상태 추가
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTravel, setSelectedTravel] = useState(null);

  const mapRef = useRef(null);

  const { isLoggedIn, user } = useAuthStore();
  const showToast = useToast();
  const { wishlistIds, toggleWishlist, initWishlist, initialized: wishlistInitialized } = useWishlistStore();
  const { addItem: addRecentlyViewed } = useRecentlyViewedStore();

  useEffect(() => {
    if (!common?.title) return;
    addRecentlyViewed({
      contentid: String(contentId),
      title: common.title || '',
      firstimage: common.firstimage || '',
      addr1: common.addr1 || '',
    });
  }, [common?.title]);

  // 창 크기 변경 시 지도 중심 재조정
  useEffect(() => {
    const handleResize = () => {
      if (!mapRef.current || !common?.mapy || !common?.mapx) return;
      mapRef.current.relayout();
      mapRef.current.setCenter(new window.kakao.maps.LatLng(Number(common.mapy), Number(common.mapx)));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [common]);

  // 0. 위시리스트 초기화
  useEffect(() => {
    if (isLoggedIn && !wishlistInitialized) {
      initWishlist();
    }
  }, [isLoggedIn, wishlistInitialized]);

  const handleWishlistToggle = async () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }
    
    const id = String(contentId);
    
    // 이미 찜한 상태라면 즉시 삭제
    if (wishlistIds.has(id)) {
      try {
        const result = await toggleWishlist(common);
        if (!result.success) {
          showToast('위시리스트에서 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
          return;
        }
        showToast('위시리스트에서 삭제되었습니다.', 'success');
      } catch (error) {
        console.error('Wishlist toggle error:', error);
      }
    } else {
      // 처음 찜하는 상태라면 폴더 선택 모달 오픈
      setSelectedTravel(common);
      setIsModalOpen(true);
    }
  };

  // 1. 카카오 맵 스크립트 안정 로딩 (핵심 수정)
  useEffect(() => {
    const appKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    const scriptId = 'kakao-map-script';

    const initializeMap = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setIsMapLoaded(true);
        });
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services,clusterer,drawing&autoload=false`;
      script.async = true;
      document.head.appendChild(script);
      script.onload = initializeMap;
    } else {
      initializeMap();
    }
  }, []);

  // 2. 상세 데이터 페칭
  useEffect(() => {
    const fetchAll = async () => {
      if (!contentId) return;
      try {
        setLoading(true);
        const commonData = await getDetailCommon(contentId);
        if (!commonData) {
          setLoading(false);
          return;
        }
        setCommon(commonData);

        const contentTypeId = commonData.contenttypeid;
        const [introData, infoData, imageData, travelCommentsData] = await Promise.all([
          getDetailIntro(contentId, contentTypeId),
          getDetailInfo(contentId, contentTypeId),
          getDetailImage(contentId),
          getTravelComments(contentId),
        ]);

        setIntro(introData);
        setInfoItems(infoData?.items ?? []);
        setImages(imageData?.items ?? []);
        setTravelComments(travelCommentsData ?? []);
      } catch (err) {
        console.error('Fetch detail error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [contentId]);

  const handleTravelCommentFocus = (e) => {
    if (!isLoggedIn) {
      e.target.blur();
      setShowLoginDialog(true);
    }
  };

  const handleTravelCommentSubmit = async () => {
    if (!isLoggedIn || !travelCommentText.trim() || travelCommentSubmitting) return;
    try {
      setTravelCommentSubmitting(true);
      await postTravelComment({ contentId, nickname: user.name, body: travelCommentText.trim() });
      setTravelCommentText('');
      const updated = await getTravelComments(contentId);
      setTravelComments(updated);
    } catch (err) {
      console.error('Comment post error:', err);
    } finally {
      setTravelCommentSubmitting(false);
    }
  };

  const handleTravelCommentEditStart = (comment) => {
    setTravelCommentEditingId(comment.id);
    setTravelCommentEditText(comment.body);
  };

  const handleTravelCommentEditCancel = () => {
    setTravelCommentEditingId(null);
    setTravelCommentEditText('');
  };

  const handleTravelCommentEditSubmit = async (id) => {
    if (!travelCommentEditText.trim()) return;
    try {
      await updateTravelComment(id, travelCommentEditText.trim());
      setTravelCommentEditingId(null);
      setTravelCommentEditText('');
      setTravelComments(await getTravelComments(contentId));
    } catch (err) {
      console.error('Comment update error:', err);
    }
  };

  const handleTravelCommentDelete = async (id) => {
    if (!window.confirm('코멘트를 삭제하시겠습니까?')) return;
    try {
      await deleteTravelComment(id);
      setTravelComments(await getTravelComments(contentId));
    } catch (err) {
      console.error('Comment delete error:', err);
    }
  };

  const handleTravelCommentLike = async (commentId) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }
    // 낙관적 업데이트
    setTravelComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
    try {
      const { liked, likes } = await toggleTravelCommentLike(commentId);
      setTravelComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, liked, likes } : c))
      );
    } catch {
      // 실패 시 롤백
      setTravelComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
            : c
        )
      );
    }
  };

  const systemEnvFields = () => {
    const fields = [];
    const push = (icon, label, value) => {
      if (value && String(value).trim() && value !== 'null') {
        fields.push({ icon, label, value: String(value) });
      }
    };
    if (common?.tel) push('call', '전화번호', common.tel);
    if (common?.addr1) push('location_on', '주소', `${common.addr1} ${common.addr2 || ''}`);
    
    // 축제 기간 표시 추가
    if (String(common?.contenttypeid) === '15') {
      const start = intro?.eventstartdate || common?.eventstartdate;
      const end = intro?.eventenddate || common?.eventenddate;
      if (start) {
        const formattedDate = `${start.slice(0, 4)}.${start.slice(4, 6)}.${start.slice(6, 8)} ~ ${end ? `${end.slice(0, 4)}.${end.slice(4, 6)}.${end.slice(6, 8)}` : '미정'}`;
        push('calendar_month', '축제 기간', formattedDate);
      }
    }

    if (intro) {
      Object.entries(intro).forEach(([key, value]) => {
        const meta = INTRO_FIELD_MAP[key];
        if (meta && value) push(meta.icon, meta.label, value);
      });
    }
    return fields;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-xs font-mono text-outline animate-pulse">// fetching_destination_node...</p>
      </div>
    );
  }

  if (!common) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-on-secondary-container">
        <span className="material-symbols-outlined text-5xl mb-4 opacity-30">search_off</span>
        <p className="font-label text-sm syntax-comment">// destination_not_found</p>
        <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-label">BACK_TO_LIST</button>
      </div>
    );
  }

  const nodeHeaderImage = state?.firstimage || common.firstimage || (images.length > 0 ? (images[0].originimgurl || images[0].firstimage) : null);
  const envFields = systemEnvFields();

  return (
    <div className="bg-background text-on-surface font-body min-h-screen pb-20">

      {/* 로그인 유도 다이얼로그 */}
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
                <button
                  onClick={() => setShowLoginDialog(false)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold font-label border border-outline-variant/30 text-on-secondary-container hover:bg-surface-container-high transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => { setShowLoginDialog(false); navigate('/login'); }}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold font-label bg-primary text-white hover:brightness-110 transition-all"
                >
                  GO_TO_LOGIN.SH
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="relative h-[400px] w-full bg-slate-900 overflow-hidden">
        {nodeHeaderImage ? (
          <img alt={common.title} className="w-full h-full object-cover opacity-80" src={nodeHeaderImage} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <span className="material-symbols-outlined text-8xl text-slate-700">image_not_supported</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-10 left-10">
          <span className="bg-primary/20 backdrop-blur-md text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20 mb-4 inline-block">
            {CONTENT_TYPE[common.contenttypeid] || '기타'}
          </span>
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-headline font-extrabold text-white tracking-tighter drop-shadow-2xl">
              {common.title}
            </h1>
            <button 
              onClick={handleWishlistToggle}
              className={`group/heart relative flex items-center justify-center w-12 h-12 rounded-full transition-all shadow-lg active:scale-75 mt-1 select-none outline-none cursor-pointer ${
                wishlistIds.has(String(contentId)) 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/40'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl select-none ${wishlistIds.has(String(contentId)) ? 'fill-1' : ''}`}>
                favorite
              </span>
              {/* Classic Simple Bubbling Hearts */}
              <span className={`material-symbols-outlined heart-bubble heart-bubble-1 text-[10px] fill-1 select-none group-hover/heart:animate-[bubble-heart_1.5s_ease-out_infinite]`}>favorite</span>
              <span className={`material-symbols-outlined heart-bubble heart-bubble-2 text-[10px] fill-1 select-none group-hover/heart:animate-[bubble-heart_1.5s_ease-out_infinite_0.4s]`}>favorite</span>
            </button>
          </div>
        </div>
      </section>

      <div className="px-8 lg:px-12 py-10 grid grid-cols-12 gap-8 max-w-[1600px] mx-auto">
        <div className="col-span-12 lg:col-span-8 space-y-10">
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm font-mono text-sm leading-relaxed overflow-hidden">
            <div className="flex items-center gap-2 px-8 py-5 border-b border-slate-50">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-primary font-bold uppercase tracking-tighter">node_description.log</p>
            </div>
            <div className="px-8 py-5">
              {common.overview ? (
                <div className="text-slate-600 leading-loose" dangerouslySetInnerHTML={{ __html: common.overview }} />
              ) : (
                <p className="text-slate-400 italic">// No description available.</p>
              )}
            </div>
          </div>

          {infoItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-8 py-5 border-b border-slate-50">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <p className="text-primary font-bold uppercase tracking-tighter font-mono text-sm">detail_info.json</p>
              </div>
              <div className="divide-y divide-slate-50">
                {infoItems
                  .filter(item => item.infoname && item.infotext && String(item.infotext).trim())
                  .map((item, i) => (
                    <div key={i} className="flex gap-4 px-8 py-3.5 hover:bg-slate-50/60 transition-colors">
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase shrink-0 w-36 pt-0.5">
                        {item.infoname}
                      </span>
                      <span
                        className="text-sm text-slate-700 leading-relaxed font-body flex-1"
                        dangerouslySetInnerHTML={{ __html: String(item.infotext) }}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {images.map((img, i) => (
                <img key={i} src={img.originimgurl || img.firstimage || img.smallimageurl} className="rounded-xl h-48 w-full object-cover border border-outline-variant/10 shadow-sm" alt="gallery" />
              ))}
            </div>
          )}

        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6">
            <h3 className="font-headline font-bold flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">terminal</span>
              system.env
            </h3>
            <div className="space-y-4">
              {envFields.map((field, i) => (
                <div key={i} className="flex gap-3">
                  <span className="material-symbols-outlined text-slate-300 text-lg">{field.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{field.label}</p>
                    <p className="text-sm text-on-surface font-medium">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate(-1)} className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all border border-slate-200">
              RETURN_TO_LIST
            </button>
          </div>

          {/* Map Area */}
          {common.mapx && common.mapy && (
            <div
              className="rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm h-[300px] relative bg-slate-100 cursor-pointer group"
              onClick={() => {
                window.open(`https://map.kakao.com/link/to/${common.title},${common.mapy},${common.mapx}`, '_blank');
              }}
            >
              {!isMapLoaded ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <p className="text-[10px] text-outline font-mono animate-pulse">Initializing Map SDK...</p>
                </div>
              ) : (
                <>
                  <Map
                    center={{ lat: Number(common.mapy), lng: Number(common.mapx) }}
                    style={{ width: '100%', height: '100%' }}
                    level={3}
                    draggable={false}
                    zoomable={false}
                    scrollwheel={false}
                    onCreate={(map) => {
                      mapRef.current = map;
                      map.relayout();
                      map.setCenter(new window.kakao.maps.LatLng(Number(common.mapy), Number(common.mapx)));
                    }}
                  >
                    <MapMarker position={{ lat: Number(common.mapy), lng: Number(common.mapx) }} />
                  </Map>
                  <div className="absolute inset-0 flex items-end justify-end p-3 pointer-events-none">
                    <span className="bg-black/50 text-white text-[10px] font-mono px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      카카오맵에서 보기
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="col-span-12">
          <h3 className="font-headline font-bold text-lg mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">chat</span>
            코멘트
          </h3>

          {/* Comment Input */}
          <div className="bg-surface-container-low p-1 rounded-lg mb-6 shadow-sm border border-outline-variant/10">
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
                  placeholder="// 여행 후기를 남겨주세요..."
                  value={travelCommentText}
                  onChange={(e) => setTravelCommentText(e.target.value)}
                  onFocus={handleTravelCommentFocus}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleTravelCommentSubmit}
                  disabled={travelCommentSubmitting || !travelCommentText.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold font-label hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {travelCommentSubmitting ? '// posting...' : 'COMMIT_COMMENT.SH'}
                </button>
              </div>
            </div>
          </div>

          {/* Comment List */}
          {travelComments.length === 0 ? (
            <p className="text-sm font-mono text-outline text-center py-6">// 아직 코멘트가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {travelComments.map((comment) => {
                const isOwner = user?.id && comment.user_id === user.id;
                const isEditing = travelCommentEditingId === comment.id;
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
                              {new Date(comment.created_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isOwner && !isEditing && (
                              <>
                                <button
                                  onClick={() => handleTravelCommentEditStart(comment)}
                                  className="text-[11px] font-mono text-outline hover:text-primary transition-colors flex items-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button
                                  onClick={() => handleTravelCommentDelete(comment.id)}
                                  className="text-[11px] font-mono text-outline hover:text-error transition-colors flex items-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleTravelCommentLike(comment.id)}
                              className={`flex items-center gap-1 transition-colors text-[11px] font-mono ${comment.liked ? 'text-primary' : 'text-outline hover:text-primary'}`}
                            >
                              <span className={`material-symbols-outlined text-sm ${comment.liked ? 'filled' : ''}`}>
                                favorite
                              </span>
                              {comment.likes}
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div>
                            <textarea
                              className="w-full bg-surface-container-low font-mono text-sm text-on-surface resize-none outline-none leading-relaxed rounded-lg p-3 border border-primary/30 focus:border-primary transition-colors"
                              rows={3}
                              value={travelCommentEditText}
                              onChange={(e) => setTravelCommentEditText(e.target.value)}
                              autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={handleTravelCommentEditCancel}
                                className="px-3 py-1.5 text-xs font-bold font-label border border-outline-variant/30 rounded-lg text-on-secondary-container hover:bg-surface-container-high transition-all"
                              >
                                CANCEL
                              </button>
                              <button
                                onClick={() => handleTravelCommentEditSubmit(comment.id)}
                                disabled={!travelCommentEditText.trim()}
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

      {/* 위시리스트 폴더 선택 모달 */}
      <WishlistModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTravel(null);
        }}
        travelData={selectedTravel}
      />
    </div>
  );
};

export default TravelDetail;
