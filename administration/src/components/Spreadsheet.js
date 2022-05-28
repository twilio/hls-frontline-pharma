import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePapaParse } from "react-papaparse";
import {
  mfaState as mfaStateSelector,
  readCsvState as readCsvStateSelector,
} from "../redux/selectors";
import { readCsv } from "../redux/actions";

const Spreadsheet = ({ data, name }) => {
  const { readString } = usePapaParse();
  const dispatch = useDispatch();
  const readCsvState = useSelector(readCsvStateSelector);

/*   useEffect(() => {
    if (
      !readCsvState.fetchingFailure &&
      !readCsvState.fetchingSuccess &&
      !readCsvState.fetching
    ) {
      dispatch(
        readCsv({ file: "/accounts_data.csv" })
      );
    }
  }); */

  const createHeaders = useCallback(
    (data) => {
      return (
        <thead key="head">
          <tr>
            {Object.keys(data[0]).map((header, index) => (
              <th key={`header${index}`}>{header}</th>
            ))}
          </tr>
        </thead>
      );
    },
    [readCsvState.data]
  );

  const createRows = useCallback((rowIndex, data) => {
    const values = Object.values(data[rowIndex]);
    return (
      <tr key={`row${rowIndex}`}>
        {values.map((value, colIndex) => (
          <td key={`rowItem$${value}${colIndex}${rowIndex}`}>{value}</td>
        ))}
      </tr>
    );
  }, []);

  const createCols = useCallback(
    (data) => {
      return (
        <tbody key="body">
          {data.map((row, index) => createRows(index, data))}
        </tbody>
      );
    },
    [data]
  );

  const spreadSheet = useMemo(() => {
    if (data.length > 0) {
      return [createHeaders(data), createCols(data)];
    }
  }, [data]);

  return (
    <>
      {data.length > 0 ? (
        <div>
          <h3>{name}</h3>
          <div style={{ height: 300, overflow: "scroll" }}>
            <table>{spreadSheet}</table>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default Spreadsheet;
