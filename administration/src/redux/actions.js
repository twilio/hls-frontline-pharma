import { createAction, createAsyncThunk } from "@reduxjs/toolkit";

export const login = createAsyncThunk(
  "[Auth] Login",
  async (pass, { rejectWithValue }) => {
    try {
      const res = await fetch(`${getBasePath()}/authentication`, {
        method: "POST",
        body: new URLSearchParams({ command: "login", password: pass }),
      })
        .then((resp) => resp.json())
        .then((resp) => resp.accessToken);
      if (!res) return rejectWithValue("Request failed");
      return res;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const verifyMfa = createAsyncThunk(
  "[Auth] Verify MFA",
  async (params, { rejectWithValue }) => {
    try {
      const { code, token } = params;
      const res = await fetch(`${getBasePath()}/authentication`, {
        method: "POST",
        body: new URLSearchParams({ command: "mfa", code, token }),
      })
        .then((resp) => resp.json())
        .then((resp) => resp.accessToken);
      if (!res) return rejectWithValue("Request failed");
      return res;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const resetAndSeed = createAsyncThunk(
  "[Admin] Reset and Seed",
  async (params, { rejectWithValue }) => {
    try {
      const { token } = params;
      const reset = await fetch(`${getBasePath()}/seeding/reset`, {
        method: "POST",
        body: new URLSearchParams({
          token,
          type: "full",
        }),
      });

      if (reset.error)
        return rejectWithValue("Could not reset Salesforce/Sync data.");

      const seed = await fetch(`${getBasePath()}/seeding/seed`, {
        method: "POST",
        body: new URLSearchParams({
          token,
          type: "reseed",
        }),
      });

      if (seed.error) return rejectWithValue("Could not seed Salesforce data.");

      return;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const writeCsv = createAsyncThunk(
  "[Admin] Write CSV",
  async (params, { getState, rejectWithValue }) => {
    try {
      const token = getState().app.mfaState.accessToken;
      const { tableName, tableData } = params;
      const data = await fetch(`${getBasePath()}/seeding/edit`, {
        method: "POST",
        body: new URLSearchParams({
          cmd: "update",
          name: tableName,
          data: JSON.stringify(tableData),
          token,
        }),
      }).then((resp) => resp.json());
      if (data.error) return rejectWithValue("Could not write csv.");
      return tableName;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const readCsv = createAsyncThunk(
  "[Admin] Read all CSVs",
  async (params, { rejectWithValue, getState }) => {
    try {
      const token = getState().app.mfaState.accessToken;
      const { files } = params;
      const data = await fetch(`${getBasePath()}/seeding/edit`, {
        method: "POST",
        body: new URLSearchParams({
          cmd: "read-all",
          files,
          token,
        }),
      })
        .then((resp) => resp.json())
        .then((resp) => resp.result);
      if (data.error) return rejectWithValue("Could not get csvs.");
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const listCsvs = createAsyncThunk(
  "[Admin] List CSVs",
  async (_params, { rejectWithValue, getState }) => {
    try {
      const token = getState().app.mfaState.accessToken;
      const data = await fetch(`${getBasePath()}/seeding/edit`, {
        method: "POST",
        body: new URLSearchParams({
          cmd: "list",
          token,
        }),
      })
        .then((resp) => resp.json())
        .then((resp) => resp.result);
      if (data.error) return rejectWithValue("Could not get csv.");
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const syncWithSalesforce = createAsyncThunk(
  "[Admin] Sync Salesforce",
  async (params, { rejectWithValue }) => {
    try {
      const { token } = params;
      const reset = await fetch(`${getBasePath()}/seeding/reset`, {
        method: "POST",
        body: new URLSearchParams({
          token,
          type: "nosync",
        }),
      });

      if (reset.error)
        return rejectWithValue("Could not reset Salesforce data.");
      const seed = await fetch(`${getBasePath()}/seeding/seed`, {
        method: "POST",
        body: new URLSearchParams({
          token,
          type: "sync",
        }),
      });

      if (seed.error) return rejectWithValue("Could not sync Salesforce data.");

      return;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const fetchSupervisoryContent = createAsyncThunk(
  "[Admin] Fetch Supervisory Content",
  async (params, { rejectWithValue }) => {
    try {
      const { token } = params;

      const res = await fetch(`${getBasePath()}/blocked-content`, {
        method: "POST",
        body: new URLSearchParams({
          token,
        }),
      }).then((resp)=>resp.json())
      
      if (res.error) return rejectWithValue("Could not get blocked content");

      return res.result;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const accessTokenFromStorage = createAction(
  "[Admin] Get Access Token from Localstorage"
);

const getBasePath = () => {
  const origin = window.location.origin;
  if (origin.includes("localhost") || origin.includes("file://"))
    return "http://localhost:3000";
  return origin;
};
