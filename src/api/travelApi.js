import axios from 'axios';
import { cachedApiRequest } from './apiCache';
import authApi from './authApi';
import { getFestivalInfo, getTravelInfo, getTravelInfoByKeyword } from './travelInfoApi';
import { getWeather } from './weatherApi';

const PHOTO_BASE_URL = 'https://apis.data.go.kr/B551011/PhotoGalleryService1';
const GALLERY_KEY = decodeURIComponent(import.meta.env.VITE_GALLERY_API_KEY || '');
const DAY = 24 * 60 * 60 * 1000;
const DEFAULT_KEYWORD = '\uC5EC\uD589';
const DEFAULT_REGION_CODE = '11';
const REGION_META = {
  11: { name: '\uC11C\uC6B8', lat: 37.5665, lon: 126.9780, aliases: ['\uC11C\uC6B8'] },
  26: { name: '\uBD80\uC0B0', lat: 35.1796, lon: 129.0756, aliases: ['\uBD80\uC0B0'] },
  27: { name: '\uB300\uAD6C', lat: 35.8714, lon: 128.6014, aliases: ['\uB300\uAD6C'] },
  28: { name: '\uC778\uCC9C', lat: 37.4563, lon: 126.7052, aliases: ['\uC778\uCC9C'] },
  29: { name: '\uAD11\uC8FC', lat: 35.1595, lon: 126.8526, aliases: ['\uAD11\uC8FC'] },
  30: { name: '\uB300\uC804', lat: 36.3504, lon: 127.3845, aliases: ['\uB300\uC804'] },
  31: { name: '\uC6B8\uC0B0', lat: 35.5384, lon: 129.3114, aliases: ['\uC6B8\uC0B0'] },
  41: { name: '\uACBD\uAE30', lat: 37.4138, lon: 127.5183, aliases: ['\uACBD\uAE30'] },
  43: { name: '\uCDA9\uBD81', lat: 36.6357, lon: 127.4914, aliases: ['\uCDA9\uCCAD\uBD81', '\uCDA9\uBD81'] },
  44: { name: '\uCDA9\uB0A8', lat: 36.6588, lon: 126.6728, aliases: ['\uCDA9\uCCAD\uB0A8', '\uCDA9\uB0A8'] },
  52: { name: '\uC804\uBD81', lat: 35.8203, lon: 127.1088, aliases: ['\uC804\uBD81', '\uC804\uB77C\uBD81'] },
  46: { name: '\uC804\uB0A8', lat: 34.8161, lon: 126.4630, aliases: ['\uC804\uB0A8', '\uC804\uB77C\uB0A8'] },
  47: { name: '\uACBD\uBD81', lat: 36.5760, lon: 128.5056, aliases: ['\uACBD\uBD81', '\uACBD\uC0C1\uBD81'] },
  48: { name: '\uACBD\uB0A8', lat: 35.2383, lon: 128.6924, aliases: ['\uACBD\uB0A8', '\uACBD\uC0C1\uB0A8'] },
  50: { name: '\uC81C\uC8FC', lat: 33.4996, lon: 126.5312, aliases: ['\uC81C\uC8FC'] },
  51: { name: '\uAC15\uC6D0', lat: 37.8228, lon: 128.1555, aliases: ['\uAC15\uC6D0'] },
  36110: { name: '\uC138\uC885', lat: 36.4800, lon: 127.2890, aliases: ['\uC138\uC885'] },
};

const normalizeImage = (url) => url?.replace('http://', 'https://') || '';

const toRegionCode = (region) => {
  const value = String(region || '').trim();
  if (!value) return DEFAULT_REGION_CODE;
  if (/^\d+$/.test(value)) return value;
  return Object.entries(REGION_META).find(([, meta]) =>
    meta.aliases.some((name) => value.includes(name))
  )?.[0] || DEFAULT_REGION_CODE;
};

const fetchGallery = async (service, params = {}) => {
  const requestParams = {
    serviceKey: GALLERY_KEY,
    MobileOS: 'ETC',
    MobileApp: 'CodeTrip',
    _type: 'json',
    ...params,
  };

  return cachedApiRequest({
    scope: 'gallery',
    service,
    params: requestParams,
    ttlMs: DAY,
    fetcher: async () => {
      const response = await axios.get(`${PHOTO_BASE_URL}/${service}`, {
        params: requestParams,
      });
      return response.data;
    },
  });
};

