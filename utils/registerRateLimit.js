const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 60 * 60 * 1000, // rate limit lasts for 1 hour
  max: 5, // max 5 registrations per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many attempts. Please try again later.",
});