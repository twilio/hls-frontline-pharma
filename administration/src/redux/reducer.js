import { createReducer } from "@reduxjs/toolkit";
import { login, resetAndSeed, verifyMfa, readCsv, listCsvs } from "./actions";

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
  listCsvState: {
    ...fetchingState,
    data: [],
  },
  mfaState: {
    ...fetchingState,
    accessToken: "do_not_remove",
  },
  readCsvState: {
    ...fetchingState,
    data: [],
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
    })
    .addCase(readCsv.pending, (state) => {
      return {
        ...state,
        readCsvState: {
          data: [],
          fetching: true,
          fetchingFailure: false,
          fetchingSuccess: false,
        },
      };
    })
    .addCase(readCsv.fulfilled, (state, { payload }) => {
      return {
        ...state,
        readCsvState: {
          data: payload,
          fetching: false,
          fetchingFailure: false,
          fetchingSuccess: true,
        },
      };
    })
    .addCase(readCsv.rejected, (state) => {
      return {
        ...state,
        readCsvState: {
          fetching: false,
          fetchingFailure: true,
          fetchingSuccess: false,
        },
      };
    })
    .addCase(listCsvs.pending, (state) => {
      return {
        ...state,
        listCsvState: {
          data: [],
          fetching: true,
          fetchingFailure: false,
          fetchingSuccess: false,
        },
      };
    })
    .addCase(listCsvs.fulfilled, (state, { payload }) => {
      return {
        ...state,
        listCsvState: {
          data: payload,
          fetching: false,
          fetchingFailure: false,
          fetchingSuccess: true,
        },
      };
    })
    .addCase(listCsvs.rejected, (state) => {
      return {
        ...state,
        listCsvState: {
          fetching: false,
          fetchingFailure: true,
          fetchingSuccess: false,
        },
      };
    })
});

export default reducer;
