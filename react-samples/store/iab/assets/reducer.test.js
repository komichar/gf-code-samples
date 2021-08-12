import iabAssetsReducer from './reducer';

import {
  resetIABAssetsAndTerm, searchIABAssetsFailure, searchIABAssetsRequest, searchIABAssetsSuccess,
} from './actions';

describe('iabAssetsReducer', () => {
  const defaultState = iabAssetsReducer(undefined, { type: 'TEST' });

  it('has default state', () => {
    expect(defaultState).toEqual({
      loading: false,
      term: '',
      data: [],
    });
  });

  it('sets loading flag and updates search term on SEARCH_IAB_ASSETS_REQUEST', () => {
    const newState = iabAssetsReducer(defaultState, searchIABAssetsRequest('test'));

    expect(newState).not.toBe(defaultState);
    expect(newState).toEqual({
      loading: true,
      term: 'test',
      data: [],
    });
  });

  it('sets loading flag and updates data on SEARCH_IAB_ASSETS_SUCCESS', () => {
    const state = {
      ...defaultState,
      loading: true,
      term: 'test',
    };
    const newState = iabAssetsReducer(state, searchIABAssetsSuccess([
      { id: 1, name: 'Test' },
    ]));

    expect(newState).not.toBe(defaultState);
    expect(newState).toEqual({
      loading: false,
      term: 'test',
      data: [
        { id: 1, name: 'Test' },
      ],
    });
  });

  it('sets loading flag and removed data on SEARCH_IAB_ASSETS_FAILURE', () => {
    const state = {
      ...defaultState,
      loading: false,
      term: 'test',
      data: [
        { id: 1, name: 'Test' },
      ],
    };
    const newState = iabAssetsReducer(state, searchIABAssetsFailure('Test Error'));

    expect(newState).not.toBe(defaultState);
    expect(newState).toEqual({
      loading: false,
      term: 'test',
      data: [],
    });
  });

  it('resets to initial state on RESET_IAB_ASSETS_AND_TERM', () => {
    const state = {
      ...defaultState,
      loading: false,
      term: 'test',
      data: [
        { id: 1, name: 'Test' },
      ],
    };

    const newState = iabAssetsReducer(state, resetIABAssetsAndTerm());

    expect(newState).toEqual(defaultState);
  });
});
