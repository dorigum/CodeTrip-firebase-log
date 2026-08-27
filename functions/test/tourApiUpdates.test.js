const assert = require('node:assert/strict');
const test = require('node:test');

const { parseRecentTourApiItemsResponse } = require('../tourApiUpdates');

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
