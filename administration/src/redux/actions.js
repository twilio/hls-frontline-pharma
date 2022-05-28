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

export const clearState = createAction("CLEAR_STATE");
