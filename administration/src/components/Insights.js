import { useCallback } from "react";
import InsightsDashboard from "../images/InsightsDashboard.svg";

const Insights = ({onPageChange}) => {

    const goBack = useCallback((e)=> {
        e.preventDefault()
        onPageChange()
    }, [])

  return (
    <div style={{ display: 'flex', alignItems: "center", flexDirection: 'column' }}>
      <img src={InsightsDashboard} alt="Insights Dashboard" />
      <div>
        <button onClick={goBack}>Go Back</button>
      </div>
    </div>
  );
};
export default Insights;
