// Routes for managing courses

var express = require('express');
var router = express.Router();

const coursesRepo = require('../db/coursesRepo');
const lessonsRepo = require('../db/lessonsRepo');


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

// GET /courses/:id - course detail page (with lessons). 
// Must be after /new route!
router.get('/:id', function (req, res, next) {
  try {
    res.locals.pageCss = '/stylesheets/pages/courses.css';

    const id = parseInt(req.params.id, 10);
    const course = coursesRepo.getCourseById(id);

    if (!course) {
      return res.status(404).send('Course not found');
    }

    const lessons = lessonsRepo.getLessonsByCourseId(id, { includeUnpublished: true });

    res.render('courses/show', { course, lessons });
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
