import { combineReducers } from 'redux';
import assetsReducer from './assets/reducer';
import categoriesReducer from './categories/reducer';

const iabReducer = combineReducers({
  assets: assetsReducer,
  categories: categoriesReducer,
});

export default iabReducer;
