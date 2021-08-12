export const FETCH_STUDY_BY_UUID_REQUEST = 'FETCH_STUDY_BY_UUID_REQUEST';
export const FETCH_STUDY_BY_UUID_SUCCESS = 'FETCH_STUDY_BY_UUID_SUCCESS';
export const FETCH_STUDY_BY_UUID_FAILURE = 'FETCH_STUDY_BY_UUID_FAILURE';

export function fetchStudyByUUIDRequest(uuid) {
  return {
    type: FETCH_STUDY_BY_UUID_REQUEST,
    uuid,
  };
}

export function fetchStudyByUUIDSuccess(body) {
  return {
    type: FETCH_STUDY_BY_UUID_SUCCESS,
    body,
  };
}
export function fetchStudyByUUIDFailure(body) {
  return {
    type: FETCH_STUDY_BY_UUID_FAILURE,
    body,
  };
}

export const OPEN_STUDY_IN_TS_REQUEST = 'OPEN_STUDY_IN_TS_REQUEST';
export const OPEN_STUDY_IN_TS_SUCCESS = 'OPEN_STUDY_IN_TS_SUCCESS';
export const OPEN_STUDY_IN_TS_FAILURE = 'OPEN_STUDY_IN_TS_FAILURE';

export function openStudyInTsRequest(uuid) {
  return {
    type: OPEN_STUDY_IN_TS_REQUEST,
    payload: { uuid },
  };
}
export function openStudyInTsSuccess(data) {
  return {
    type: OPEN_STUDY_IN_TS_SUCCESS,
    payload: data,
  };
}
export function openStudyInTsFailure() {
  return { type: OPEN_STUDY_IN_TS_FAILURE };
}

export const DESELECT_STUDY = 'DESELECT_STUDY';

export function deselectStudy() {
  return {
    type: DESELECT_STUDY,
  };
}

export const FORCE_EXPLORE_MENU = 'FORCE_EXPLORE_MENU';

export function forceExploreMenu() {
  return {
    type: FORCE_EXPLORE_MENU,
  };
}

export const INITIALIZE_MENU_FROM_EXPLORE = 'INITIALIZE_MENU_FROM_EXPLORE';

export function initializeMenuFromExplore(body) {
  return {
    type: INITIALIZE_MENU_FROM_EXPLORE,
    body,
  };
}

export const UPDATE_STUDY_CONTENT_REQUEST = 'UPDATE_STUDY_CONTENT_REQUEST';
export const UPDATE_STUDY_CONTENT_SUCCESS = 'UPDATE_STUDY_CONTENT_SUCCESS';
export const UPDATE_STUDY_CONTENT_FAILURE = 'UPDATE_STUDY_CONTENT_FAILURE';

export function updateStudyContentRequest(uuid, content) {
  return {
    type: UPDATE_STUDY_CONTENT_REQUEST,
    uuid,
    content,
  };
}

export function updateStudyContentSuccess(data, params) {
  return {
    type: UPDATE_STUDY_CONTENT_SUCCESS,
    data,
    params,
  };
}

export function updateStudyContentFailure(body) {
  return {
    type: UPDATE_STUDY_CONTENT_SUCCESS,
    body,
  };
}

export const DELETE_STUDY_REQUEST = 'DELETE_STUDY_REQUEST';
export const DELETE_STUDY_SUCCESS = 'DELETE_STUDY_SUCCESS';
export const DELETE_STUDY_FAILURE = 'DELETE_STUDY_FAILURE';

export function deleteStudyRequest(id) {
  return {
    type: DELETE_STUDY_REQUEST,
    id,
  };
}

export function deleteStudySuccess() {
  return {
    type: DELETE_STUDY_SUCCESS,
  };
}

export function deleteStudyFailure() {
  return {
    type: DELETE_STUDY_FAILURE,
  };
}
