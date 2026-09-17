import assert from 'node:assert/strict';
import { createLocationFallback, createWeatherFallback, normalizeGeminiError } from './externalServiceErrors.js';

assert.deepEqual(createWeatherFallback(), {
  temp: 24, label: 'Sunny', icon: 'sunny', keywords: ['여행'], location: '서울',
});
assert.deepEqual(createLocationFallback('부산'), { city: '부산', state: '부산' });
assert.equal(normalizeGeminiError({ code: 'functions/unavailable' }), 'AI 여행 플래너 서버가 잠시 불안정합니다. 잠시 후 다시 시도해주세요.');
assert.equal(normalizeGeminiError({ code: 'functions/resource-exhausted' }), 'AI 여행 플래너 요청이 많습니다. 잠시 후 다시 시도해주세요.');
assert.equal(normalizeGeminiError({ message: 'network failed' }), 'network failed');

console.log('External service fallback and Gemini error tests passed.');
