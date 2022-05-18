/** Parses accounts from CSV and then adds an attributes field per Composite Api */
exports.parseAccountsForCompositeApi = function (csvData) {
  return csvData.map((r) => {
    return {
      attributes: {
        type: "Account",
      },
      Name: r.AccountName,
      Phone: r.Phone,
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
      HomePhone: record.HomePhone,
      MobilePhone: record.Mobile,
      LeadSource: record.LeadSource, //picklist
      Phone: record.Phone,
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
