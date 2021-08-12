
import { takeEvery } from 'redux-saga/effects';
import {
  FETCH_CATEGORIES_REQUEST,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
} from './actions';
import generateProtectedApiCallSaga from '../../utils/protectedApiCallSaga';
import studyRequestsAPI from '../../../services/api/studyRequests';

export const fetchCategoriesRequest = generateProtectedApiCallSaga(
  studyRequestsAPI.getCategories,
  /* istanbul ignore next */
  () => ([]),
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
);

export function* watchFetchCategoriesRequest() {
  yield takeEvery(FETCH_CATEGORIES_REQUEST, fetchCategoriesRequest);
}
