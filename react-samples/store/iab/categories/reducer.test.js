import categoriesReducer from './reducer';
import {
  fetchCategoriesRequest,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
} from './actions';

describe('categories reducer', () => {
  const defaultState = categoriesReducer(undefined, { type: 'TEST' });

  it('has default state', () => {
    expect(defaultState).toEqual({
      loading: false,
      loaded: false,
      data: [],
    });
  });

  it('updates loading flag on FETCH_CATEGORIES_REQUEST', () => {
    const newState = categoriesReducer(defaultState, fetchCategoriesRequest());

    expect(newState).not.toBe(defaultState);
    expect(newState).toHaveProperty('loading', true);
  });

  it('updates state on FETCH_CATEGORIES_SUCCESS', () => {
    const categories = ['test'];
    const newState = categoriesReducer(
      { ...defaultState, loading: true },
      fetchCategoriesSuccess(categories),
    );

    expect(newState).not.toBe(defaultState);
    expect(newState).toEqual({
      ...defaultState,
      loading: false,
      loaded: true,
      data: categories,
    });
  });

  it('updates state on FETCH_CATEGORIES_FAILURE when state has been already loaded', () => {
    const newState = categoriesReducer(
      { ...defaultState, loading: true, loaded: true },
      fetchCategoriesFailure(''),
    );

    expect(newState).not.toBe(defaultState);
    expect(newState).toEqual({
      ...defaultState,
      loading: false,
      loaded: false,
    });
  });
});
