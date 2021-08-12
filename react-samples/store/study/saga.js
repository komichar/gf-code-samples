import {
  call, takeEvery, put, select,
} from 'redux-saga/effects';
import {
  FETCH_STUDY_BY_UUID_REQUEST,
  fetchStudyByUUIDSuccess,
  fetchStudyByUUIDFailure,
  DELETE_STUDY_REQUEST,
  deleteStudySuccess,
  deleteStudyFailure,
  DELETE_STUDY_SUCCESS,
  deselectStudy,
  OPEN_STUDY_IN_TS_REQUEST,
  openStudyInTsSuccess,
  openStudyInTsFailure,
  OPEN_STUDY_IN_TS_SUCCESS,
  OPEN_STUDY_IN_TS_FAILURE,
  updateStudyContentSuccess,
  updateStudyContentFailure,
  UPDATE_STUDY_CONTENT_REQUEST,
  INITIALIZE_MENU_FROM_EXPLORE,
  updateStudyContentRequest,
} from './actions';
import studiesAPI from '../../services/api/studies';
import generateProtectedApiCallSaga from '../utils/protectedApiCallSaga';
import { updateStudiesRequestParams } from '../studies/actions';
import { addToast } from '../toasts/actions';
import { getStudyUUID } from './selectors';


export const fetchStudyByUUID = generateProtectedApiCallSaga(
  studiesAPI.getByUUID,
  /* istanbul ignore next */
  (action) => [action.uuid],
  fetchStudyByUUIDSuccess,
  fetchStudyByUUIDFailure,
);

export function* watchFetchStudyByUUIDRequest() {
  yield takeEvery(FETCH_STUDY_BY_UUID_REQUEST, fetchStudyByUUID);
}

export const deleteStudy = generateProtectedApiCallSaga(
  studiesAPI.deleteStudy,
  /* istanbul ignore next */
  (action) => [action.id],
  deleteStudySuccess,
  deleteStudyFailure,
);

export function* watchDeleteStudyRequest() {
  yield takeEvery(DELETE_STUDY_REQUEST, deleteStudy);
}

export function* afterDeleteStudySuccess() {
  yield put(deselectStudy());
  yield put(updateStudiesRequestParams());
  yield put(addToast('snackbars.study.deleted', { appearance: 'success', autoDismiss: true }));
}

export function* watchDeleteStudySuccess() {
  yield takeEvery(DELETE_STUDY_SUCCESS, afterDeleteStudySuccess);
}

export function* openStudyInTableau(action) {
  const { url } = action.payload;
  const win = yield call(window.open, url, '_blank');
  yield call(win.focus);
}

export const updateStudyContentByUUID = generateProtectedApiCallSaga(
  studiesAPI.updateStudyContent,
  /* istanbul ignore next */
  (action) => [action.uuid, action.content],
  updateStudyContentSuccess,
  updateStudyContentFailure,
);

export function* watchUpdateStudyContentRequest() {
  yield takeEvery(UPDATE_STUDY_CONTENT_REQUEST, updateStudyContentByUUID);
}

export function* onInitializeMenu(action) {
  const uuid = yield select(getStudyUUID);

  yield put(updateStudyContentRequest(uuid, action.body));
}

export function* watchInitializeMenuFromExplore() {
  yield takeEvery(INITIALIZE_MENU_FROM_EXPLORE, onInitializeMenu);
}

export function* watchOpenStudyInTsSuccess() {
  yield takeEvery(OPEN_STUDY_IN_TS_SUCCESS, openStudyInTableau);
}

export function* cantOpenStudyInTableau() {
  yield put(addToast('snackbars.study.openInTsFailed', { appearance: 'error', autoDismiss: true }));
}

export function* watchOpenStudyInTsFailure() {
  yield takeEvery(OPEN_STUDY_IN_TS_FAILURE, cantOpenStudyInTableau);
}

export const getTableauURL = generateProtectedApiCallSaga(
  studiesAPI.getTableauUrl,
  /* istanbul ignore next */
  (action) => [action.payload.uuid],
  openStudyInTsSuccess,
  openStudyInTsFailure,
);

export function* watchOpenStudyInTableauRequest() {
  yield takeEvery(OPEN_STUDY_IN_TS_REQUEST, getTableauURL);
}
