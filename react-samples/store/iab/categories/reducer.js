import {
  FETCH_CATEGORIES_REQUEST,
  FETCH_CATEGORIES_SUCCESS,
  FETCH_CATEGORIES_FAILURE,
} from './actions';

const initialState = {
  loading: false,
  loaded: false,
  data: [],
};

export default function categoriesReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_CATEGORIES_REQUEST:
      return { ...state, loading: true };
    case FETCH_CATEGORIES_SUCCESS:
      return {
        ...state, loading: false, loaded: true, data: action.body,
      };
    case FETCH_CATEGORIES_FAILURE:
      return { ...state, loading: false, loaded: false };
    default:
      return state;
  }
}
