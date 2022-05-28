import { createReducer } from "@reduxjs/toolkit";
import { login, verifyMfa } from "./actions";

const initialState = {
  loginState: {
    fetching: false,
    fetchingSuccess: false,
    fetchingFailure: false,
    accessToken: "",
  },
  mfaState: {
    fetching: false,
    fetchingSuccess: false,
    fetchingFailure: false,
    accessToken: "",
  },
};

const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(login.pending, (_) => {
      return {
        loginState: {
          fetching: true,
          fetchingSuccess: false,
          fetchingFailure: false,
          accessToken: "",
        },
        mfaState: {
          fetching: false,
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
    });
});

export default reducer;
