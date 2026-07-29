import axios from 'axios';
import { cachedApiRequest } from './apiCache';

const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const SEOUL = '\uC11C\uC6B8';
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEATHER_CACHE_TTL = HOUR;
const LOCATION_CACHE_TTL = 30 * DAY;
const KEYWORDS = {
  travel: '\uC5EC\uD589',
  scenery: '\uD48D\uACBD',
  beach: '\uD574\uBCC0',
  cafe: '\uCE74\uD398',
  drive: '\uB4DC\uB77C\uC774\uBE0C',
  museum: '\uBBF8\uC220\uAD00',
  snow: '\uC124\uACBD',
  indoorDate: '\uC2E4\uB0B4\uB370\uC774\uD2B8',
};

const roundCoordinate = (value, precision = 2) => Number(Number(value).toFixed(precision));

export const getWeather = async (lat = 37.5665, lon = 126.9780) => {
  const latitude = roundCoordinate(lat, 2);
  const longitude = roundCoordinate(lon, 2);

  try {
    return await cachedApiRequest({
      scope: 'weather',
      service: 'openMeteoCurrent',
      params: { latitude, longitude },
      ttlMs: WEATHER_CACHE_TTL,
      fetcher: async () => {
        const response = await axios.get(WEATHER_BASE_URL, {
          params: {
            latitude,
            longitude,
            current: 'temperature_2m,weathercode,cloudcover,precipitation',
            timezone: 'Asia/Seoul',
            models: 'jma_seamless',
          },
        });
        const current = response.data.current;
        const effectiveCode = refineWeatherCode(current.weathercode, current.cloudcover, current.precipitation);
        const parsed = parseWeatherCode(effectiveCode);
        return {
          temp: Math.round(current.temperature_2m),
          ...parsed,
          keywords: [parsed.keyword],
        };
      },
    });
  } catch {
    return { temp: 24, label: 'Sunny', icon: 'sunny', keywords: [KEYWORDS.travel], location: SEOUL };
  }
};

const refineWeatherCode = (code, cloudcover, precipitation) => {
  if (precipitation > 0 && code < 51) return 61;
  if ((code === 0 || code === 1) && cloudcover >= 75) return 3;
  if (code === 0 && cloudcover >= 40) return 2;
  return code;
};

export const getLocationName = async (lat, lon) => {
  const latitude = roundCoordinate(lat, 3);
  const longitude = roundCoordinate(lon, 3);

  try {
    return await cachedApiRequest({
      scope: 'location',
      service: 'nominatimReverse',
      params: { latitude, longitude },
      ttlMs: LOCATION_CACHE_TTL,
      fetcher: async () => {
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: { lat: latitude, lon: longitude, format: 'json', addressdetails: 1 },
          headers: { 'Accept-Language': 'ko-KR' },
        });
        const addr = response.data.address || {};
        return {
          city: addr.city || addr.town || addr.village || addr.borough || SEOUL,
          state: addr.province || addr.city || addr.region || SEOUL,
        };
      },
    });
  } catch {
    return { city: SEOUL, state: SEOUL };
  }
};

const parseWeatherCode = (code) => {
  if (code === 0) return { label: 'Sunny', korLabel: '맑음', icon: 'sunny', keyword: KEYWORDS.scenery };
  if (code === 1 || code === 2) return { label: 'Partly Cloudy', korLabel: '구름 조금', icon: 'partly_cloudy_day', keyword: KEYWORDS.beach };
  if (code === 3) return { label: 'Cloudy', korLabel: '흐림', icon: 'cloud', keyword: KEYWORDS.cafe };
  if (code === 45 || code === 48) return { label: 'Foggy', korLabel: '안개', icon: 'foggy', keyword: KEYWORDS.drive };

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: 'Rainy', korLabel: '비', icon: 'rainy', keyword: KEYWORDS.museum };
  }

  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { label: 'Snowy', korLabel: '눈', icon: 'ac_unit', keyword: KEYWORDS.snow };
  }

  if (code >= 95 && code <= 99) {
    return { label: 'Stormy', korLabel: '폭풍우', icon: 'thunderstorm', keyword: KEYWORDS.indoorDate };
  }

  return { label: 'Clear', korLabel: '맑음', icon: 'sunny', keyword: KEYWORDS.travel };
};

