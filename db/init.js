const fs = require('fs'); // File system module
const path = require('path'); // For handling file paths
const db = require('./index'); // Import the database connection

// Read the schema.sql file

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log("Using DB at:", path.join(__dirname, "..", "data", "app.db")); // Dev log

db.exec(schema); // Execute the SQL commands to set up the database schema

console.log('Database initialized using schema.sql');
