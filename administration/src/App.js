import React, { useMemo, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Content from "./components/Content";
import { useSelector } from "react-redux";
import { mfaState as mfaStateSelector } from "./redux/selectors";
import Insights from "./components/Insights";

export const CONTENT_PAGE = 0;
export const INSIGHTS_PAGE = 1;

function App() {
  const { fetchingSuccess } = useSelector(mfaStateSelector);
  const [activePage, setActivePage] = useState(CONTENT_PAGE);

  const loggedInView = useMemo(() => {
    if (activePage === CONTENT_PAGE) {
      return <Content onPageChange={() => setActivePage(INSIGHTS_PAGE)} />;
    } else if (activePage === INSIGHTS_PAGE) {
      return <Insights onPageChange={() => setActivePage(CONTENT_PAGE)} />;
    }
  }, [activePage]);

  return (
    <>
      <Header />
      {fetchingSuccess ? loggedInView : <Login />}
      <Footer />
    </>
  );
}

export default App;
