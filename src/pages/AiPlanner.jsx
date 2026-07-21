import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateTripPlan } from '../api/geminiApi';
import { saveAiTripToFolder } from '../api/wishlistApi';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import useToast from '../hooks/useToast';
import PageHeader from '../components/PageHeader';

const STYLE_OPTIONS = ['실내', '문화', '맛집', '자연', '힐링', '카페', '사진', '역사'];
const AVOID_OPTIONS = ['장거리 이동', '등산', '혼잡한 장소', '야외 위주', '비싼 코스'];

const DEFAULT_FORM = {
  regionName: '서울',
  durationDays: 1,
  companionType: '친구',
  budgetLevel: '보통',
  pace: '여유',
  weatherKeyword: '',
  startTime: '10:00',
  endTime: '18:00',
  travelStyle: ['실내', '문화'],
  avoidKeywords: [],
};

const toggleValue = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const FieldLabel = ({ children }) => (
  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
    {children}
  </label>
);

const AiPlanner = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const { isLoggedIn } = useAuthStore();
  const { wishlistItems, initWishlist, syncWithServer } = useWishlistStore();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedContentIds, setSelectedContentIds] = useState(new Set());
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      showToast('로그인 후 이용할 수 있습니다.');
      navigate('/login');
      return;
    }
    initWishlist();
  }, [isLoggedIn, initWishlist, navigate, showToast]);

  const selectedPlaces = useMemo(
    () => wishlistItems.filter((item) => selectedContentIds.has(String(item.contentid || item.contentId))),
    [wishlistItems, selectedContentIds]
  );

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleGenerate = async () => {
    if (!form.regionName.trim()) {
      showToast('여행 지역을 입력해주세요.');
      return;
    }

    setGenerating(true);
    setPlan(null);
    try {
      const result = await generateTripPlan({
        ...form,
        regionName: form.regionName.trim(),
        durationDays: Number(form.durationDays) || 1,
        preferredPlaces: selectedPlaces,
      });
      setPlan(result);
      showToast('AI 여행 코스를 생성했습니다.', 'success');
    } catch (error) {
      console.error('Gemini trip generation failed:', error);
      showToast(error.message || 'AI 코스를 생성하지 못했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const result = await saveAiTripToFolder(plan);
      await syncWithServer();
      showToast(`AI 코스를 "${result.folder.name}" 폴더로 저장했습니다.`, 'success');
    } catch (error) {
      console.error('Save AI trip failed:', error);
      showToast('AI 코스를 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-24 md:pb-8">
      <PageHeader
        label="ai_trip.planner"
        title="AI 여행 코스"
        description="조건을 입력하고 저장 가능한 여행 코스를 생성합니다."
        action={(
          <button
            type="button"
            onClick={() => navigate('/mypage')}
            className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-lg border border-outline-variant/50 text-slate-600 hover:text-primary hover:border-primary/40 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-base">folder</span>
            My Folders
          </button>
        )}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <section className="bg-white border border-outline-variant/30 rounded-xl shadow-sm p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Region</FieldLabel>
              <input
                value={form.regionName}
                onChange={(e) => updateForm('regionName', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
                placeholder="서울"
              />
            </div>
            <div>
              <FieldLabel>Days</FieldLabel>
              <input
                type="number"
                min="1"
                max="5"
                value={form.durationDays}
                onChange={(e) => updateForm('durationDays', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Companion</FieldLabel>
              <select
                value={form.companionType}
                onChange={(e) => updateForm('companionType', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm bg-white"
              >
                {['혼자', '연인', '가족', '친구'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Budget</FieldLabel>
              <select
                value={form.budgetLevel}
                onChange={(e) => updateForm('budgetLevel', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm bg-white"
              >
                {['낮음', '보통', '높음'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Pace</FieldLabel>
              <select
                value={form.pace}
                onChange={(e) => updateForm('pace', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm bg-white"
              >
                {['여유', '보통', '알참'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Start</FieldLabel>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateForm('startTime', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <FieldLabel>End</FieldLabel>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateForm('endTime', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Weather</FieldLabel>
            <input
              value={form.weatherKeyword}
              onChange={(e) => updateForm('weatherKeyword', e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              placeholder="비, 맑음, 더움"
            />
          </div>

          <div>
            <FieldLabel>Style</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateForm('travelStyle', toggleValue(form.travelStyle, style))}
                  className={`px-3 h-9 rounded-lg border text-xs font-bold transition-colors ${
                    form.travelStyle.includes(style)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-500 border-outline-variant/40 hover:border-primary/50'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Avoid</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {AVOID_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateForm('avoidKeywords', toggleValue(form.avoidKeywords, item))}
                  className={`px-3 h-9 rounded-lg border text-xs font-bold transition-colors ${
                    form.avoidKeywords.includes(item)
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-outline-variant/40 hover:border-slate-400'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Wishlist Candidates</FieldLabel>
            <div className="max-h-44 overflow-y-auto border border-outline-variant/30 rounded-lg divide-y divide-outline-variant/20">
              {wishlistItems.length === 0 ? (
                <p className="text-xs text-slate-400 font-mono p-4">// no_wishlist_candidates</p>
              ) : (
                wishlistItems.slice(0, 20).map((item) => {
                  const id = String(item.contentid || item.contentId);
                  const selected = selectedContentIds.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedContentIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs transition-colors ${
                        selected ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{selected ? 'check_circle' : 'radio_button_unchecked'}</span>
                      <span className="truncate font-semibold">{item.title}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full h-12 rounded-lg bg-primary text-white font-black text-sm uppercase tracking-wider hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">{generating ? 'hourglass_top' : 'auto_awesome'}</span>
            {generating ? 'Generating...' : 'Generate Course'}
          </button>
        </section>

        <section className="min-h-[620px] bg-white border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
          {!plan ? (
            <div className="h-full min-h-[620px] flex flex-col items-center justify-center text-center px-6">
              <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">travel_explore</span>
              <p className="font-mono text-xs text-slate-400">// generated_course_preview</p>
            </div>
          ) : (
            <div className="p-5 md:p-6 space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(plan.tags || []).map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">{plan.title}</h2>
                  <p className="text-sm text-slate-500 mt-3 leading-6">{plan.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 px-4 rounded-lg bg-slate-950 text-white text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-base">{saving ? 'hourglass_top' : 'save'}</span>
                  {saving ? 'Saving...' : 'Save Folder'}
                </button>
              </div>

              <div className="space-y-5">
                {(plan.days || []).map((day) => (
                  <article key={day.day} className="border border-outline-variant/30 rounded-xl overflow-hidden">
                    <header className="px-4 py-3 bg-slate-50 border-b border-outline-variant/20 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Day {day.day}</p>
                        <h3 className="text-sm font-black text-slate-800">{day.theme}</h3>
                      </div>
                      <span className="material-symbols-outlined text-primary/60">route</span>
                    </header>
                    <div className="divide-y divide-outline-variant/20">
                      {(day.items || []).map((item, index) => (
                        <div key={`${day.day}-${item.order || index}`} className="p-4 grid grid-cols-[68px_1fr] gap-4">
                          <div className="text-xs font-black text-primary font-mono">{item.time || '--:--'}</div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-slate-900">{item.placeName}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">{item.category}</span>
                              {item.contentId && <span className="text-[10px] px-2 py-0.5 rounded bg-primary/5 text-primary font-bold">TourAPI</span>}
                            </div>
                            {item.address && <p className="text-xs text-slate-400 mt-1">{item.address}</p>}
                            <p className="text-sm text-slate-600 mt-3 leading-6">{item.reason}</p>
                            {item.tip && <p className="text-xs text-slate-400 mt-2 font-mono">// {item.tip}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-outline-variant/30 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Folder</p>
                  <p className="font-black text-slate-900">{plan.saveGuide?.folderName}</p>
                  <p className="text-sm text-slate-500 mt-2 leading-6">{plan.saveGuide?.memo}</p>
                </div>
                <div className="border border-outline-variant/30 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Checklist</p>
                  <ul className="space-y-2">
                    {(plan.saveGuide?.checklist || []).map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="material-symbols-outlined text-base text-primary mt-0.5">check_circle</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AiPlanner;
