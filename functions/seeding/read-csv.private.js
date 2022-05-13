const csv = require("csv-parser");
const fs = require("fs");

/** Builds an arry that should be assigned to the records field in the SalesForce SObject Collections Create endpoint. */
exports.readCsv = async function (filePath) {
  const res = await new Promise((resolve, reject) => {
    const results = [];

    try {
      if (!fs.existsSync(filePath)) {
        reject("File does not exist.");
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("error", (err) => reject(err))
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results));
    } catch (err) {
      reject(err);
    }
  });
  return res;
};
