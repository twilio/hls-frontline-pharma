const { path: readCsvPath } = Runtime.getFunctions()["seeding/read-csv"];
const { path: accountsDataPath } =
  Runtime.getAssets()["/accounts_data.csv"].path;
const { path: contactsDataPath } =
  Runtime.getAssets()["/contacts_data.csv"].path;

exports.bulkUploadSObjects = async function (
  context,
  connection,
  records,
  allOrNone = true
) {
  const version = context.SF_VERSION ?? "v53.0";
  const endpoint = context.SFDC_INSTANCE_URL;

  const body = {
    allOrNone,
    records: records,
  };
  try {
    const res = await connection.requestPost(
      `${endpoint}/services/data/${version}/composite/sobjects`,
      body
    );
    return { error: false, result: res };
  } catch (err) {
    console.log(err);
    return { error: true, errorObject: err };
  }
};
