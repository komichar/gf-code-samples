export const RESET_IAB_ASSETS_AND_TERM = 'RESET_IAB_ASSETS_AND_TERM';
export function resetIABAssetsAndTerm() {
  return {
    type: RESET_IAB_ASSETS_AND_TERM,
  };
}

export const DEBOUNCE_UPDATE_SEARCH_IAB_ASSETS_TERM = 'DEBOUNCE_UPDATE_SEARCH_IAB_ASSETS_TERM';
export function debounceUpdateSearchIABAssetsTerm(term, segmentId) {
  return {
    type: DEBOUNCE_UPDATE_SEARCH_IAB_ASSETS_TERM,
    term,
    segmentId,
  };
}

export const SEARCH_IAB_ASSETS_REQUEST = 'SEARCH_IAB_ASSETS_REQUEST';
export function searchIABAssetsRequest(term) {
  return {
    type: SEARCH_IAB_ASSETS_REQUEST,
    term,
  };
}

export const SEARCH_IAB_ASSETS_SUCCESS = 'SEARCH_IAB_ASSETS_SUCCESS';
export function searchIABAssetsSuccess(data) {
  return {
    type: SEARCH_IAB_ASSETS_SUCCESS,
    data,
  };
}

export const SEARCH_IAB_ASSETS_FAILURE = 'SEARCH_IAB_ASSETS_FAILURE';
export function searchIABAssetsFailure(error) {
  return {
    type: SEARCH_IAB_ASSETS_FAILURE,
    error,
  };
}
