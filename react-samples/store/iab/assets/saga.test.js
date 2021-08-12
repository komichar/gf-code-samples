import {
  debounce, put, takeEvery,
} from 'redux-saga/effects';
import sagaTestingHelper from 'redux-saga-testing';
import {
  onDebouncedUpdateSearchIABAssetsTerm,
  searchIABAssets,
  watchDebounceUpdateSearchIABAssetsTerm,
  watchSearchIABAssetsRequest,
} from './saga';
import {
  DEBOUNCE_UPDATE_SEARCH_IAB_ASSETS_TERM,
  debounceUpdateSearchIABAssetsTerm,
  SEARCH_IAB_ASSETS_REQUEST,
  searchIABAssetsRequest,
} from './actions';

describe('watchSearchIABAssetsRequest', () => {
  const it = sagaTestingHelper(watchSearchIABAssetsRequest());

  it('takes every SEARCH_IAB_ASSETS_REQUEST', (result) => {
    expect(result).toEqual(takeEvery(SEARCH_IAB_ASSETS_REQUEST, searchIABAssets));
  });
});

describe('onDebouncedUpdateSearchIABAssetsTerm', () => {
  const it = sagaTestingHelper(
    onDebouncedUpdateSearchIABAssetsTerm(
      debounceUpdateSearchIABAssetsTerm('test', 'segmentId'),
    ),
  );

  it('puts SEARCH_IAB_ASSETS_REQUEST', (result) => {
    expect(result).toEqual(put(searchIABAssetsRequest('test')));
  });
});

describe('watchDebounceUpdateSearchIABAssetsTerm', () => {
  const it = sagaTestingHelper(watchDebounceUpdateSearchIABAssetsTerm());

  it('debounce every DEBOUNCE_UPDATE_SEARCH_IAB_ASSETS_TERM', (result) => {
    expect(result).toEqual(debounce(200, DEBOUNCE_UPDATE_SEARCH_IAB_ASSETS_TERM, onDebouncedUpdateSearchIABAssetsTerm));
  });
});
