const db = require("./index");

function getUserByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
}

function getUserById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}

function createUser({ email, password_hash, display_name}) {
    const result = db.prepare(`
        INSERT INTO users (email, password_hash, display_name)
        VALUES (?, ?, ?)
    `).run(email, password_hash, display_name || null)
    
    return {
        id: result.lastID,
        display_name,
        role: 'user'
    };
}

function updatePassword(id, password_hash) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, id)
}

function deleteUser(id) {
  return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes;
}

module.exports = {
    getUserByEmail,
    getUserById,
    createUser,
    updatePassword,
    deleteUser,
}