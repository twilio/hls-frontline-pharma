import { createReducer } from "@reduxjs/toolkit";
import { login, resetAndSeed, verifyMfa } from "./actions";

const fetchingState = {
  fetching: false,
  fetchingSuccess: false,
  fetchingFailure: false,
};

const initialState = {
  loginState: {
    ...fetchingState,
    accessToken: "",
  },
  mfaState: {
    ...fetchingState,
    accessToken: "",
  },
  resetAndSeedState: {
    ...fetchingState,
  },
};

const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(login.pending, (_) => {
      return {
        ...initialState,
        loginState: {
          fetching: true,
          fetchingSuccess: false,
          fetchingFailure: false,
          accessToken: "",
        },
      };
    })
    .addCase(login.fulfilled, (state, { payload }) => {
      return {
        ...state,
        loginState: {
          fetching: false,
          fetchingSuccess: true,
          fetchingFailure: false,
          accessToken: payload,
        },
      };
    })
    .addCase(login.rejected, (state) => {
      return {
        ...state,
        loginState: {
          fetching: false,
          fetchingSuccess: false,
          fetchingFailure: true,
        },
      };
    })
    .addCase(verifyMfa.pending, (state) => {
      return {
        ...state,
        mfaState: {
          fetching: true,
          fetchingSuccess: false,
          fetchingFailure: false,
          accessToken: "",
        },
      };
    })
    .addCase(verifyMfa.fulfilled, (state, { payload }) => {
      return {
        ...state,
        mfaState: {
          fetching: false,
          fetchingSuccess: true,
          fetchingFailure: false,
          accessToken: payload,
        },
      };
    })
    .addCase(verifyMfa.rejected, (state) => {
      return {
        ...state,
        mfaState: {
          fetching: false,
          fetchingSuccess: false,
          fetchingFailure: true,
        },
      };
    })
    .addCase(resetAndSeed.pending, (state) => {
      return {
        ...state,
        resetAndSeedState: {
          fetching: true,
          fetchingFailure: false,
          fetchingSuccess: false,
        },
      };
    })
    .addCase(resetAndSeed.fulfilled, (state) => {
      return {
        ...state,
        resetAndSeedState: {
          fetching: false,
          fetchingFailure: false,
          fetchingSuccess: true,
        },
      };
    })
    .addCase(resetAndSeed.rejected, (state) => {
      return {
        ...state,
        resetAndSeedState: {
          fetching: false,
          fetchingFailure: true,
          fetchingSuccess: false,
        },
      };
    });
});

export default reducer;
