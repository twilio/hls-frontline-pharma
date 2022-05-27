import { createRef, useCallback, useMemo } from "react";
import { login, verifyMfa } from "../redux/actions";
import {
  mfaState as mfaStateSelector,
  loginState as loginStateSelector,
} from "../redux/selectors";
import { useDispatch, useSelector } from "react-redux";

const Login = () => {
  const codeRef = createRef(null);
  const passwordRef = createRef(null);
  const dispatch = useDispatch();
  const loginState = useSelector(loginStateSelector);
  const mfaState = useSelector(mfaStateSelector);

  const onLogin = useCallback(
    (e) => {
      e.preventDefault();
      dispatch(login(passwordRef.current.value));
    },
    [dispatch, passwordRef]
  );

  const onVerifyMfa = useCallback(
    (e) => {
      e.preventDefault();
      dispatch(
        verifyMfa({
          code: codeRef.current.value,
          token: loginState.accessToken,
        })
      );
    },
    [codeRef, dispatch, loginState.accessToken]
  );

  const loginPage = useMemo(() => {
    return (
      <>
        {loginState.fetchingFailure && (
          <p id="login-error" style={{ color: "red" }}>
            There was a problem logging in.
          </p>
        )}
        <form>
          <div>
            <label for="password-input">
              Password:{" "}
              <input
                id="password-input"
                type="password"
                name="password"
                ref={passwordRef}
                style={{ width: 400 }}
              />
            </label>
          </div>
          <button id="btn-authenticate" className="button" onClick={onLogin}>
            Authenticate
          </button>
        </form>
      </>
    );
  }, [loginState.fetchingFailure, onLogin, passwordRef]);

  const mfaPage = useMemo(() => {
    return (
      <>
        {mfaState.fetchingFailure && (
          <p id="login-error" style={{ color: "red" }}>
            There was a problem verifying your code.
          </p>
        )}
        <form>
          <div>
            <label for="mfa-input">
              <input
                id="mfa-input"
                type="text"
                name="mfacode"
                ref={codeRef}
                style={{ width: 400 }}
              />
            </label>
          </div>
          <button className="button" onClick={onVerifyMfa}>
            Verify Security Code
          </button>
        </form>
      </>
    );
  }, [codeRef, mfaState.fetchingFailure, onVerifyMfa]);

  return <>{loginState.fetchingSuccess ? mfaPage : loginPage}</>;
};

export default Login;
