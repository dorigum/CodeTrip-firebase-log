const MAX_TEXT_LENGTH = 200;

const sanitizeString = (value, fallback = '', maxLength = MAX_TEXT_LENGTH) =>
  String(value || fallback)
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);

const normalizeTourApiItems = (items) => {
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
};

const normalizeTourApiImage = (value) => String(value || '').replace('http://', 'https://');

const parseRecentTourApiItemsResponse = (data, logger = console) => {
  const resultCode = String(data?.response?.header?.resultCode || '');
  if (resultCode !== '0000') {
    logger.warn?.('TourAPI update sync returned failure code', {
      resultCode,
      resultMsg: data?.response?.header?.resultMsg,
    });
    throw new Error('TourAPI 신규 여행지 응답 코드가 정상 상태가 아닙니다.');
  }

  const body = data?.response?.body || {};
  if (Number(body?.totalCount) === 0) {
    return [];
  }

  const rawItems = body?.items?.item;
  if (rawItems === undefined || rawItems === null) {
    logger.warn?.('TourAPI update sync returned invalid item structure', {
      totalCount: body?.totalCount,
    });
    throw new Error('TourAPI 신규 여행지 응답 구조가 올바르지 않습니다.');
  }

  return normalizeTourApiItems(rawItems)
    .map((item) => ({
      contentId: sanitizeString(item.contentid, '', 40),
      contentTypeId: sanitizeString(item.contenttypeid, '', 20),
      title: sanitizeString(item.title, '신규 여행지', 120),
      addr1: sanitizeString(item.addr1, '', 160),
      addr2: sanitizeString(item.addr2, '', 160),
      areaCode: sanitizeString(item.areacode, '', 20),
      sigunguCode: sanitizeString(item.sigungucode, '', 20),
      firstimage: normalizeTourApiImage(item.firstimage),
      createdtime: sanitizeString(item.createdtime, '', 30),
      modifiedtime: sanitizeString(item.modifiedtime, '', 30),
    }))
    .filter((item) => item.contentId && item.title);
};

module.exports = {
  normalizeTourApiItems,
  parseRecentTourApiItemsResponse,
};
