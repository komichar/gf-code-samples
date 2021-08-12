export const FETCH_CATEGORIES_REQUEST = 'FETCH_CATEGORIES_REQUEST';
export const FETCH_CATEGORIES_SUCCESS = 'FETCH_CATEGORIES_SUCCESS';
export const FETCH_CATEGORIES_FAILURE = 'FETCH_CATEGORIES_FAILURE';

export function fetchCategoriesRequest() {
  return { type: FETCH_CATEGORIES_REQUEST };
}

export function fetchCategoriesSuccess(body) {
  return { type: FETCH_CATEGORIES_SUCCESS, body };
}

export function fetchCategoriesFailure(body) {
  return { type: FETCH_CATEGORIES_FAILURE, body };
}
