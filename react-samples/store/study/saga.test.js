import sagaTestingHelper from 'redux-saga-testing';
import {
  call, takeEvery, put, select,
} from 'redux-saga/effects';
import {
  fetchStudyByUUID,
  watchFetchStudyByUUIDRequest,
  watchDeleteStudyRequest,
  deleteStudy,
  watchDeleteStudySuccess,
  afterDeleteStudySuccess,
  openStudyInTableau,
  watchInitializeMenuFromExplore,
  onInitializeMenu,
  watchOpenStudyInTsSuccess,
  cantOpenStudyInTableau,
  watchOpenStudyInTsFailure,
  watchOpenStudyInTableauRequest,
  getTableauURL,
  watchUpdateStudyContentRequest,
  updateStudyContentByUUID,
} from './saga';
import {
  FETCH_STUDY_BY_UUID_REQUEST,
  DELETE_STUDY_REQUEST,
  DELETE_STUDY_SUCCESS,
  deselectStudy,
  OPEN_STUDY_IN_TS_SUCCESS,
  OPEN_STUDY_IN_TS_FAILURE,
  OPEN_STUDY_IN_TS_REQUEST,
  UPDATE_STUDY_CONTENT_REQUEST,
  INITIALIZE_MENU_FROM_EXPLORE,
  initializeMenuFromExplore,
  updateStudyContentRequest,
} from './actions';
import { updateStudiesRequestParams } from '../studies/actions';
import { addToast } from '../toasts/actions';
import { getStudyUUID } from './selectors';

describe('watchFetchStudyByUUIDRequest', () => {
  const it = sagaTestingHelper(watchFetchStudyByUUIDRequest());

  it('takeEvery FETCH_STUDY_BY_UUID_REQUEST', (result) => {
    expect(result).toEqual(takeEvery(FETCH_STUDY_BY_UUID_REQUEST, fetchStudyByUUID));
  });
});

describe('watchDeleteStudyRequest', () => {
  const it = sagaTestingHelper(watchDeleteStudyRequest());

  it('takeEvery FETCH_DELETE_STUDY_REQUEST', (result) => {
    expect(result).toEqual(takeEvery(DELETE_STUDY_REQUEST, deleteStudy));
  });
});

describe('watchDeleteStudyRequestSuccess', () => {
  const it = sagaTestingHelper(watchDeleteStudySuccess());

  it('takeEvery FETCH_DELETE_STUDY_SUCCESS', (result) => {
    expect(result).toEqual(takeEvery(DELETE_STUDY_SUCCESS, afterDeleteStudySuccess));
  });
});

describe('afterDeleteStudySuccess', () => {
  const it = sagaTestingHelper(afterDeleteStudySuccess());

  it('puts deselect study', (result) => {
    expect(result).toEqual(put(deselectStudy()));
  });

  it('puts update study request params', (result) => {
    expect(result).toEqual(put(updateStudiesRequestParams()));
  });
});

describe('watchInitializeMenuFromExplore', () => {
  const it = sagaTestingHelper(watchInitializeMenuFromExplore());

  it('takeEvery INITIALIZE_MENU_FROM_EXPLORE', (result) => {
    expect(result).toEqual(takeEvery(INITIALIZE_MENU_FROM_EXPLORE, onInitializeMenu));
  });
});

describe('onInitialize', () => {
  const mockBody = {
    stories: {},
  };
  const it = sagaTestingHelper(onInitializeMenu(initializeMenuFromExplore(mockBody)));

  it('selects uuid from the current study', (result) => {
    expect(result).toEqual(select(getStudyUUID));

    return 'mock-uuid';
  });

  it('puts updateStudyContentRequest with the body of the previous action', (result) => {
    expect(result).toEqual(put(updateStudyContentRequest('mock-uuid', mockBody)));
  });

  it('is finished', (result) => {
    expect(result).toBeUndefined();
  });
});

describe('openStudyInTableau', () => {
  const action = {
    payload: {
      url: 'http://test.local',
    },
  };
  const win = {
    focus: () => {},
  };

  const it = sagaTestingHelper(openStudyInTableau(action));

  it('calls window open with URL from the action', (result) => {
    expect(result).toEqual(call(window.open, 'http://test.local', '_blank'));
    return win;
  });

  it('call focuse on new tab', (result) => {
    expect(result).toEqual(call(win.focus));
  });
});

describe('watchUpdateStudyContentRequest', () => {
  const it = sagaTestingHelper(watchUpdateStudyContentRequest());

  it('takes every UPDATE_STUDY_CONTENT_REQUEST', (result) => {
    expect(result).toEqual(takeEvery(UPDATE_STUDY_CONTENT_REQUEST, updateStudyContentByUUID));
  });
});

describe('watchOpenStudyInTsSuccess', () => {
  const it = sagaTestingHelper(watchOpenStudyInTsSuccess());

  it('takes every OPEN_STUDY_IN_TS_SUCCESS', (result) => {
    expect(result).toEqual(takeEvery(OPEN_STUDY_IN_TS_SUCCESS, openStudyInTableau));
  });
});

describe('cantOpenStudyInTableau', () => {
  const it = sagaTestingHelper(cantOpenStudyInTableau());

  it('adds toast notification', (result) => {
    expect(result).toEqual(
      put(addToast('snackbars.study.openInTsFailed', { appearance: 'error', autoDismiss: true })),
    );
  });
});

describe('watchOpenStudyInTsFailure', () => {
  const it = sagaTestingHelper(watchOpenStudyInTsFailure());

  it('takes every OPEN_STUDY_IN_TS_FAILURE', (result) => {
    expect(result).toEqual(takeEvery(OPEN_STUDY_IN_TS_FAILURE, cantOpenStudyInTableau));
  });
});

describe('watchOpenStudyInTableauRequest', () => {
  const it = sagaTestingHelper(watchOpenStudyInTableauRequest());

  it('takes every OPEN_STUDY_IN_TS_REQUEST', (result) => {
    expect(result).toEqual(takeEvery(OPEN_STUDY_IN_TS_REQUEST, getTableauURL));
  });
});
