const bcrypt = require('bcrypt');
const saltRounds = 10; // Default value

const usersRepo = require('../db/usersRepo');

module.exports = {

    async register({ email, password, display_name }) {
        const normalizedEmail = (email || "").trim().toLowerCase(); // Normalize email to prevent duplicates due to case or whitespace
        const exists = usersRepo.getUserByEmail(normalizedEmail) 
        if (exists) {
            throw new Error("Email already registered")
        }

        // Ensure const is used for password_hash to prevent accidental reassignment.
        const password_hash = await bcrypt.hash(password, saltRounds) 

        const user = usersRepo.createUser({ email: normalizedEmail, password_hash, display_name })

        return { 
            id: user.id, 
            display_name: user.display_name,
            role: user.role 
        }
    },

    async login({ email, password }) {
        const normalizedEmail = (email || "").trim().toLowerCase(); // Normalize email to prevent duplicates due to case or whitespace
        const user = usersRepo.getUserByEmail(normalizedEmail)

        if (!user) throw new Error("Invalid credentials")

        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) throw new Error ("Invalid credentials")

        return { 
            id: user.id, 
            display_name: user.display_name,
            role: user.role 
        }
    }
}