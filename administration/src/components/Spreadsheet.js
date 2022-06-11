import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  mfaState as mfaStateSelector,
  readCsvState as readCsvStateSelector,
  writeCsvState as writeCsvStateSelector
} from "../redux/selectors";
import "./Spreadsheet.css";
import { writeCsv } from "../redux/actions";

/**
 *
 * @param {*} A spreadsheet for editing csvs. You can optionally pass in a selector to display loading status text.
 * @returns
 */
const Spreadsheet = ({ data, name }) => {
  const dispatch = useDispatch();
  const readCsvState = useSelector(readCsvStateSelector);
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [activeCell, setActiveCell] = useState({});
  const [previousCell, setPreviousCell] = useState({});
  const disclaimerText = "Press Escape to commit changes to Sync."

  const createHeaders = useCallback(
    (data) => {
      return (
        <thead key={`${name}-head`}>
          <tr>
            {Object.keys(data[0]).map((header, index) => (
              <th key={`${name}-header${index}`}>{header}</th>
            ))}
          </tr>
        </thead>
      );
    },
    [readCsvState.data]
  );

  /*   useEffect(() => {
    console.log(activeCell, previousCell);
  }, [activeCell, previousCell]); */

  /** Takes the updated spreadsheet and parses it into a format the CSV reader on the server can understand. */
  const updateData = (tableName) => {
    const headers = document
      .getElementsByName(tableName)[0]
      .getElementsByTagName("thead")[0]
      .getElementsByTagName("tr")[0]
      .getElementsByTagName("th");
    const headerArr = Array.prototype.slice.call(headers);

    const values = document
      .getElementsByName(tableName)[0]
      .getElementsByTagName("tbody")[0]
      .getElementsByTagName("tr"); 

    const valuesRows = Array.prototype.slice.call(values);

    //Outer reduces to rows to an array
    return valuesRows.reduce((arr, curr) => {
      const fieldsCollection = curr.getElementsByTagName("td");
      const fieldsCollectionArr = Array.prototype.slice.call(fieldsCollection);
      //inner reduces row to an object
      const obj = fieldsCollectionArr.reduce((innerObj, innerCurr, dataRow) => {
        innerObj[headerArr[dataRow].textContent] = innerCurr.textContent;
        return innerObj;
      }, {});

      return arr.concat(obj);
    }, []);
  };

  /**
   * Handles what happens when a cell is clicked into.
   * When clicked, the cell is converted into a text input. A method is bound to the window so that when "enter" is pressed, the table is updated 
   * and the cell turns back to text.
   */
  useEffect(() => {
    if (activeCell.id) {
      const { id, table, text } = activeCell;
      const inputId = "textarea".concat(id);
      document.getElementById(
        id
      ).innerHTML = `<textarea id='${inputId}' rows='4'>${text}</textarea>`;

      if (previousCell.id) {
        document.getElementById(
          previousCell.id
        ).innerHTML = `${previousCell.text}`;
      }

      //Controls what happens when enter key is pressed
      function onEnterUp(e) {
        if (e.code === "Escape") {
          const inputElement = document.getElementById(inputId);
          const newText = inputElement.value
          const cell = document.getElementById(id);
          cell.innerHTML = `${newText}`;
          setActiveCell((cell) => {
            setPreviousCell({id: cell.id, table: cell.table, text: newText});
            return {};
          });
          const data = updateData(table);
          dispatch(writeCsv({tableName: table, tableData: data}))
          setShowDisclaimer(false)
        }
      }

      window.addEventListener("keyup", onEnterUp);
      return () => window.removeEventListener("keyup", onEnterUp);
    }
  }, [activeCell]);

  const createRows = useCallback((rowIndex, data) => {
    const onCellClick = (e) => {
      if (e.target.nodeName === "TD") {
        const cellElement = document.getElementById(e.target.id);
        setActiveCell((cell) => {
          setPreviousCell(cell);
          return {
            id: e.target.id,
            text: e.target.innerText,
            table: cellElement.closest("table").getAttribute("name"),
          };
        });
        setShowDisclaimer(true)
      }
    };

    const values = Object.values(data[rowIndex]);
    return (
      <tr key={`${name}-row${rowIndex}`}>
        {values.map((value, colIndex) => (
          <td
            key={`${name}-rowItem${colIndex}${rowIndex}`}
            id={`${name}-rowItem${colIndex}${rowIndex}`}
            onClick={onCellClick}
          >
            {value}
          </td>
        ))}
      </tr>
    );
  }, []);

  const createCols = useCallback(
    (data) => {
      return (
        <tbody key={`${name}-body`}>
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
          {showDisclaimer ? <span style={{color:"red"}}>{disclaimerText}</span> : <></>}
          <div style={{ height: 300, overflow: "scroll" }}>
            <table name={name}>{spreadSheet}</table>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default Spreadsheet;
