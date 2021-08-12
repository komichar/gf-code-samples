import {
  takeEvery, debounce, put,
} from 'redux-saga/effects';
import generateProtectedApiCallSaga from '../../utils/protectedApiCallSaga';
import studyRequestsAPI from '../../../services/api/studyRequests';
import {
  DEBOUNCE_UPDATE_SEARCH_IAB_ASSETS_TERM,
  SEARCH_IAB_ASSETS_REQUEST,
  searchIABAssetsRequest,
  searchIABAssetsSuccess,
  searchIABAssetsFailure,
} from './actions';

export const searchIABAssets = generateProtectedApiCallSaga(
  studyRequestsAPI.searchAssets,
  /* istanbul ignore next */
  (action) => [action.term, []],
  searchIABAssetsSuccess,
  searchIABAssetsFailure,
);

export function* watchSearchIABAssetsRequest() {
  yield takeEvery(SEARCH_IAB_ASSETS_REQUEST, searchIABAssets);
}

export function* onDebouncedUpdateSearchIABAssetsTerm(action) {
  yield put(searchIABAssetsRequest(action.term));
}

export function* watchDebounceUpdateSearchIABAssetsTerm() {
  yield debounce(200, DEBOUNCE_UPDATE_SEARCH_IAB_ASSETS_TERM, onDebouncedUpdateSearchIABAssetsTerm);
}
