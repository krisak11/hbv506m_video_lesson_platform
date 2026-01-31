// Routes for managing courses

var express = require('express');
var router = express.Router();

const coursesRepo = require('../db/coursesRepo');

// GET /courses - list courses
router.get('/', function (req, res, next) {
  try {
    res.locals.pageCss = '/stylesheets/pages/courses.css';
    const courses = coursesRepo.getAllCourses();
    res.render('courses/index', { courses });
  } catch (err) {
    next(err);
  }
});

// GET /courses/new - show create form
router.get('/new', function (req, res, next) {
  try {
    res.locals.pageCss = '/stylesheets/pages/courses.css';
    res.render('courses/new', { form: { title: '', description: '' }, error: null });
  } catch (err) {
    next(err);
  }
});

// POST /courses - create course
router.post('/', function (req, res, next) {
  try {
    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim();

    // Very basic validation for now
    if (!title || !description) {
      res.locals.pageCss = '/stylesheets/pages/courses.css';
      return res.status(400).render('courses/new', {
        form: { title, description },
        error: 'Title and description are required.',
      });
    }

    coursesRepo.createCourse({ title, description });
    res.redirect('/courses');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
