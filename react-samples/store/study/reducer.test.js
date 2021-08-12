import studyReducer, { initializeMenu } from './reducer';
import {
  fetchStudyByUUIDRequest,
  fetchStudyByUUIDSuccess,
  fetchStudyByUUIDFailure,
  deselectStudy,
  initializeMenuFromExplore,
  forceExploreMenu,
  updateStudyContentSuccess,
} from './actions';

import { studiesToggleFavoriteSuccess } from '../studies/actions';

describe('initializeMenu', () => {
  const initialMenu = {
    initialized: false,
    onepager: false,
    stories: {},
    worksheetsAndDashboards: {},
    urls: {},

  };

  it('returns initial menu if reportContent is null', () => {
    const menu = initializeMenu(null, null);

    expect(menu).toEqual(initialMenu);
  });

  it('returns menu that is initialized and onepager when reportContent.stories is empty object', () => {
    const menu = initializeMenu({
      stories: {},
      worksheetsAndDashboards: {},
      urls: {},
    }, new Date().toISOString());

    expect(menu).toEqual({
      initialized: true,
      onepager: true,
      stories: {},
      worksheetsAndDashboards: {},
      urls: {},
    });
  });

  // it does not initialize if date is older than 1 month

  it('returns a menu initialized from reportContent if reportContentUpdatedAt is less than 1 month old', () => {
    const menu = initializeMenu({
      stories: {
        story1: {
          0: 'story1point0',
          1: 'story1point1',
        },
        story2: {
          0: 'story2point0',
        },
      },
      worksheetsAndDashboards: {
        story1point0: true,
        story1point1: true,
        story1point2: true,
        story2point0: true,
      },
      urls: {
        story1point0: 'url1',
        story1point1: 'url2',
      },
    }, new Date().toISOString());

    expect(menu).toEqual({
      initialized: true,
      onepager: false,
      stories: {
        story1: {
          explored: true,
          points: ['story1point0', 'story1point1'],
        },
        story2: {
          explored: true,
          points: ['story2point0'],
        },
      },
      worksheetsAndDashboards: {
        story1point0: true,
        story1point1: true,
        story1point2: true,
        story2point0: true,
      },
      urls: {
        story1point0: 'url1',
        story1point1: 'url2',
      },
    });
  });
});

