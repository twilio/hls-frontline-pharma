import { createRef, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSupervisoryContent,
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
  syncSalesforceState as syncSalesforceStateSelector,
  blockedContentState as blockedContentSelector,
} from "../redux/selectors";
import LoadingText from "./LoadingText";
import Spreadsheet from "./Spreadsheet";
import EditableTextarea from "./EditableTextarea";
import { useNavigate } from "react-router-dom";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import { Circles } from "react-loader-spinner";
import Supervisory from "./Supervisory";

const Content = () => {
  const dispatch = useDispatch();
  const resetAndSeedState = useSelector(resetAndSeedStateSelector);
  const mfaState = useSelector(mfaStateSelector);
  const listCsvState = useSelector(listCsvStateSelector);
  const readCsvState = useSelector(readCsvStateSelector);
  const syncSalesforceState = useSelector(syncSalesforceStateSelector);
  const outOfSyncChangesState = useSelector(outOfSyncChangesSelector);
  const blockedContentState = useSelector(blockedContentSelector);
  const navigate = useNavigate();

  /** Removes trailing "_Template" or "_List" suffixes. */
  const cleanupNames = (name) => {
    if (name.includes("_")) {
      return name.substring(0, name.indexOf("_"));
    }
    return name;
  };

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

  useEffect(() => {
    const { fetching, fetchingFailure, fetchingSuccess } = blockedContentState;

    if (!fetching && !fetchingFailure && !fetchingSuccess) {
      dispatch(fetchSupervisoryContent({ token: mfaState.accessToken }));
    }
  }, [blockedContentState]);

  const spreadsheets = useMemo(() => {
    if (readCsvState.fetchingSuccess && readCsvState.data.length > 0) {
      const res = readCsvState.data.map((csv) => {
        if (Object.keys(csv)[0].includes("Template")) {
          return (
            <div style={{ paddingTop: "2rem" }}>
              <Spreadsheet
                name={cleanupNames(Object.keys(csv)[0])}
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
          return (
            <div style={{ paddingTop: "2rem" }}>
              <EditableTextarea
                name={cleanupNames(Object.keys(csv)[0])}
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

  const viewInsights = useCallback((e) => {
    e.preventDefault();
    navigate("/dashboard");
  }, []);

  const syncWarningText = useMemo(() => {
    return `${outOfSyncChangesState} change${
      outOfSyncChangesState === 1 ? "" : "s"
    } not in sync with Salesforce. Press "Sync Data" to sync Twilio Sync with Salesforce.`;
  }, [outOfSyncChangesState]);

  const btnCss = useMemo(() => {
    return {
      minWidth: 150,
    };
  });

  const content = useMemo(() => {
    return listCsvState.fetching ||
      readCsvState.fetching ||
      blockedContentState.fetching ||
      resetAndSeedState.fetching ||
      syncSalesforceState.fetching ? (
      <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
        <Circles color="#9b4dca" height={80} width={80} />
      </div>
    ) : readCsvState.fetchingSuccess && readCsvState.data.length > 0 ? (
      <div>
        <div>{spreadsheets}</div>
        <div>{editableTextareas}</div>
        <div>
          <Supervisory />
        </div>
      </div>
    ) : (
      <span style={{ color: "orange" }}>
        No Salesforce data detected. Select Seed Data to populate Salesforce.
      </span>
    );
  }, [
    spreadsheets,
    editableTextareas,
    listCsvState.fetching,
    readCsvState.fetchingSuccess,
    readCsvState.fetching,
    readCsvState.data,
    blockedContentState.fetching,
    resetAndSeedState.fetching,
    syncSalesforceState.fetching,
  ]);

  return (
    <>
      <form>
        <button
          id="btn-seed"
          className="button"
          onClick={resetAndSeed}
          style={{ ...btnCss }}
        >
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
        <button
          id="btn-sync"
          className="button"
          onClick={syncSalesforce}
          style={{ ...btnCss }}
        >
          Sync Data
        </button>
        <div style={{ display: "inline-block", paddingLeft: 32 }}>
          <LoadingText
            description="Sync Twilio Sync with Salesforce"
            fetchSelector={syncSalesforceState}
            name={"Sync Data with Salesforce"}
          />
        </div>
        <br />
        {outOfSyncChangesState > 0 && (
          <div>
            <span style={{ color: "red" }}>{syncWarningText}</span>
            <br />
          </div>
        )}
        <button
          id="btn-sync"
          className="button"
          onClick={viewInsights}
          style={{ ...btnCss }}
        >
          Insights
        </button>
        <div style={{ display: "inline-block", paddingLeft: 32 }}>
          <span>View insights dashboard.</span>
        </div>
        <br />
      </form>
      {content}
    </>
  );
};

export default Content;
