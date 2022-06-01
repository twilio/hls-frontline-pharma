import { createAsyncThunk, createAction } from "@reduxjs/toolkit";

export const login = createAsyncThunk(
  "[Auth] Login",
  async (pass, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `http://${process.env.REACT_APP_BACKEND}/authentication`,
        {
          method: "POST",
          body: new URLSearchParams({ command: "login", password: pass }),
        }
      )
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
      const res = await fetch(
        `http://${process.env.REACT_APP_BACKEND}/authentication`,
        {
          method: "POST",
          body: new URLSearchParams({ command: "mfa", code, token }),
        }
      )
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
      const reset = await fetch(
        `http://${process.env.REACT_APP_BACKEND}/seeding/reset`,
        {
          method: "POST",
          body: new URLSearchParams({
            token,
          }),
        }
      );

      if (reset.error)
        return rejectWithValue("Could not reset Salesforce data.");

      const seed = await fetch(
        `http://${process.env.REACT_APP_BACKEND}/seeding/seed`,
        {
          method: "POST",
          body: new URLSearchParams({
            token,
          }),
        }
      );

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
      const data = await fetch(
        `http://${process.env.REACT_APP_BACKEND}/seeding/edit`,
        {
          method: "POST",
          body: new URLSearchParams({
            cmd: "update",
            name:tableName,
            data: JSON.stringify(tableData),
            token,
          }),
        }
      ).then((resp) => resp.json());
      if (data.error) return rejectWithValue("Could not write csv.");
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
      const data = await fetch(
        `http://${process.env.REACT_APP_BACKEND}/seeding/edit`,
        {
          method: "POST",
          body: new URLSearchParams({
            cmd: "read-all",
            files,
            token,
          }),
        }
      )
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
      const data = await fetch(
        `http://${process.env.REACT_APP_BACKEND}/seeding/edit`,
        {
          method: "POST",
          body: new URLSearchParams({
            cmd: "list",
            token,
          }),
        }
      )
        .then((resp) => resp.json())
        .then((resp) => resp.result);
      if (data.error) return rejectWithValue("Could not get csv.");
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

//TODO: Implement for debugging only
export const clearState = createAction("CLEAR_STATE");
