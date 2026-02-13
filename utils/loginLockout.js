// checks whether the account is locked out before allowing a login attempt
module.exports = function makeLoginLockout(db) {
    const getLock = db.prepare(
        "SELECT lock_until FROM users WHERE email = ?"
    );

    return function loginLockout(req, res, next) {
        const email = (req.body?.email ?? "").toString().trim().toLowerCase();
        if (!email) return next();

        const row = getLock.get(email);

        const lockUntil = row?.lock_until ? Number(row.lock_until) : null;

        if (lockUntil && lockUntil > Date.now()) {
            // authLocked flag for the login handler to check if true
            req.authLocked = true;
        }

        return next();
    };
};