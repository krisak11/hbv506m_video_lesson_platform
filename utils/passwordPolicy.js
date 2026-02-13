const zxcvbn = require("zxcvbn");

const MIN_LEN = 12;
const MIN_SCORE = 3;

// validates the password against the strength policy
function passwordPolicy(req, res, next) {
  const password = (req.body?.password ?? "").toString();
  const email = (req.body?.email ?? "").toString();

  const errors = [];

  if (!password.trim()) {
    errors.push("Password can't be empty.");
  }

  if (password.length < MIN_LEN) {
    errors.push(`Password needs to be at least ${MIN_LEN} characters long.`);
  }

  // using zxcvbn to evaluate pw strength, it gives the pw a score of 0-4. if score is less than 3, we ask for a stronger one
  const strength = zxcvbn(password, [email]);
  if (strength.score < MIN_SCORE) { 
    errors.push("Password is too weak. Please choose a stronger one."); 
  }

  if (errors.length) {
    req.passwordPolicyErrors = errors;
  }

  return next();
}

module.exports = passwordPolicy;