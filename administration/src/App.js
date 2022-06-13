import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Content from "./components/Content";
import { useDispatch, useSelector } from "react-redux";
import { mfaState as mfaStateSelector } from "./redux/selectors";
import Insights from "./components/Insights";
import { accessTokenFromStorage } from "./redux/actions";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

function App() {
  const { fetchingSuccess, fetchingFailure } = useSelector(mfaStateSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!fetchingSuccess || !fetchingFailure) {
      dispatch(accessTokenFromStorage());
    }
  }, [fetchingFailure, fetchingSuccess]);


  const content = useMemo(() => {
    return (
      <>
        <Header />
        {fetchingSuccess ? <Content /> : <Login />}
        <Footer />
      </>
    );
  }, [fetchingSuccess]);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Insights />} />
          <Route path="/" element={content} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
