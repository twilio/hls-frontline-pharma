import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  mfaState as mfaStateSelector,
  readCsvState as readCsvStateSelector,
  writeCsvState as writeCsvStateSelector,
} from "../redux/selectors";
import "./Spreadsheet.css";
import { writeCsv } from "../redux/actions";

/**
 *
 * @param {*} A spreadsheet for editing csvs. You can optionally pass in a selector to display loading status text.
 * @returns
 */
const EditableTextarea = ({ data, name }) => {
  const dispatch = useDispatch();
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const disclaimerText = "Press Escape to commit changes to Sync."
  const formattedData = useMemo(() => (data ? data.join(",\n") : ""), data);

  const cleanupEditedTextarea = useCallback((str) => {
    if (str) {
      return str.split(",\n");
    }
    return [];
  }, []);

  const onFocus = useCallback((e) => {
    //Controls what happens when enter key is pressed
    setShowDisclaimer(true)
    function onEnterUp(e) {
      if (e.code === "Escape") {
        const textarea = document.getElementById(name);
        const data = cleanupEditedTextarea(textarea.value)
        dispatch(writeCsv({ tableName: `${name}_List`, tableData: data }));
        textarea.blur()
        setShowDisclaimer(false)
      }
    }

    window.addEventListener("keyup", onEnterUp);
    return () => window.removeEventListener("keyup", onEnterUp);
  }, []);

  return (
    <>
      {data.length > 0 ? (
        <div>
          <h3>{name}</h3>
          {showDisclaimer ? <span style={{color:"red"}}>{disclaimerText}</span> : <></>}
          <textarea id={name} onFocus={onFocus} rows="10">
            {formattedData}
          </textarea>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default EditableTextarea;
