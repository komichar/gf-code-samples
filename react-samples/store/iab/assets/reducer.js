import {
  SEARCH_IAB_ASSETS_REQUEST,
  SEARCH_IAB_ASSETS_SUCCESS,
  SEARCH_IAB_ASSETS_FAILURE,
  RESET_IAB_ASSETS_AND_TERM,
} from './actions';

const initState = {
  loading: false,
  term: '',
  data: [],
};

export default function iabAssetsReducer(state = initState, action) {
  switch (action.type) {
    case SEARCH_IAB_ASSETS_REQUEST:
      return {
        ...state,
        loading: true,
        term: action.term,
      };
    case SEARCH_IAB_ASSETS_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.data,
      };
    case SEARCH_IAB_ASSETS_FAILURE: {
      return {
        ...state,
        loading: false,
        data: [],
      };
    }
    case RESET_IAB_ASSETS_AND_TERM: {
      return initState;
    }
    default:
      return state;
  }
}
