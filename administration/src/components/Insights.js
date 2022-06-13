import { useCallback, useEffect, useState } from "react";
import InsightsDashboard from "../images/InsightsDashboard.svg";
import { useNavigate, useLocation } from "react-router-dom";
import "./Insights.css";

const Insights = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bodyCss, setBodyCss] = useState();

  const goBack = useCallback((e) => {
    e.preventDefault();
    navigate("/");
  }, []);

  //This hook replaces parent css with the component's needed css, then returns it back when the component unmounts.
  useEffect(() => {
    setBodyCss({
      borderTop: document.body.style.borderTop,
      padding: document.body.style.padding,
      maxWidth: document.body.style.maxWidth,
    });
    document.body.style.borderTop = 0;
    document.body.style.padding = 0;
    document.body.style.maxWidth = "100vw";

    return () => {
      document.body.style = {
        ...document.body.style,
        ...bodyCss,
      };
    };
  }, [location]);

  return (
    <div id="insights" style={{ display: "flex" }}>
      <img
        src={InsightsDashboard}
        alt="Insights Dashboard"
        style={{ height: "100vh" }}
      />
      <div style={{ display: "flex" }}>
        <button onClick={goBack} style={{ alignSelf: "end" }}>
          Go Back
        </button>
      </div>
    </div>
  );
};
export default Insights;
