import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import authApi from '../api/authApi';
import { DEFAULT_REGIONS } from '../constants/regions';
import useToast from '../hooks/useToast';
import PageHeader from '../components/PageHeader';

const SELECTABLE_REGIONS = DEFAULT_REGIONS.filter(r => r.code !== '');

const MAX_UPLOAD_BYTES = 1024 * 1024; // 1MB
const MAX_DIMENSION = 1920;

const compressImage = (file) =>
  new Promise((resolve) => {
    // 이미 1MB 이하면 압축 없이 그대로 반환
    if (file.size <= MAX_UPLOAD_BYTES) { resolve(file); return; }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        if (w >= h) { h = Math.round(h * MAX_DIMENSION / w); w = MAX_DIMENSION; }
        else { w = Math.round(w * MAX_DIMENSION / h); h = MAX_DIMENSION; }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);

      let quality = 0.85;
      const tryBlob = () => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          if (blob.size <= MAX_UPLOAD_BYTES || quality < 0.1) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          } else {
            quality = Math.max(0.05, quality - 0.1);
            tryBlob();
          }
        }, 'image/jpeg', quality);
      };
      tryBlob();
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

const Settings = () => {
  const { user, updateUser, isLoggedIn } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Authentication Check
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileImg, setProfileImg] = useState(user?.profileImg || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  const showToast = useToast();

  // Favorite Regions State
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [regionsMessage, setRegionsMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const codes = await authApi.getFavoriteRegions();
        setSelectedRegions(codes);
      } catch {
        showToast('관심지역을 불러오는 데 실패했습니다.');
      }
    };
    load();
  }, [showToast]);

  const handleToggleRegion = (code) => {
    setSelectedRegions(prev => {
      if (prev.includes(code)) return prev.filter(c => c !== code);
      if (prev.length >= 3) return prev;
      return [...prev, code];
    });
  };

  const handleSaveRegions = async () => {
    setRegionsLoading(true);
    setRegionsMessage({ type: '', text: '' });
    try {
      await authApi.updateFavoriteRegions(selectedRegions);
      setRegionsMessage({ type: 'success', text: '관심지역이 저장되었습니다.' });
    } catch (err) {
      setRegionsMessage({ type: 'error', text: err.message || '저장에 실패했습니다.' });
    } finally {
      setRegionsLoading(false);
    }
  };

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      await authApi.updateProfile({ name: profileName, profileImg });
      updateUser({ name: profileName, profileImg });
      setProfileMessage({ type: 'success', text: '프로필 정보가 업데이트되었습니다.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || '업데이트에 실패했습니다.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate File Type
    if (!file.type.startsWith('image/')) {
      return setProfileMessage({ type: 'error', text: '이미지 파일만 업로드 가능합니다.' });
    }

    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('profileImage', compressed);
      const response = await authApi.uploadImage(formData);
      setProfileImg(response.url);
      setProfileMessage({ type: 'success', text: '이미지가 업로드되었습니다. 저장 버튼을 눌러 확정하세요.' });
    } catch {
      setProfileMessage({ type: 'error', text: '이미지 업로드에 실패했습니다.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setPwdMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
    }

    setPwdLoading(true);
    setPwdMessage({ type: '', text: '' });

    try {
      await authApi.updatePassword({ currentPassword, newPassword });
      setPwdMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdMessage({ type: 'error', text: err.message || '현재 비밀번호가 틀렸거나 변경에 실패했습니다.' });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-background overflow-y-auto custom-scrollbar p-10">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Page Title */}
        <PageHeader
          className="border-b border-outline-variant/15 pb-6"
          label="account_settings.exe"
          title="계정 설정"
          description="프로필, 관심지역, 보안 정보를 관리합니다."
        />

        {/* SECTION 1: PROFILE UPDATE (Photo + Name) */}
        <section className="bg-surface-container-low rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">person</span>
              <h2 className="font-headline font-bold text-on-surface">프로필 수정</h2>
            </div>
            <span className="text-[10px] font-mono text-outline uppercase tracking-widest">// update_public_info</span>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row gap-10">
              {/* Profile Image Column */}
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current.click()}
                >
                  <img 
                    src={profileImg || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                    alt="Preview" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-xl transition-all group-hover:scale-105 group-hover:brightness-90"
                    onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                  />
                  <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">upload_file</span>
                  </div>
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-[10px] font-mono bg-surface-container-highest px-3 py-1 rounded-full text-primary hover:bg-primary hover:text-white transition-all uppercase tracking-tighter"
                >
                  Change_Photo
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setProfileImg('');
                    setProfileMessage({ type: 'success', text: '기본 이미지로 설정되었습니다. 저장 버튼을 눌러 확정하세요.' });
                  }}
                  className="text-[10px] font-mono bg-surface-container-highest px-3 py-1 rounded-full text-secondary hover:bg-primary/10 hover:text-primary transition-all uppercase tracking-tighter"
                >
                  Reset_Photo
                </button>
              </div>

              {/* Inputs Column */}
              <div className="flex-1 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-label text-secondary uppercase font-bold tracking-wider ml-1">Profile_Image_URL (Short URLs only)</label>
                  <input 
                    type="text" 
                    value={profileImg}
                    onChange={(e) => setProfileImg(e.target.value)}
                    placeholder="https://example.com/avatar.png (255자 이내)"
                    className="w-full bg-background border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-mono text-on-surface"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-label text-secondary uppercase font-bold tracking-wider ml-1">Display_Name</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="닉네임"
                    className="w-full bg-background border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-headline text-on-surface"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Profile Action Button Area */}
            <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
              <div>
                {profileMessage.text && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold ${profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} animate-in fade-in slide-in-from-left-2`}>
                    <span className="material-symbols-outlined text-xs">{profileMessage.type === 'success' ? 'check_circle' : 'warning'}</span>
                    {profileMessage.text}
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={profileLoading}
                className="bg-primary text-white px-8 py-3 rounded-xl font-label text-xs font-bold tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {profileLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full" />
                ) : (
                  <span className="material-symbols-outlined text-sm">save</span>
                )}
                SAVE_PROFILE_CHANGES
              </button>
            </div>
          </form>
        </section>

        {/* SECTION 2: FAVORITE REGIONS */}
        <section className="bg-surface-container-low rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <h2 className="font-headline font-bold text-on-surface">관심지역 설정</h2>
            </div>
            <span className="text-[10px] font-mono text-outline uppercase tracking-widest">// max_3_regions</span>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-label text-secondary uppercase font-bold tracking-wider ml-1">
                  Favorite_Regions
                </label>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  selectedRegions.length >= 3
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {selectedRegions.length} / 3
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SELECTABLE_REGIONS.map(region => {
                  const isSelected = selectedRegions.includes(region.code);
                  const isDisabled = !isSelected && selectedRegions.length >= 3;
                  return (
                    <button
                      key={region.code}
                      type="button"
                      onClick={() => handleToggleRegion(region.code)}
                      disabled={isDisabled}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : isDisabled
                            ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'bg-background text-on-surface border-outline-variant/20 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {isSelected && <span className="material-symbols-outlined text-xs align-middle mr-0.5">check</span>}
                      {region.name}
                    </button>
                  );
                })}
              </div>
              {selectedRegions.length >= 3 && (
                <p className="text-[11px] font-mono text-primary animate-in fade-in">
                  // 최대 3개까지 선택할 수 있습니다.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
              <div>
                {regionsMessage.text && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold ${regionsMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} animate-in fade-in slide-in-from-left-2`}>
                    <span className="material-symbols-outlined text-xs">{regionsMessage.type === 'success' ? 'check_circle' : 'warning'}</span>
                    {regionsMessage.text}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveRegions}
                disabled={regionsLoading}
                className="bg-primary text-white px-8 py-3 rounded-xl font-label text-xs font-bold tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {regionsLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <span className="material-symbols-outlined text-sm">save</span>
                )}
                SAVE_REGIONS
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 3: PASSWORD UPDATE */}
        <section className="bg-surface-container-low rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">lock</span>
              <h2 className="font-headline font-bold text-on-surface">비밀번호 변경</h2>
            </div>
            <span className="text-[10px] font-mono text-outline uppercase tracking-widest">// security_credentials</span>
          </div>

          <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
            <div className="space-y-1.5 max-w-md">
              <label className="text-[11px] font-label text-secondary uppercase font-bold tracking-wider ml-1">Current_Password</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호 확인"
                className="w-full bg-background border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-label text-secondary uppercase font-bold tracking-wider ml-1">New_Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  className="w-full bg-background border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-label text-secondary uppercase font-bold tracking-wider ml-1">Confirm_New_Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="다시 한번 입력"
                  className="w-full bg-background border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
              <div>
                {pwdMessage.text && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold ${pwdMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} animate-in fade-in`}>
                    <span className="material-symbols-outlined text-xs">{pwdMessage.type === 'success' ? 'verified' : 'error'}</span>
                    {pwdMessage.text}
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={pwdLoading}
                className="bg-primary text-white px-8 py-3 rounded-xl font-label text-xs font-bold tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {pwdLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <span className="material-symbols-outlined text-sm">vpn_key</span>
                )}
                CHANGE_PASSWORD_NOW
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
};

export default Settings;
