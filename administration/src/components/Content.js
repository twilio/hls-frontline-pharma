import { createRef, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  listCsvs,
  readCsv,
  resetAndSeed as resetAndSeedAction,
} from "../redux/actions";
import {
  listCsvState as listCsvStateSelector,
  mfaState as mfaStateSelector,
  readCsvState as readCsvStateSelector,
  resetAndSeedState as resetAndSeedStateSelector,
} from "../redux/selectors";
import LoadingText from "./LoadingText";
import Spreadsheet from "./Spreadsheet";

const Content = () => {
  const dispatch = useDispatch();
  const resetAndSeedState = useSelector(resetAndSeedStateSelector);
  const mfaState = useSelector(mfaStateSelector);
  const listCsvState = useSelector(listCsvStateSelector);
  const readCsvState = useSelector(readCsvStateSelector)

  //get all available templates for editing
  useEffect(() => {
    if (
      !listCsvState.fetching &&
      !listCsvState.fetchingFailure &&
      !listCsvState.fetchingSuccess
    ) {
      dispatch(listCsvs());
    }
  }, [
    dispatch,
    listCsvState.fetching,
    listCsvState.fetchingFailure,
    listCsvState.fetchingSuccess,
  ]);

  const resetAndSeed = useCallback(
    (e) => {
      e.preventDefault();
      dispatch(resetAndSeedAction({ token: mfaState.accessToken }));
    },
    [dispatch]
  );

  useEffect(() => {
    if (listCsvState.fetchingSuccess && listCsvState.data.length > 0) {
      dispatch(readCsv({ files: listCsvState.data }));
    }
  }, [
    listCsvState.fetching,
    listCsvState.fetchingFailure,
    listCsvState.fetchingSuccess,
  ]);

 const spreadsheets = useMemo(()=>{
  if(readCsvState.fetchingSuccess && readCsvState.data.length > 0){
    const res =  readCsvState.data.map((csv)=>{
      return <div style={{paddingTop: "2rem"}}>
        <Spreadsheet name={Object.keys(csv)[0]} data={Object.values(csv)[0]} />
        <hr />
      </div>
    })
    return res
  }
 }, [
  readCsvState.fetching,
  readCsvState.fetchingFailure,
  readCsvState.fetchingSuccess,
 ])

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
      <div>
        {spreadsheets}
      </div>
    </>
  );
};

export default Content;
