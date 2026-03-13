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