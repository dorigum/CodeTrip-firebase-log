const ADMINISTRATIVE_REGION_TO_TOUR_API_AREA_CODE = Object.freeze({
  11: '1',
  26: '6',
  27: '4',
  28: '2',
  29: '5',
  30: '3',
  31: '7',
  36: '8',
  41: '31',
  42: '32',
  43: '33',
  44: '34',
  45: '37',
  46: '38',
  47: '35',
  48: '36',
  50: '39',
});

export const toTourApiAreaCodeSet = (favoriteRegions = []) => {
  const regions = Array.isArray(favoriteRegions)
    ? favoriteRegions
    : Object.values(favoriteRegions || {});

  return new Set(
    regions
      .map((region) => String(region || '').trim())
      .filter(Boolean)
      .map((region) => ADMINISTRATIVE_REGION_TO_TOUR_API_AREA_CODE[region] || region),
  );
};

