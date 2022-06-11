import { createRef, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  listCsvs,
  readCsv,
  resetAndSeed as resetAndSeedAction,
  syncWithSalesforce,
} from "../redux/actions";
import {
  listCsvState as listCsvStateSelector,
  mfaState as mfaStateSelector,
  readCsvState as readCsvStateSelector,
  resetAndSeedState as resetAndSeedStateSelector,
  outOfSyncChangesState as outOfSyncChangesSelector,
  syncSalesforceState as syncSalesforceStateSelector
} from "../redux/selectors";
import LoadingText from "./LoadingText";
import Spreadsheet from "./Spreadsheet";
import EditableTextarea from "./EditableTextarea";

const Content = ({onPageChange}) => {
  const dispatch = useDispatch();
  const resetAndSeedState = useSelector(resetAndSeedStateSelector);
  const mfaState = useSelector(mfaStateSelector);
  const listCsvState = useSelector(listCsvStateSelector);
  const readCsvState = useSelector(readCsvStateSelector);
  const syncSalesforceState = useSelector(syncSalesforceStateSelector)
  const outOfSyncChangesState = useSelector(outOfSyncChangesSelector)

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

  const syncSalesforce = useCallback(
    (e) => {
      e.preventDefault();
      dispatch(syncWithSalesforce({ token: mfaState.accessToken }));
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

  const spreadsheets = useMemo(() => {
    if (readCsvState.fetchingSuccess && readCsvState.data.length > 0) {
      const res = readCsvState.data.map((csv) => {
        if (Object.keys(csv)[0].includes("Template")) {
          return (
            <div style={{ paddingTop: "2rem" }}>
              <Spreadsheet
                name={Object.keys(csv)[0]}
                data={Object.values(csv)[0]}
              />
              <hr />
            </div>
          );
        }
      });
      return res;
    }
  }, [
    readCsvState.fetching,
    readCsvState.fetchingFailure,
    readCsvState.fetchingSuccess,
  ]);

  const editableTextareas = useMemo(() => {
    if (readCsvState.fetchingSuccess && readCsvState.data.length > 0) {
      const res = readCsvState.data.map((csv) => {
        if (Object.keys(csv)[0].includes("List")) {
          console.log(Object.keys(csv)[0]);
          return (
            <div style={{ paddingTop: "2rem" }}>
              <EditableTextarea
                name={Object.keys(csv)[0]}
                data={Object.values(csv)[0]}
              />
              <hr />
            </div>
          );
        }
      });
      return res;
    }
  }, [
    readCsvState.fetching,
    readCsvState.fetchingFailure,
    readCsvState.fetchingSuccess,
  ]);

  const viewInsights = useCallback((e)=>{
    e.preventDefault()
    onPageChange()
  }, [])

  const syncWarningText = useMemo(()=>{
    return `${outOfSyncChangesState} change${outOfSyncChangesState === 1 ? '' : 's'} not in sync with Salesforce. Press "Sync Data" to sync Twilio Sync with Salesforce.`
  }, [outOfSyncChangesState])

  const btnCss = useMemo(()=> {
    return {
      minWidth: 150
    }
  })

  return (
    <>
      <form>
        <button id="btn-seed" className="button" onClick={resetAndSeed} style={{...btnCss}}>
          Seed Data
        </button>
        <div style={{ display: "inline-block", paddingLeft: 32 }}>
          <LoadingText
            description="Reset Salesforce account and Twilio Sync and seed data from scratch"
            fetchSelector={resetAndSeedState}
            name={"Seed Data"}
          />
        </div>
        <br />
        <button id="btn-sync" className="button" onClick={syncSalesforce} style={{...btnCss}}>
          Sync Data
        </button>
        <div style={{ display: "inline-block", paddingLeft: 32 }}>
          <LoadingText
            description="Sync Twilio Sync with Salesforce"
            fetchSelector={syncSalesforceState}
            name={"Sync Data with Salesforce"}
          />
        </div><br/>
        {outOfSyncChangesState > 0 && <div><span style={{color:"red"}}>{syncWarningText}</span><br/></div>}
        <button id="btn-sync" className="button" onClick={viewInsights} style={{...btnCss}}>
          Insights
        </button>
        <div style={{ display: "inline-block", paddingLeft: 32 }}>
          <span>View insights dashboard.</span>
        </div><br/>
      </form>
      <div>{spreadsheets}</div>
      <div>{editableTextareas}</div>
    </>
  );
};

export default Content;
