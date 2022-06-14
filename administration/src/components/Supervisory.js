import { useMemo } from "react";
import { useSelector } from "react-redux";
import { blockedContentState as blockedContentSelector } from "../redux/selectors";

const Supervisory = () => {
  const { fetchingSuccess, blockedContent } = useSelector(
    blockedContentSelector
  );

  const header = useMemo(() => {
    return (
      <thead>
        <tr>
          <th>Message</th>
          <th>Customer</th>
          <th>Agent</th>
        </tr>
      </thead>
    );
  });

  const body = useMemo(() => {
    if (fetchingSuccess && blockedContent.length > 0) {
      const data = blockedContent.map((msg, index) => {
        return (
          <tr key={`tr${index}blockedmessages`}>
            <td key={`td${index}blockedmessage`}>{msg.blockedMessage}</td>
            <td key={`td${index}customernumber`}>{msg.customerNumber}</td>
            <td key={`td${index}agent`}>{msg.agent}</td>
          </tr>
        );
      });
      return <tbody>{data}</tbody>;
    }
  }, [fetchingSuccess]);

  return (
    <>
      <h3>Blocked Content Management</h3>
      <table>
        {header}
        {body}
      </table>
    </>
  );
};

export default Supervisory;
