const bcrypt = require('bcrypt');
const saltRounds = 10; // Default value

const usersRepo = require('../db/usersRepo');

module.exports = {

    async register({ email, password, display_name }) {
        const exists = usersRepo.getUserByEmail(email)
        if (exists) {
            throw new Error("Email already registered")
        }

        password_hash = await bcrypt.hash(password, saltRounds)

        const user = usersRepo.createUser({ email, password_hash, display_name })

        return { 
            id: user.id, 
            display_name: user.display_name,
            role: user.role 
        }
    },

    async login({ email, password }) {
        const user = usersRepo.getUserByEmail(email)

        if (!user) throw new Error("Invalid Credentials")

        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) throw new Error ("Invalid Crednetials")

        return { 
            id: user.id, 
            display_name: user.display_name,
            role: user.role 
        }
    }
}