// Author: Gururaj
// Description: Generic Reporting Helper
// Version: 1.0.0

const { Op } = require("sequelize");

async function reportHelperFunction({
  model,
  whereFilters = {},
  aggregate = [],
  groupBy = [],
  extrasInQuery = {},
  orderQuery = {},
  query = {},
  raw = true,
}) {
  const { page, limit, ...dynamicFilters } = query;

  const where = { ...whereFilters };

  // 🔹 Apply dynamic filters from query
  Object.keys(dynamicFilters).forEach((key) => {
    if (
      dynamicFilters[key] !== undefined &&
      dynamicFilters[key] !== "" &&
      !["group_by", "aggregate", "page", "limit"].includes(key)
    ) {
      where[key] = dynamicFilters[key];
    }
  });

  const attributes = [];

  // 🔹 Aggregate functions
  aggregate.forEach((item) => {
    if (item.literal) {
      attributes.push([
        model.sequelize.literal(item.literal),
        item.alias,
      ]);
    } else {
      attributes.push([
        model.sequelize.fn(item.fn, model.sequelize.col(item.field)),
        item.alias,
      ]);
    }
  });

  // 🔹 Add group fields into attributes
  groupBy.forEach((field) => {
    attributes.push(field);
  });

  const options = {
    where,
    attributes: attributes.length ? attributes : undefined,
    group: groupBy.length ? groupBy : undefined,
    raw,
    ...extrasInQuery,
    ...orderQuery,
  };

  // 🔹 Pagination only if no grouping
  if (!groupBy.length && page && limit) {
    options.limit = parseInt(limit);
    options.offset = (parseInt(page) - 1) * parseInt(limit);
  }

  return await model.findAll(options);
}

module.exports = reportHelperFunction;