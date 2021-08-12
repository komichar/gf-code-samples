import sagaTestingHelper from 'redux-saga-testing';
import { takeEvery } from 'redux-saga/effects';
import { watchFetchCategoriesRequest, fetchCategoriesRequest } from './saga';
import { FETCH_CATEGORIES_REQUEST } from './actions';

describe('watchFetchCategoriesRequest', () => {
  const it = sagaTestingHelper(watchFetchCategoriesRequest());

  it('takes every watchFetchCategoriesRequest', (result) => {
    expect(result).toEqual(takeEvery(FETCH_CATEGORIES_REQUEST, fetchCategoriesRequest));
  });
});
