const col = require("lodash/collection");
const csv = require("csv-parser");
const fs = require("fs");
const seedingHelperPath = Runtime.getFunctions()["seeding/helper"].path;
const { parsePhoneNumber } = require(seedingHelperPath);

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

/** Parses accounts from CSV and then adds an attributes field per Composite Api */
exports.parseAccountsForCompositeApi = function (csvData) {
  return csvData.map((r) => {
    return {
      attributes: {
        type: "Account",
      },
      Name: r.AccountName,
      Phone: parsePhoneNumber(r.Phone),
      Fax: r.Fax,
      AccountNumber: r.AccountNumber,
      Type: r.Type,
      Ownership: r.Ownership,
      Industry: r.Industry,
      NumberOfEmployees: r.Employees,
      BillingStreet: r.BillingStreet,
      BillingCity: r.BillingCity,
      BillingState: r.BillingState,
      BillingPostalCode: r.BillingPostalCode,
      BillingCountry: r.BillingCountry,
      ShippingStreet: r.ShippingStreet,
      ShippingCity: r.ShippingCity,
      ShippingPostalCode: r.ShippingPostalCode,
      ShippingCountry: r.ShippingCountry,
      CustomerPriority__c: r.CustomerPriority,
      NumberofLocations__c: r.NumberofLocations,
      UpsellOpportunity__c: r.UpsellOpportunity,
      Active__c: r.Active,
    };
  });
};
/** Parses contacts from CSV and then adds an attributes field per Composite Api */
exports.parseContactsForCompositeApi = function (csvData, accountMap) {
  return csvData.map((record) => {
    const account = accountMap.find((acc) => acc.name == record.AccountName);
    return {
      attributes: {
        type: "Contact",
      },
      AccountId: account?.sfId,
      Department: record.Department,
      Email: record.Email,
      HomePhone: parsePhoneNumber(record.HomePhone),
      MobilePhone: parsePhoneNumber(record.Mobile),
      LeadSource: record.LeadSource, //picklist
      Phone: parsePhoneNumber(record.Phone),
      MailingStreet: record.MailingStreet,
      MailingCity: record.MailingCity,
      MailingCountry: record.MailingCountry,
      //MailingPostalCode: record.MailingPostalCode,
      MailingState: record.MailingState,
      FirstName: record.FirstName,
      Languages__c: record.Languages,
      LastName: record.LastName,
      Salutation: record.Salutation,
      //Speciality
      Title: record.Title,
      //website
    };
  });
};

/** Groups messages by Topic, then replaces "title" and "name" with relevant customer details.*/
exports.parseTemplates = function (csvData, customerDetails) {
  console.log(customerDetails);
  const grouped = col.groupBy(csvData, ({ Topic }) => Topic);
  return Object.keys(grouped).map((display_name) => {
    const templates = grouped[display_name].reduce((acc, val) => {
      console.log(customerDetails);
      const name = [
        customerDetails.FirstName || "FirstName",
        customerDetails.LastName || "LastName",
      ].join(" ");
      const msg = val.Message.replace(
        "<title>",
        customerDetails.Title || "Title"
      ).replace("<name>", name);

      return acc.concat({ content: msg });
    }, []);
    return {
      display_name,
      templates,
    };
  });
};