describe('studyReducer', () => {
  const defaultState = studyReducer(undefined, { type: 'TEST' });

  it('has default state', () => {
    expect(defaultState).toEqual({
      loading: false,
      loaded: false,
      data: null,
      error: null,
      menu: {
        initialized: false,
        onepager: false,
        stories: {},
        worksheetsAndDashboards: {},
        urls: {},
      },
    });
  });

  it('updates state on FETCH_STUDY_BY_UUID_REQUEST', () => {
    const newState = studyReducer(defaultState, fetchStudyByUUIDRequest());
    expect(newState).not.toBe(defaultState);
    expect(newState).toHaveProperty('loading', true);
  });

  it('updates state on FETCH_STUDY_BY_UUID_SUCCESS', () => {
    const mockStudy = {
      name: 'Mock Study',
      ticket: 'Mock Ticket',
      reportContent: null,
      reportContentUpdatedAt: null,
    };
    const newState = studyReducer(defaultState, fetchStudyByUUIDSuccess(mockStudy));
    expect(newState).not.toBe(defaultState);
    expect(newState).toEqual({
      ...defaultState,
      loading: false,
      loaded: true,
      data: mockStudy,
    });
  });

  it('updates state on FETCH_STUDY_BY_UUID_FAILURE', () => {
    const newState = studyReducer(defaultState, fetchStudyByUUIDFailure({}));
    expect(newState).not.toBe(defaultState);
    expect(newState).toEqual({
      ...defaultState,
      loading: false,
      loaded: false,
      data: null,
      error: true,
    });
  });

  it('updates state on DESELECT_STUDY', () => {
    const newState = studyReducer(defaultState, deselectStudy());
    expect(newState).not.toBe(defaultState);
    expect(newState).toEqual({
      ...defaultState,
      loading: false,
      loaded: false,
      data: null,
      error: null,
    });
  });

  describe('on STUDIES_TOGGLE_FAVORITE_SUCCESS', () => {
    it('returns old state on when study is not loaded', () => {
      const params = [
        {
          transition: 'NON_FAV_TO_FAV',
        },
        [1],
      ];
      const newState = studyReducer(defaultState, studiesToggleFavoriteSuccess(...params));
      expect(newState).toBe(defaultState);
    });

    it('returns old state on when study is loaded but id does not match', () => {
      const mockStudy = {
        id: 1,
        favorite: false,
      };
      const mockState = {
        ...defaultState,
        loaded: true,
        data: mockStudy,
      };
      const params = [
        {
          transition: 'NON_FAV_TO_FAV',
        },
        [2],
      ];
      const newState = studyReducer(mockState, studiesToggleFavoriteSuccess(...params));
      expect(newState).toBe(mockState);
    });

    it('updates favorite state when study is loaded and id does match', () => {
      const mockStudy = {
        id: 1,
        favorite: false,
      };
      const mockState = {
        ...defaultState,
        loaded: true,
        data: mockStudy,
      };
      const params = [
        {
          transition: 'NON_FAV_TO_FAV',
        },
        [1],
      ];
      const newState = studyReducer(mockState, studiesToggleFavoriteSuccess(...params));
      expect(newState).not.toBe(mockState);
      expect(newState).toEqual({
        ...mockState,
        data: { ...mockStudy, favorite: true },
      });
    });
  });

  it('updates state on INITIALIZE_MENU_FROM_EXPLORE', () => {
    const content = {
      stories: {
        story1: {
          0: 'story1point0',
          1: 'story1point1',
        },
        story2: {
          0: 'story2point0',
        },
      },
      worksheetsAndDashboards: {
        wd1: true,
        wd2: true,
      },
      urls: {
        story1point0: 'url1',
        story1point1: 'url2',
        story2point0: 'url3',
      },
    };

    const newState = studyReducer(defaultState, initializeMenuFromExplore(content, new Date().toISOString()));

    expect(newState).not.toBe(defaultState);
    expect(newState).toEqual({
      ...defaultState,
      menu: {
        initialized: true,
        onepager: false,
        stories: {
          story1: { explored: true, points: ['story1point0', 'story1point1'] },
          story2: { explored: true, points: ['story2point0'] },
        },
        worksheetsAndDashboards: {
          wd1: true,
          wd2: true,
        },
        urls: {
          story1point0: 'url1',
          story1point1: 'url2',
          story2point0: 'url3',
        },
      },
    });
  });

  it('updates state on FORCE_EXPLORE_MENU', () => {
    const newState = studyReducer({
      ...defaultState,
      menu: {
        initialized: true,
        onepager: false,
        stories: {
          story1: { explored: true, points: ['story1point0', 'story1point1'] },
          story2: { explored: true, points: ['story2point0'] },
        },
        worksheetsAndDashboards: {
          wd1: true,
          wd2: true,
        },
        urls: {
          story1point0: 'url1',
          story1point1: 'url2',
          story2point0: 'url3',
        },
      },
    }, forceExploreMenu());

    expect(newState).not.toBe(defaultState);
    expect(newState.menu.initialized).toEqual(false);
  });

  it('updates reportContent and reportContentUpdatedAt on UPDATE_STUDY_CONTENT_SUCCESS', () => {
    const newState = studyReducer({
      ...defaultState,
      data: {
        reportContent: null,
        reportContentUpdatedAt: null,
      },
    }, updateStudyContentSuccess(undefined, ['mock-uuuid', {
      stories: {
        story1: ['point1', 'point2'],
      },
      worksheetsAndDashboards: {
        point1: true,
        point2: true,
      },
      urls: {
        point1: 'point1url',
        point2: 'point2url',
        story: 'story1url',
      },
    }]));

    expect(newState).not.toBe(defaultState);
    expect(newState.data.reportContent).toEqual({
      stories: {
        story1: ['point1', 'point2'],
      },
      worksheetsAndDashboards: {
        point1: true,
        point2: true,
      },
      urls: {
        point1: 'point1url',
        point2: 'point2url',
        story: 'story1url',
      },
    });
    expect(newState.data.reportContentUpdatedAt).toBeTruthy();
  });
});
