const {
  parsePhoneNumber: parsePhoneNumberExternalLib,
} = require("awesome-phonenumber");

function parsePhoneNumber(number) {
  if (!!number) {
    const pn = parsePhoneNumberExternalLib(number, "US");
    return pn.getNumber();
  }
  return "";
}

async function runSOQL(connection, SOQL) {
  return new Promise((resolve, reject) => {
    connection.query(SOQL, function (err, result) {
      if (err) reject(err);
      resolve(result); //Check result.totalSize and result.records.length
    });
  });
}

module.exports = { parsePhoneNumber, runSOQL };
