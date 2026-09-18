import { httpsCallable } from 'firebase/functions';
import { firebaseAuth, firebaseFunctions } from '../firebase';
import { normalizeGeminiError } from '../utils/externalServiceErrors';

const generateTripPlanCallable = httpsCallable(firebaseFunctions, 'generateTripPlan');

export const generateTripPlan = async (input) => {
  if (!firebaseAuth.currentUser) {
    throw new Error('로그인 후 AI 여행 플래너를 사용할 수 있습니다.');
  }

  try {
    const response = await generateTripPlanCallable(input);
    return response.data;
  } catch (error) {
    throw new Error(normalizeGeminiError(error));
  }
};
