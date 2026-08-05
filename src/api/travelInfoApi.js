import axios from 'axios';
import { cachedApiRequest } from './apiCache';

const TOUR_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_TRAVEL_INFO_API_URL || 'KorService2'}`;
const SERVICE_KEY = decodeURIComponent(import.meta.env.VITE_TRAVEL_INFO_API_KEY || '');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const CACHE_TTL = {
  list: 12 * HOUR,
  keyword: 6 * HOUR,
  festival: 6 * HOUR,
  detail: 14 * DAY,
  regions: 30 * DAY,
};

const FESTIVAL_POOL_PAGE_SIZE = 1000;
const FESTIVAL_POOL_MAX_ROWS = 3000;

const toDateKey = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10).replace(/-/g, '');
};

const normalizeItems = (items) => {
  if (!items) return [];
  const list = Array.isArray(items) ? items : [items];
  return list.map((item) => ({
    ...item,
    firstimage: (item.firstimage || item.originimgurl || item.galWebImageUrl || '')?.replace('http://', 'https://'),
    originimgurl: (item.originimgurl || item.firstimage || '')?.replace('http://', 'https://'),
  }));
};

const getFestivalStartDate = (item) =>
  String(item?.eventstartdate || item?.eventStartDate || '').replace(/\D/g, '').slice(0, 8);

const getFestivalEndDate = (item) =>
  String(item?.eventenddate || item?.eventEndDate || '').replace(/\D/g, '').slice(0, 8) || getFestivalStartDate(item);

const isActiveOrUpcomingFestival = (item, todayKey) => {
  const startDate = getFestivalStartDate(item);
  const endDate = getFestivalEndDate(item);
  if (!startDate && !endDate) return false;
  return (endDate || startDate) >= todayKey;
};

const sortFestivalItems = (items, sort, todayKey) => {
  const getComparableDate = (item) => getFestivalStartDate(item) || getFestivalEndDate(item) || '99999999';
  const isOngoing = (item) => {
    const startDate = getFestivalStartDate(item);
    const endDate = getFestivalEndDate(item);
    return startDate && endDate && startDate <= todayKey && endDate >= todayKey;
  };

  return [...items].sort((a, b) => {
    if (sort === 'date_desc') {
      return getComparableDate(b).localeCompare(getComparableDate(a)) || String(a.title || '').localeCompare(String(b.title || ''), 'ko');
    }

    if (sort === 'date_asc') {
      return getComparableDate(a).localeCompare(getComparableDate(b)) || String(a.title || '').localeCompare(String(b.title || ''), 'ko');
    }

    const ongoingDiff = Number(isOngoing(b)) - Number(isOngoing(a));
    if (ongoingDiff !== 0) return ongoingDiff;
    return getComparableDate(a).localeCompare(getComparableDate(b)) || String(a.title || '').localeCompare(String(b.title || ''), 'ko');
  });
};

const fetchTourApi = async (service, params = {}, ttlMs = CACHE_TTL.list) => {
  const requestParams = {
    serviceKey: SERVICE_KEY,
    MobileOS: 'ETC',
    MobileApp: 'CodeTrip',
    _type: 'json',
    ...params,
  };

  return cachedApiRequest({
    scope: 'tour',
    service,
    params: requestParams,
    ttlMs,
    fetcher: async () => {
      const response = await axios.get(`${TOUR_BASE_URL}/${service}`, {
        params: requestParams,
      });
      return response.data;
    },
  });
};

export const getTravelList = async ({ regions = [''], themes = [''], pageNo = 1, numOfRows = 10, keyword = '', sort = 'default' } = {}) => {
  const contentTypeId = themes.find(Boolean) || undefined;
  const lDongRegnCd = regions.find(Boolean) || undefined;

  const data = keyword
    ? await fetchTourApi('searchKeyword2', { keyword, pageNo, numOfRows, contentTypeId, lDongRegnCd, arrange: sort === 'title' ? 'A' : 'O' }, CACHE_TTL.keyword)
    : await fetchTourApi('areaBasedList2', { pageNo, numOfRows, contentTypeId, lDongRegnCd, arrange: sort === 'title' ? 'A' : 'O' }, CACHE_TTL.list);

  const body = data?.response?.body || {};
  return {
    items: normalizeItems(body.items?.item),
    totalCount: Number(body.totalCount || 0),
  };
};

export const getDetailCommon = async (contentId) => {
  const data = await fetchTourApi('detailCommon2', { contentId }, CACHE_TTL.detail);
  const item = data?.response?.body?.items?.item;
  const result = Array.isArray(item) ? item[0] : item;
  if (result?.firstimage) result.firstimage = result.firstimage.replace('http://', 'https://');
  return result || null;
};

export const getDetailIntro = async (contentId, contentTypeId) => {
  const data = await fetchTourApi('detailIntro2', { contentId, contentTypeId }, CACHE_TTL.detail);
  const item = data?.response?.body?.items?.item;
  return Array.isArray(item) ? item[0] : item || null;
};

export const getDetailInfo = async (contentId, contentTypeId) => {
  const data = await fetchTourApi('detailInfo2', { contentId, contentTypeId }, CACHE_TTL.detail);
  return { items: normalizeItems(data?.response?.body?.items?.item) };
};

export const getDetailImage = async (contentId) => {
  const data = await fetchTourApi('detailImage2', { contentId }, CACHE_TTL.detail);
  return { items: normalizeItems(data?.response?.body?.items?.item) };
};

export const getRegions = async () => {
  const data = await fetchTourApi('ldongCode2', { numOfRows: 20, pageNo: 1 }, CACHE_TTL.regions);
  return normalizeItems(data?.response?.body?.items?.item);
};

export const getSubRegions = async (lDongRegnCd) => {
  if (!lDongRegnCd) return [];
  const data = await fetchTourApi('ldongCode2', { numOfRows: 100, pageNo: 1, lDongRegnCd }, CACHE_TTL.regions);
  return normalizeItems(data?.response?.body?.items?.item)
    .map((item) => ({
      code: String(item.lDongSignguCd || item.signguCode || item.code || '').trim(),
      name: String(item.lDongSignguNm || item.signguName || item.name || '').trim(),
    }))
    .filter((item) => item.code && item.name);
};

export const getTravelInfo = async ({ pageNo = 1, numOfRows = 10, contentTypeId, lDongRegnCd } = {}) => {
  const data = await fetchTourApi('areaBasedList2', { pageNo, numOfRows, contentTypeId, lDongRegnCd, arrange: 'O' }, CACHE_TTL.list);
  const body = data?.response?.body || {};
  return { items: normalizeItems(body.items?.item), totalCount: Number(body.totalCount || 0) };
};

const matchesFestivalKeyword = (item, keyword) => {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase();
  if (!normalizedKeyword) return true;
  return [
    item.title,
    item.addr1,
    item.addr2,
    item.overview,
  ].some((value) => String(value || '').toLowerCase().includes(normalizedKeyword));
};

export const getFestivalInfo = async ({ pageNo = 1, numOfRows = 8, sort = 'default', lDongRegnCd, lDongSignguCd, keyword = '' } = {}) => {
  const todayKey = toDateKey();
  const eventStartDate = `${todayKey.slice(0, 4)}0101`;
  const festivalParams = { eventStartDate, lDongRegnCd, lDongSignguCd, arrange: 'O' };
  const firstPageData = await fetchTourApi(
    'searchFestival2',
    { pageNo: 1, numOfRows: FESTIVAL_POOL_PAGE_SIZE, ...festivalParams },
    CACHE_TTL.festival
  );
  const firstBody = firstPageData?.response?.body || {};
  const totalRawCount = Number(firstBody.totalCount || 0);
  const maxRows = Math.min(totalRawCount || FESTIVAL_POOL_PAGE_SIZE, FESTIVAL_POOL_MAX_ROWS);
  const totalRawPages = Math.max(1, Math.ceil(maxRows / FESTIVAL_POOL_PAGE_SIZE));
  const rawItems = normalizeItems(firstBody.items?.item);

  if (totalRawPages > 1) {
    const restPages = await Promise.all(
      Array.from({ length: totalRawPages - 1 }, (_, index) => index + 2).map((festivalPage) =>
        fetchTourApi(
          'searchFestival2',
          { pageNo: festivalPage, numOfRows: FESTIVAL_POOL_PAGE_SIZE, ...festivalParams },
          CACHE_TTL.festival
        )
      )
    );

    restPages.forEach((pageData) => {
      const pageBody = pageData?.response?.body || {};
      rawItems.push(...normalizeItems(pageBody.items?.item));
    });
  }

  const filteredItems = rawItems.filter((item) =>
    isActiveOrUpcomingFestival(item, todayKey) && matchesFestivalKeyword(item, keyword)
  );
  const sortedItems = sortFestivalItems(filteredItems, sort, todayKey);
  const startIndex = (pageNo - 1) * numOfRows;
  const items = sortedItems.slice(startIndex, startIndex + numOfRows);

  return {
    items,
    totalCount: sortedItems.length,
    totalPages: Math.ceil(sortedItems.length / numOfRows),
  };
};

export const getTravelInfoByKeyword = async ({ keyword, pageNo = 1, numOfRows = 10, contentTypeId, lDongRegnCd } = {}) => {
  const data = await fetchTourApi('searchKeyword2', { keyword, pageNo, numOfRows, contentTypeId, lDongRegnCd, arrange: 'O' }, CACHE_TTL.keyword);
  const body = data?.response?.body || {};
  return { items: normalizeItems(body.items?.item), totalCount: Number(body.totalCount || 0) };
};
