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
  async (_params, { rejectWithValue }) => {
    try {
      const reset = await fetch(
        `https://${process.env.REACT_APP_BACKEND}/seeding/reset`,
        {
          method: "POST",
        }
      );

      if (reset.error)
        return rejectWithValue("Could not reset Salesforce data.");

      const seed = await fetch(
        `https://${process.env.REACT_APP_BACKEND}/seeding/seed`,
        {
          method: "POST",
        }
      );

      if (seed.error) return rejectWithValue("Could not seed Salesforce data.");

      return;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

//TODO: Implement for debugging only
export const clearState = createAction("CLEAR_STATE");
