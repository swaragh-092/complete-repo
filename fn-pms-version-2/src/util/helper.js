export function formatValidationErrors(responseData) {
  if (Array.isArray(responseData?.errors)) {
    const formattedErrors = {};
    responseData.errors.forEach((err) => {
      formattedErrors[err.path] = err.msg;
    });
    return formattedErrors;
  }
  return {};
}

export function errorMessageFormat(error, version) {
    return error ? (version % 2 === 0 ? error + " " : error) : undefined;
}


export const formatTextForDataTable = (value) => {
  if (!value) return "";
  return value
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};


 export const convertMinutes = (mins) => {
    if (!mins && mins !== 0) return "";
    const h = Math.floor(mins / 60)
      .toString()
      .padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");

    return `${h}:${m} ${h>1 ? "hrs" : "hr"}`;
  };

