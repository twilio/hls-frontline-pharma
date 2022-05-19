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

module.exports = {parsePhoneNumber}
