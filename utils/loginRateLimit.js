const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000, // rate limit lasts for 15 min
  max: 10, // max 10 login attempts per IP before rate limit hits
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again later.",
});