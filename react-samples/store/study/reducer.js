import moment from 'moment';

import {
  DESELECT_STUDY,
  FETCH_STUDY_BY_UUID_REQUEST,
  FETCH_STUDY_BY_UUID_SUCCESS,
  FETCH_STUDY_BY_UUID_FAILURE,
  UPDATE_STUDY_CONTENT_SUCCESS,
  INITIALIZE_MENU_FROM_EXPLORE,
  FORCE_EXPLORE_MENU,
} from './actions';

import { STUDIES_TOGGLE_FAVORITE_SUCCESS } from '../studies/actions';

const initialMenu = {
  initialized: false,
  onepager: false,
  stories: {},
  worksheetsAndDashboards: {},
  urls: {},
};

const initialState = {
  loading: false,
  loaded: false,
  data: null,
  error: null,
  menu: {
    ...initialMenu,
  },
};

export function initializeMenu(content, updatedAt) {
  const unexplored = updatedAt === null;
  const exploredAndExpired = !!(updatedAt
    && (moment().diff(moment(updatedAt), 'months') >= 1));
  const explore = unexplored || exploredAndExpired;

  if (explore) {
    // should explore, return initial menu
    return {
      ...initialMenu,
    };
  }

  const onepager = content && content.stories && Object.keys(content.stories).length === 0;

  if (onepager) {
    return {
      initialized: true,
      onepager: true,
      stories: {},
      worksheetsAndDashboards: {},
      urls: {},
    };
  }

  return Object.keys(content.stories).reduce((menu, story) => {
    // eslint-disable-next-line no-param-reassign
    menu.stories[story] = {
      explored: true,
      points: Object.values(content.stories[story]),
    };

    return menu;
  }, {
    initialized: true,
    onepager: false,
    stories: {},
    worksheetsAndDashboards: content.worksheetsAndDashboards,
    urls: content.urls,
  });
}

export default function studyReducer(state = initialState, action) {
  switch (action.type) {
    case DESELECT_STUDY:
      return { ...initialState };
    case FETCH_STUDY_BY_UUID_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case FETCH_STUDY_BY_UUID_SUCCESS: {
      const {
        reportContent, reportContentUpdatedAt,
      } = action.body;

      return {
        ...state,
        loading: false,
        loaded: true,
        data: action.body,
        menu: initializeMenu(reportContent, reportContentUpdatedAt),
      };
    }
    case FETCH_STUDY_BY_UUID_FAILURE:
      return {
        ...state,
        loading: false,
        loaded: false,
        error: true,
      };
    case STUDIES_TOGGLE_FAVORITE_SUCCESS: {
      if (!state.loaded) {
        return state;
      }

      if (action.params.id !== state.data.id) {
        return state;
      }

      return {
        ...state,
        data: {
          ...state.data,
          favorite: action.params.transition === 'NON_FAV_TO_FAV',
        },
      };
    }
    case INITIALIZE_MENU_FROM_EXPLORE: {
      return {
        ...state,
        menu: initializeMenu(action.body, new Date().toISOString()),
      };
    }
    case FORCE_EXPLORE_MENU: {
      return {
        ...state,
        menu: {
          ...state.menu,
          initialized: false,
        },
      };
    }
    case UPDATE_STUDY_CONTENT_SUCCESS: {
      return {
        ...state,
        data: {
          ...state.data,
          reportContent: action.params[1],
          reportContentUpdatedAt: new Date().toISOString(),
        },
      };
    }
    default:
      return state;
  }
}
