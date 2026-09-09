const assert = require('node:assert/strict');
const test = require('node:test');

const { dedupeTourApiItems, parseRecentTourApiItemsResponse } = require('../tourApiUpdates');

const silentLogger = {
  warn: () => {},
};

test('successful empty TourAPI response is treated as an empty update list', () => {
  const result = parseRecentTourApiItemsResponse({
    response: {
      header: {
        resultCode: '0000',
        resultMsg: 'OK',
      },
      body: {
        totalCount: '0',
        items: '',
      },
    },
  }, silentLogger);

  assert.deepEqual(result, []);
});

test('non-empty response without item structure is rejected', () => {
  assert.throws(
    () => parseRecentTourApiItemsResponse({
      response: {
        header: {
          resultCode: '0000',
          resultMsg: 'OK',
        },
        body: {
          totalCount: '1',
          items: '',
        },
      },
    }, silentLogger),
    /응답 구조/,
  );
});

test('single TourAPI item is normalized and sanitized', () => {
  const result = parseRecentTourApiItemsResponse({
    response: {
      header: {
        resultCode: '0000',
        resultMsg: 'OK',
      },
      body: {
        totalCount: '1',
        items: {
          item: {
            contentid: '123',
            contenttypeid: '12',
            title: '<신규 여행지>',
            addr1: '서울특별시 중구',
            firstimage: 'http://example.com/image.jpg',
            createdtime: '20260825',
            modifiedtime: '20260825',
          },
        },
      },
    },
  }, silentLogger);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, '신규 여행지');
  assert.equal(result[0].firstimage, 'https://example.com/image.jpg');
});

test('missing TourAPI area code is inferred from the Korean address', () => {
  const result = parseRecentTourApiItemsResponse({
    response: {
      header: { resultCode: '0000', resultMsg: 'OK' },
      body: {
        totalCount: '2',
        items: {
          item: [
            { contentid: 'daejeon', title: '대전 행사', addr1: '대전광역시 중구 중앙로79번길' },
            { contentid: 'gyeonggi', title: '경기 여행지', addr1: '경기도 수원시 팔달구' },
          ],
        },
      },
    },
  }, silentLogger);

  assert.deepEqual(result.map((item) => item.areaCode), ['3', '31']);
});

test('festival source takes precedence when the same content ID is returned twice', () => {
  const festival = { contentId: 'festival-1', contentTypeId: '15', source: 'KorService2.searchFestival2' };
  const general = { contentId: 'festival-1', contentTypeId: '15', source: 'KorService2.areaBasedList2' };
  const destination = { contentId: 'destination-1', contentTypeId: '12', source: 'KorService2.areaBasedList2' };

  assert.deepEqual(dedupeTourApiItems([festival, general, destination]), [festival, destination]);
});
