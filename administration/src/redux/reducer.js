import { createReducer } from "@reduxjs/toolkit";
import {
  login,
  resetAndSeed,
  verifyMfa,
  readCsv,
  listCsvs,
  writeCsv,
  syncWithSalesforce,
  accessTokenFromStorage,
  fetchSupervisoryContent,
} from "./actions";
import jwt_decode from "jwt-decode";

const TOKEN_VAR_NAME = "HLS-Frontline-Token";

const fetchingState = {
  fetching: false,
  fetchingSuccess: false,
  fetchingFailure: false,
};

export const initialState = {
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
  supervisoryState: {
    ...fetchingState,
    blockedContent: [],
  },
  syncSalesforceState: {
    ...fetchingState,
  },
  writeCsvState: {
    ...fetchingState,
    outOfSyncChanges: 0,
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
      localStorage.setItem(TOKEN_VAR_NAME, payload);
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
        writeCsvState: {
          ...state.writeCsvState,
          outOfSyncChanges: 0,
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
    .addCase(writeCsv.pending, (state) => {
      return {
        ...state,
        writeCsvState: {
          ...state.writeCsvState,
          fetching: true,
          fetchingFailure: false,
          fetchingSuccess: false,
        },
      };
    })
    .addCase(writeCsv.fulfilled, (state, { payload }) => {
      return {
        ...state,
        writeCsvState: {
          fetching: false,
          fetchingFailure: false,
          fetchingSuccess: true,
          //only increment out of sync changes if what was edited was a template, but not Templates_Template.
          outOfSyncChanges:
            payload.includes("_Template") && !payload.includes("Templates")
              ? state.writeCsvState.outOfSyncChanges + 1
              : state.writeCsvState.outOfSyncChanges,
        },
      };
    })
    .addCase(writeCsv.rejected, (state) => {
      return {
        ...state,
        writeCsvState: {
          ...state.writeCsvState,
          fetching: false,
          fetchingFailure: true,
          fetchingSuccess: false,
        },
      };
    })
    .addCase(syncWithSalesforce.pending, (state) => {
      return {
        ...state,
        syncSalesforceState: {
          fetching: true,
          fetchingFailure: false,
          fetchingSuccess: false,
        },
      };
    })
    .addCase(syncWithSalesforce.fulfilled, (state) => {
      console.log(state.writeCsvState.fetching);
      return {
        ...state,
        syncSalesforceState: {
          fetching: false,
          fetchingFailure: false,
          fetchingSuccess: true,
        },
        writeCsvState: {
          ...state.writeCsvState,
          outOfSyncChanges: 0,
        },
      };
    })
    .addCase(syncWithSalesforce.rejected, (state) => {
      return {
        ...state,
        syncSalesforceState: {
          fetching: false,
          fetchingFailure: true,
          fetchingSuccess: false,
        },
      };
    })
    .addCase(accessTokenFromStorage, (state) => {
      const token = localStorage.getItem(TOKEN_VAR_NAME);
      if (token) {
        const decoded = jwt_decode(token);
        if (decoded.exp * 1000 > Date.now()) {
          return {
            ...state,
            mfaState: {
              fetching: false,
              fetchingSuccess: true,
              fetchingFailure: false,
              accessToken: token,
            },
          };
        }
      }
    })
    .addCase(fetchSupervisoryContent.pending, (state) => {
      return {
        ...state,
        supervisoryState: {
          fetching: true,
          fetchingFailure: false,
          fetchingSuccess: false,
        },
      };
    })
    .addCase(fetchSupervisoryContent.fulfilled, (state, { payload }) => {
      console.log(payload);
      return {
        ...state,
        supervisoryState: {
          blockedContent: payload,
          fetching: false,
          fetchingFailure: false,
          fetchingSuccess: true,
        },
      };
    })
    .addCase(fetchSupervisoryContent.rejected, (state) => {
      return {
        ...state,
        supervisoryState: {
          fetching: false,
          fetchingFailure: true,
          fetchingSuccess: false,
        },
      };
    });
});

export default reducer;
