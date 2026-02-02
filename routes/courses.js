// Routes for managing courses

var express = require('express');
var router = express.Router();

const coursesRepo = require('../db/coursesRepo');
const lessonsRepo = require('../db/lessonsRepo');
const auditLogsRepo = require('../db/auditLogsRepo');
const { safeAuditLog } = require('../utils/auditLogger');

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

// GET /courses/:id/edit - show edit form
// Must be before /:id route! 
router.get('/:id/edit', function (req, res, next) {
  try {
    res.locals.pageCss = '/stylesheets/pages/courses.css';

    const id = parseInt(req.params.id, 10);
    const course = coursesRepo.getCourseById(id);

    if (!course) {
      return res.status(404).send('Course not found');
    }

    res.render('courses/edit', {
      course,
      form: {
        title: course.title || '',
        description: course.description || '',
      },
      error: null,
    });
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

    // Create nwe course with newID for logging purposes.
    const newId = coursesRepo.createCourse({ title, description });

    // Log audit event (non-blocking)
    safeAuditLog(req,{
        event_type: 'course_created',
        severity: 'info',
        actor_user_id: req.user?.id ?? null, // no auth yet
        message: `Course created: ${title}`,
        metadata: { course_id: newId }
    });

    res.redirect('/courses');

  } catch (err) {
    next(err);
  }
});


// POST /courses/:id - update course
router.post('/:id', function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = coursesRepo.getCourseById(id);

    if (!existing) {
      return res.status(404).send('Course not found');
    }

    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim();

    if (!title || !description) {
      res.locals.pageCss = '/stylesheets/pages/courses.css';
      return res.status(400).render('courses/edit', {
        course: existing,
        form: { title, description },
        error: 'Title and description are required.',
      });
    }

    coursesRepo.updateCourse(id, { title, description });
    
    // Log audit event (non-blocking)
    safeAuditLog(req, { 
        event_type: 'course_updated',
        severity: 'info',
        actor_user_id: req.user?.id ?? null,
        message: `Course updated: ${title}`,
        metadata: { course_id: id }
    });
    
    res.redirect(`/courses/${id}`);
  } catch (err) {
    next(err);
  }
});

// POST /courses/:id/delete - delete course
router.post('/:id/delete', function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const course = coursesRepo.getCourseById(id);

    if (!course) {
      return res.status(404).send('Course not found');
    }

    const title = course.title;

    coursesRepo.deleteCourse(id);

    // Log audit event (non-blocking)
    safeAuditLog(req, {
        event_type: 'course_deleted',
        severity: 'warn',
        actor_user_id: req.user?.id ?? null,
        message: `Course deleted: ${title}`,
        metadata: { course_id: id }
    });

    res.redirect('/courses');

  } catch (err) {
    next(err);
  }
});

module.exports = router;
