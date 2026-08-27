import { httpsCallable } from 'firebase/functions';
import { firebaseAuth, firebaseFunctions } from '../firebase';

const generateTripPlanCallable = httpsCallable(firebaseFunctions, 'generateTripPlan');

const normalizeCallableError = (error) => {
  switch (error?.code) {
    case 'functions/unauthenticated':
      return '로그인 후 AI 여행 플래너를 사용할 수 있습니다.';
    case 'functions/resource-exhausted':
      return 'AI 여행 플래너 요청이 많습니다. 잠시 후 다시 시도해주세요.';
    case 'functions/deadline-exceeded':
      return 'AI 여행 플래너 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.';
    case 'functions/invalid-argument':
      return error?.message || 'AI 여행 플래너 요청 조건을 확인해주세요.';
    case 'functions/unavailable':
      return 'AI 여행 플래너 서버가 잠시 불안정합니다. 잠시 후 다시 시도해주세요.';
    default:
      return error?.message || 'CodeTrip이 여행 코스를 생성하지 못했습니다.';
  }
};

export const generateTripPlan = async (input) => {
  if (!firebaseAuth.currentUser) {
    throw new Error('로그인 후 AI 여행 플래너를 사용할 수 있습니다.');
  }

  try {
    const response = await generateTripPlanCallable(input);
    return response.data;
  } catch (error) {
    throw new Error(normalizeCallableError(error));
  }
};
