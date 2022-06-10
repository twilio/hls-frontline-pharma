import { configureStore } from '@reduxjs/toolkit';
import reducer, { initialState } from './reducer'

export const store = configureStore({
  reducer: {
    app: reducer
  },
});
