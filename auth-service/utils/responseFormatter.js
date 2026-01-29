// utils/responseFormatter.js
class ResponseFormatter {
  static success(res, data, message, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }
  
  static error(res, message, code, statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      error: { code, message },
      timestamp: new Date().toISOString()
    });
  }
}
