// Author: Gururaj
// Created: 16th May 2025
// Description: Util function for pagination
// Version: 1.0.0
// Modified:

const { Op } = require("sequelize");
const { namespace } = require("../config/cls");

// module.exports = async function paginate(
//   modelQuery,  // send model query as a function with 2 input values offse and limit
//   page = 1,
//   perPage = 10,
//   sortField = null,
//   sortOrder = 'asc'
// ) {
//     const currentPage = parseInt(page) || 1;
//     const limit = parseInt(perPage);
//     const offset = (currentPage - 1) * limit;

//     const { count: totalItems, rows: data } = await modelQuery({
//       offset,
//       limit
//     });

//     const totalPages = Math.ceil(totalItems / limit);

//     return {
//       data,
//       pagination: {
//         totalItems,
//         perPage: limit,
//         currentPage,
//         totalPages,
//         hasNextPage: currentPage < totalPages,
//         hasPrevPage: currentPage > 1,
//       }
//     };
//   };

module.exports = async function paginate(
  modelQuery, // send model query as a function with 4 input values offset, limit sortField and sortOrder
  page = 1,
  perPage = 10,
  sortField = "created_at",
  sortOrder = "asc",
  searchText = "",
  searchField = "",
  searchOperator = "",
  model,
) {
  const currentPage = parseInt(page) || 1;
  const limit = parseInt(perPage);
  const offset = (currentPage - 1) * limit;

  const where = {};
  
  const modelAttributes = Object.keys(model.rawAttributes);
  if (
    // searchText &&
    // searchText !== "null" &&
    searchField &&
    searchField !== "null" &&
    modelAttributes.includes(searchField)
  ) {
    let operatorCondition = null;

    switch (searchOperator) {
      case "equals":
      case "is": // alias for equals
        operatorCondition = { [Op.eq]: searchText };
        break;

      case "doesNotEqual":
      case "isNot": // alias for not equals
        operatorCondition = { [Op.ne]: searchText };
        break;

      case "contains":
        operatorCondition = { [Op.like]: `%${searchText}%` };
        break;

      case "doesNotContain":
        operatorCondition = { [Op.notLike]: `%${searchText}%` };
        break;

      case "startsWith":
        operatorCondition = { [Op.like]: `${searchText}%` };
        break;

      case "endsWith":
        operatorCondition = { [Op.like]: `%${searchText}` };
        break;

      case "isEmpty":
        operatorCondition = { [Op.or]: [null, ""] };
        break;

      case "isNotEmpty":
        operatorCondition = { [Op.and]: { [Op.not]: null, [Op.ne]: "" } };
        break;

      case "isAnyOf":
        let values = [];
        if (Array.isArray(searchText)) {
          values = searchText;
        } else if (typeof searchText === "string") {
          // split by comma, trim spaces, and remove empty strings
          values = searchText
            .split(",")
            .map(v => v.trim())
            .filter(Boolean);
        } else {
          values = [searchText];
        }

        operatorCondition = {
          [Op.in]: values,
        };
        break;

      case "isNotAnyOf":
        {
          let values = [];
          if (Array.isArray(searchText)) {
            values = searchText;
          } else if (typeof searchText === "string") {
            values = searchText
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
          } else if (searchText !== null) {
            values = [searchText];
          }

          operatorCondition = {
            [Op.notIn]: values,
          };
        }
        break;

      default:
        // Default to contains
        operatorCondition = { [Op.like]: `%${searchText}%` };
        break;
    }
    where[searchField] = operatorCondition;
  }

  const possibleOrders = ["asc", "desc"];

  const { count: totalItems, rows: data } = await modelQuery({
    offset,
    limit,
    sortField:
      (sortField === "null" || sortField === "" || !modelAttributes.includes(sortField)) ? "created_at" : sortField,
    sortOrder: possibleOrders.includes(sortOrder) ? sortOrder : "desc",
    where : {...where, organization_id : namespace.get("organization_id")},
  });

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      totalItems,
      perPage: limit,
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
};
