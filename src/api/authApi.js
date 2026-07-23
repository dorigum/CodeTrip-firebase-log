import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  browserSessionPersistence,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  updatePassword as updateFirebasePassword,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { get, ref, set, update } from 'firebase/database';
import { firebaseAuth, realtimeDb } from '../firebase';
import { getCurrentUser, nowIso } from './firebaseHelpers';

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const userPayload = (authUser, profile = {}) => ({
  id: authUser.uid,
  email: authUser.email,
  name: profile.name || authUser.displayName || authUser.email,
  profileImg: profile.profileImg || authUser.photoURL || '',
});

const authErrorMessage = (error, fallback) => {
  if (error?.code?.includes('requests-to-this-api')) {
    return 'Firebase API key 제한 설정으로 로그인이 차단되었습니다. Google Cloud에서 Firebase용 Browser key의 Identity Toolkit API 허용 여부를 확인해주세요.';
  }

  switch (error?.code) {
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해 주세요.';
    case 'auth/invalid-email':
      return '이메일 형식이 올바르지 않습니다.';
    case 'auth/weak-password':
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    case 'auth/operation-not-allowed':
      return 'Firebase 콘솔에서 이메일/비밀번호 로그인을 활성화해야 합니다.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth/too-many-requests':
      return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인한 뒤 다시 시도해 주세요.';
    default:
      return error?.message || fallback;
  }
};

const authApi = {
  signup: async ({ email, password, name }) => {
    try {
      const normalizedEmail = email.trim();
      const normalizedName = name.trim();
      const credential = await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
      await updateFirebaseProfile(credential.user, { displayName: normalizedName });
      await set(ref(realtimeDb, `users/${credential.user.uid}`), {
        email: normalizedEmail,
        name: normalizedName,
        profileImg: '',
        favoriteRegions: [],
        created_at: nowIso(),
        updated_at: nowIso(),
      });
      await firebaseAuth.signOut();
      return { message: 'Success' };
    } catch (error) {
      throw { message: authErrorMessage(error, '회원가입에 실패했습니다.') };
    }
  },

  login: async ({ email, password }) => {
    try {
      await setPersistence(firebaseAuth, browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const token = await credential.user.getIdToken();
      const profileSnap = await get(ref(realtimeDb, `users/${credential.user.uid}`));
      const profile = profileSnap.exists() ? profileSnap.val() : {};
      const user = userPayload(credential.user, profile);

      localStorage.setItem('trip_token', token);
      return { token, user };
    } catch (error) {
      throw { message: authErrorMessage(error, '로그인에 실패했습니다.') };
    }
  },

  updateProfile: async ({ name, profileImg }) => {
    const user = await getCurrentUser();
    await updateFirebaseProfile(firebaseAuth.currentUser, {
      displayName: name,
      photoURL: profileImg || '',
    });
    await update(ref(realtimeDb, `users/${user.id}`), {
      name,
      profileImg: profileImg || '',
      updated_at: nowIso(),
    });
    return { message: 'Profile updated successfully' };
  },

  uploadImage: async (formData) => {
    const file = formData.get('profileImage');
    if (!file) throw { message: 'No file uploaded' };
    return { url: await readFileAsDataUrl(file) };
  },

  updatePassword: async ({ currentPassword, newPassword }) => {
    const authUser = firebaseAuth.currentUser;
    if (!authUser?.email) throw { message: '로그인이 필요합니다.' };

    const credential = EmailAuthProvider.credential(authUser.email, currentPassword);
    await reauthenticateWithCredential(authUser, credential);
    await updateFirebasePassword(authUser, newPassword);
    return { message: 'Password changed successfully' };
  },

  getFavoriteRegions: async () => {
    const user = await getCurrentUser();
    const profileSnap = await get(ref(realtimeDb, `users/${user.id}/favoriteRegions`));
    return profileSnap.exists() ? profileSnap.val() || [] : [];
  },

  updateFavoriteRegions: async (codes) => {
    const user = await getCurrentUser();
    if (codes.length > 3) {
      throw { message: '관심 지역은 최대 3개까지 선택할 수 있습니다.' };
    }
    await update(ref(realtimeDb, `users/${user.id}`), {
      favoriteRegions: codes,
      updated_at: nowIso(),
    });
    return { message: '관심 지역이 저장되었습니다.' };
  },

  forgotPassword: async ({ email }) => {
    await sendPasswordResetEmail(firebaseAuth, email);
    return { message: '비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해 주세요.' };
  },
};

export default authApi;
