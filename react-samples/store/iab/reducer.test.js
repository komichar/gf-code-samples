import iabReducer from './reducer';

describe('iabReducer', () => {
  const defaultState = iabReducer(undefined, { type: 'TEST' });
  it('has keys', () => {
    const expectedIABKeys = [
      'assets',
      'categories',
    ];

    expect(Object.keys(defaultState)).toEqual(expectedIABKeys);
  });
});
