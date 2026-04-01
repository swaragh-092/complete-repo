// Author: Gururaj
// Created: 29th May 2025
// Description: Express-validator result middleware that aborts the request pipeline with a 422 on validation failure.
// Version: 1.0.0
// Modified:

const {validationResult} = require('express-validator');
const Response = require('../services/Response');

const validateRequest = (ENTITY, ACTION) => {
    return (req, res, next) => {
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        return Response.apiResponse({
          res,
          success: false,
          status: 422,
          usedFor: ENTITY,
          action: ACTION,
          errors: errors.array(),
        });
      }
  
      next();
    };
  };


module.exports =  validateRequest;