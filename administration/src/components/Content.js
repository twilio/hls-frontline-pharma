import { createRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetAndSeed as resetAndSeedAction } from "../redux/actions";
import { resetAndSeedState as resetAndSeedStateSelector } from "../redux/selectors";
import LoadingText from "./LoadingText";

const Content = () => {
  const dispatch = useDispatch();
  const resetAndSeedState = useSelector(resetAndSeedStateSelector);

  const resetAndSeed = useCallback(
    (e) => {
      e.preventDefault();
      dispatch(resetAndSeedAction());
    },
    [dispatch]
  );


  return (
    <>
      <form>
        <div>
          <p>Reset Salesforce account and seed data.</p>
          <LoadingText fetchSelector={resetAndSeedState} name={"Seed Data"} />
        </div>
        <button id="btn-authenticate" className="button" onClick={resetAndSeed}>
          Seed Data
        </button>
      </form>
    </>
  );
};

export default Content;
