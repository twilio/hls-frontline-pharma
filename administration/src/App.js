import React from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Content from "./components/Content";
import { useSelector } from "react-redux";
import { mfaState as mfaStateSelector } from "./redux/selectors";

function App() {
  const { accessToken: mfaAccessToken } = useSelector(mfaStateSelector);

  return (
    <>
      <Header />
      {mfaAccessToken ? <Content /> : <Login />}
      <Footer />
    </>
  );
}

export default App;
