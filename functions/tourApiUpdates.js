const MAX_TEXT_LENGTH = 200;

const TOUR_API_AREA_CODE_BY_ADDRESS = [
  [/^서울(?:특별시)?/, '1'],
  [/^인천(?:광역시)?/, '2'],
  [/^대전(?:광역시)?/, '3'],
  [/^대구(?:광역시)?/, '4'],
  [/^광주(?:광역시)?/, '5'],
  [/^부산(?:광역시)?/, '6'],
  [/^울산(?:광역시)?/, '7'],
  [/^세종(?:특별자치시)?/, '8'],
  [/^(?:경기도|경기)/, '31'],
  [/^(?:강원특별자치도|강원도|강원)/, '32'],
  [/^(?:충청북도|충북)/, '33'],
  [/^(?:충청남도|충남)/, '34'],
  [/^(?:경상북도|경북)/, '35'],
  [/^(?:경상남도|경남)/, '36'],
  [/^(?:전북특별자치도|전라북도|전북)/, '37'],
  [/^(?:전라남도|전남)/, '38'],
  [/^(?:제주특별자치도|제주도|제주)/, '39'],
];

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

const resolveTourApiAreaCode = (areaCode, address) => {
  const normalizedAreaCode = sanitizeString(areaCode, '', 20);
  if (normalizedAreaCode) return normalizedAreaCode;

  const normalizedAddress = sanitizeString(address, '', MAX_TEXT_LENGTH);
  const matchedArea = TOUR_API_AREA_CODE_BY_ADDRESS.find(([pattern]) => pattern.test(normalizedAddress));
  return matchedArea ? matchedArea[1] : '';
};

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
      areaCode: resolveTourApiAreaCode(item.areacode, item.addr1),
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
  resolveTourApiAreaCode,
};
