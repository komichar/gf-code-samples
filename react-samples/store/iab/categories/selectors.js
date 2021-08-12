// eslint-disable-next-line import/prefer-default-export
export function getIabCategories(state) {
  try {
    return state.iab.categories.data.map((name, index) => ({
      id: index,
      name,
    }));
  } catch {
    return [];
  }
}
