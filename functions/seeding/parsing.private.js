const col = require("lodash/collection");
const moment = require("moment");
const csv = require("csv-parser");
const fs = require("fs");
const seedingHelperPath = Runtime.getFunctions()["seeding/helpers"].path;
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
      MailingPostalCode: record.MailingPostalCode,
      MailingState: record.MailingState,
      FirstName: record.FirstName,
      Languages__c: record.Languages,
      LastName: record.LastName,
      Salutation: record.Salutation,
      Speciality__c: record.Speciality,
      Title: record.Title,
      Website__c: record.WebsiteLink, //needs to be added to custom fields
      Whatsapp__c: record.whatsapp //needs to be added to custom fields
    };
  });
};

/** Groups messages by Topic, then replaces "title" and "name" with relevant customer details.*/
exports.parseTemplates = function (csvData, customerDetails) {
  const grouped = col.groupBy(csvData, ({ Topic }) => Topic);
  return Object.keys(grouped).map((display_name) => {
    const templates = grouped[display_name].reduce((acc, val) => {
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

exports.parseChatHistory = function (csvData, contactsMap) {
  //csvData: conversation_sid,	message_index,	author,	body,	date_created

  const result = [];
  const groups = col.groupBy(csvData, (record) => record.conversation_sid);

  Object.values(groups).forEach((group) => {
    const orderedGroup = col.orderBy(group, ["message_index"], ["asc"]);

    const participant = orderedGroup.find(
      (item) => item.author.trim() !== "Sales Rep"
    );
    const id = contactsMap.find((contact) =>
      participant.author.includes(contact.name)
    ).sfId;

    if (id) {
      const description = orderedGroup.reduce(
        (prev, curr, index) =>
          [
            prev,
            `[${curr.author} @ ${curr.date_created}]\n${curr.body}`,
            index != group.length - 1 ? "\n\n" : "",
          ].join(""), //replace start/end quotations.
        ""
      );

      //If difference between start/end dates is more than 2 weeks, set start date to 14 days ago.
      const endDateTime = moment(
        orderedGroup[orderedGroup.length - 1].date_created
      );
      const startDateTime = moment(orderedGroup[0].date_created);
      const dateDiff = endDateTime.diff(startDateTime, "days");
      const fourteenDaysPrior = endDateTime
        .subtract(14, "days")
        .format("YYYY-MM-DD");

      result.push({
        attributes: {
          type: "Event",
        },
        Description: description,
        EndDateTime: orderedGroup[orderedGroup.length - 1].date_created,
        IsAllDayEvent: false,
        WhoId: id,
        StartDateTime:
          dateDiff > 14 ? fourteenDaysPrior : orderedGroup[0].date_created,
        Subject: "SMS",
        Type: "Other",
      });
    }
  }, "");

  return result;
};
