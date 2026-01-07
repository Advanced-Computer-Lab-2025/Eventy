export const errorMiddleware = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    status: `${statusCode}`.startsWith("4") ? "fail" : "error",
    message: message,
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