const normalizeItems = (items) => {
  if (!items) return [];
  const list = Array.isArray(items) ? items : [items];
  return list.map((item) => ({
    ...item,
    firstimage: normalizeImage(item.firstimage || item.originimgurl || item.galWebImageUrl),
    galWebImageUrl: normalizeImage(item.galWebImageUrl),
  }));
};

export const getPhotoList = async () => {
  try {
    const data = await fetchGallery('galleryList1', { numOfRows: 12, pageNo: 1, arrange: 'A' });
    return normalizeItems(data?.response?.body?.items?.item);
  } catch (error) {
    console.error('Photo API error:', error);
    return [];
  }
};

export const getCityBasedPlaces = async (areaCode) => {
  try {
    const { items } = await getTravelInfo({ pageNo: 1, numOfRows: 8, lDongRegnCd: toRegionCode(areaCode) });
    return items;
  } catch (error) {
    console.error('City based places error:', error);
    return [];
  }
};

export const searchKeywordPlaces = async (keyword = DEFAULT_KEYWORD, pageNo = 1, lDongRegnCd) => {
  try {
    const { items } = await getTravelInfoByKeyword({
      keyword: keyword || DEFAULT_KEYWORD,
      pageNo,
      numOfRows: 20,
      lDongRegnCd,
    });
    return items;
  } catch {
    return [];
  }
};

export const getSpontaneousTravel = async (weatherKeyword = DEFAULT_KEYWORD, weatherKorLabel = '', poolSize = 20) => {
  let favoriteRegions = [];
  try {
    favoriteRegions = await authApi.getFavoriteRegions();
  } catch {
    favoriteRegions = [];
  }

  const hasPreferences = favoriteRegions.length > 0;
  const selectedRegion = hasPreferences
    ? String(favoriteRegions[Math.floor(Math.random() * favoriteRegions.length)])
    : DEFAULT_REGION_CODE;
  const regionMeta = REGION_META[selectedRegion] || REGION_META[DEFAULT_REGION_CODE];
  const regionWeather = hasPreferences
    ? await getWeather(regionMeta.lat, regionMeta.lon)
    : null;
  const weather = regionWeather
    ? { ...regionWeather, regionName: regionMeta.name, location: regionMeta.name }
    : null;
  const keyword = weather?.keywords?.[0] || weatherKeyword || DEFAULT_KEYWORD;

  let items = await searchKeywordPlaces(keyword, 1, selectedRegion);
  if (!items.length && keyword !== DEFAULT_KEYWORD) {
    items = await searchKeywordPlaces(DEFAULT_KEYWORD, 1, selectedRegion);
  }
  if (!items.length) {
    items = await searchKeywordPlaces(DEFAULT_KEYWORD, 1);
  }
  if (!items.length) return null;

  return {
    item: items[Math.floor(Math.random() * Math.min(items.length, poolSize))],
    hasPreferences,
    regionCode: selectedRegion,
    weather,
    reasons: [
      hasPreferences
        ? '\uC124\uC815\uD55C \uC120\uD638 \uC9C0\uC5ED\uC744 \uBC18\uC601\uD588\uC2B5\uB2C8\uB2E4.'
        : '\uC120\uD638 \uC9C0\uC5ED\uC774 \uC5C6\uC5B4 \uAE30\uBCF8 \uC9C0\uC5ED\uC73C\uB85C \uCD94\uCC9C\uD588\uC2B5\uB2C8\uB2E4.',
      `\uD604\uC7AC \uB0A0\uC528 \uD0A4\uC6CC\uB4DC "${weather?.korLabel || weatherKorLabel || keyword}"\uB97C \uD65C\uC6A9\uD588\uC2B5\uB2C8\uB2E4.`,
    ],
  };
};

export const getFestivalList = async (page = 1, limit = 8, sort = 'default', region = '', keyword = '', subRegion = '', options = {}) => {
  const data = await getFestivalInfo({
    pageNo: page,
    numOfRows: limit,
    sort,
    lDongRegnCd: region || undefined,
    lDongSignguCd: subRegion || undefined,
    keyword,
    poolMaxRows: options.poolMaxRows,
  });
  return { ...data, page, limit, sort, region, keyword, subRegion };
};

export const getWeatherRecommendations = async (keyword) => {
  const items = await searchKeywordPlaces(keyword || DEFAULT_KEYWORD);
  if (items.length > 0) return items[Math.floor(Math.random() * items.length)];
  return null;
};
