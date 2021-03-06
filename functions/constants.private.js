const SYNC_LIST_NAME = "BlockedMessages";
const BLOCKED_WORDS = [
  "altering clinical trial data",
  "altering marketing materials",
  "altering medical records",
  "altering patient records",
  "altering research data",
  "altering sales data",
  "altering scientific data",
  "breach of patient confidentiality",
  "bribery",
  "destroying clinical trial data",
  "destroying marketing materials",
  "destroying medical records",
  "destroying patient records",
  "destroying research data",
  "destroying sales data",
  "destroying scientific data",
  "drug diversion",
  "embezzlement",
  "fabricating clinical trial data",
  "fabricating marketing materials",
  "fabricating medical records",
  "fabricating patient records",
  "fabricating research data",
  "fabricating sales data",
  "fabricating scientific data",
  "false and misleading claims",
  "falsifying clinical trial data",
  "falsifying marketing materials",
  "falsifying medical records",
  "falsifying patient records",
  "falsifying research data",
  "falsifying sales data",
  "falsifying scientific data",
  "fraud",
  "fraudulent marketing",
  "ghostwriting",
  "hiding clinical trial data",
  "hiding marketing materials",
  "hiding medical records",
  "hiding patient records",
  "hiding research data",
  "hiding sales data",
  "hiding scientific data",
  "illegal marketing",
  "illegal prescribing",
  "improper influence on prescribing decisions",
  "inappropriate prescribing",
  "kickbacks",
  "misleading marketing",
  "misuse of company funds",
  "over-prescribing",
  "polypharmacy",
  "price fixing",
  "tampering with clinical trial data",
  "tampering with marketing materials",
  "tampering with medical records",
  "tampering with patient records",
  "tampering with research data",
  "tampering with scientific data",
  "theft",
  "unauthorized prescribing",
  "unethical marketing practices",
  "unnecessary prescribing",
  "unsafe prescribing",
  "violation of company policy",
  "violation of FDA regulations",
  "violation of professional ethics",
  "violation of state laws",
];

const UNAPPROVED_WORDS = [
  "free goods",
  "sample sharing",
  "off-label use",
  "off-label prescribing",
];

const STOP_MESSAGING = "stop communication with sales rep"
const UNAPPROVED = "unapproved"
const BLOCKED = "blocked"

module.exports = {
  SYNC_LIST_NAME,
  BLOCKED_WORDS,
  UNAPPROVED_WORDS,
  STOP_MESSAGING,
  UNAPPROVED,
  BLOCKED
};
