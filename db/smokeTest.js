// A simple smoke test to verify database operations.

const repo = require('./coursesRepo');

const id = repo.createCourse({
  title: 'Test Course',
  description: 'Created from smoke test',
});

console.log('Inserted course id:', id);
console.log('All courses:', repo.getAllCourses());

