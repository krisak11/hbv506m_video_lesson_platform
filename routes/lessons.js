var express = require('express');
var router = express.Router();

const lessonsRepo = require('../db/lessonsRepo');
const coursesRepo = require('../db/coursesRepo');

// GET /lessons?course_id=1 - list lessons for a course
router.get('/', function (req, res, next) {
  try {
    res.locals.pageCss = '/stylesheets/pages/courses.css';

    const courseId = parseInt(req.query.course_id, 10);
    if (!courseId) {
      return res.status(400).send('Missing required query param: course_id');
    }

    const course = coursesRepo.getCourseById(courseId);
    if (!course) {
      return res.status(404).send('Course not found');
    }

    const lessons = lessonsRepo.getLessonsByCourseId(courseId, { includeUnpublished: true });

    res.render('lessons/index', { course, lessons });
  } catch (err) {
    next(err);
  }
});

// GET /lessons/:id - show lesson detail
router.get('/:id', function (req, res, next) {
  try {
    res.locals.pageCss = '/stylesheets/pages/courses.css';

    const id = parseInt(req.params.id, 10);
    const lesson = lessonsRepo.getLessonById(id);
    if (!lesson) return res.status(404).send('Lesson not found');

    const course = coursesRepo.getCourseById(lesson.course_id);

    res.render('lessons/show', { lesson, course });
  } catch (err) {
    next(err);
  }
});


// GET /lessons/new?course_id=1 - show create lesson form
router.get('/new', function (req, res, next) {
  try {
    res.locals.pageCss = '/stylesheets/pages/courses.css';

    const courseId = parseInt(req.query.course_id, 10);
    if (!courseId) {
      return res.status(400).send('Missing required query param: course_id');
    }

    const course = coursesRepo.getCourseById(courseId);
    if (!course) {
      return res.status(404).send('Course not found');
    }

    res.render('lessons/new', {
      course,
      form: {
        title: '',
        description: '',
        video_url: '',
        position: 0,
        is_published: 0,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /lessons - create lesson
router.post('/', function (req, res, next) {
  try {
    const courseId = parseInt(req.body.course_id, 10);
    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim() || null;
    const video_url = (req.body.video_url || '').trim() || null;
    const position = parseInt(req.body.position, 10);
    const is_published = req.body.is_published === '1' ? 1 : 0;

    if (!courseId || !title) {
      res.locals.pageCss = '/stylesheets/pages/courses.css';
      const course = courseId ? coursesRepo.getCourseById(courseId) : null;

      return res.status(400).render('lessons/new', {
        course,
        form: {
          title,
          description: description || '',
          video_url: video_url || '',
          position: Number.isFinite(position) ? position : 0,
          is_published,
        },
        error: 'Course and title are required.',
      });
    }

    lessonsRepo.createLesson({
      course_id: courseId,
      title,
      description,
      video_url,
      position: Number.isFinite(position) ? position : 0,
      is_published,
    });

    res.redirect(`/lessons?course_id=${courseId}`);
  } catch (err) {
    next(err);
  }
});

// GET /lessons/:id/edit - show edit form
router.get('/:id/edit', function (req, res, next) {
  try {
    res.locals.pageCss = '/stylesheets/pages/courses.css';

    const id = parseInt(req.params.id, 10);
    const lesson = lessonsRepo.getLessonById(id);
    if (!lesson) {
      return res.status(404).send('Lesson not found');
    }

    const course = coursesRepo.getCourseById(lesson.course_id);

    res.render('lessons/edit', {
      course,
      lesson,
      form: {
        title: lesson.title || '',
        description: lesson.description || '',
        video_url: lesson.video_url || '',
        position: lesson.position ?? 0,
        is_published: lesson.is_published ?? 0,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /lessons/:id - update lesson
router.post('/:id', function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const lesson = lessonsRepo.getLessonById(id);
    if (!lesson) {
      return res.status(404).send('Lesson not found');
    }

    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim() || null;
    const video_url = (req.body.video_url || '').trim() || null;
    const position = parseInt(req.body.position, 10);
    const is_published = req.body.is_published === '1' ? 1 : 0;

    if (!title) {
      res.locals.pageCss = '/stylesheets/pages/courses.css';
      const course = coursesRepo.getCourseById(lesson.course_id);

      return res.status(400).render('lessons/edit', {
        course,
        lesson,
        form: {
          title,
          description: description || '',
          video_url: video_url || '',
          position: Number.isFinite(position) ? position : (lesson.position ?? 0),
          is_published,
        },
        error: 'Title is required.',
      });
    }

    lessonsRepo.updateLesson(id, {
      title,
      description,
      video_url,
      position: Number.isFinite(position) ? position : (lesson.position ?? 0),
      is_published,
    });

    res.redirect(`/lessons?course_id=${lesson.course_id}`);
  } catch (err) {
    next(err);
  }
});

// POST /lessons/:id/delete - delete lesson
router.post('/:id/delete', function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const lesson = lessonsRepo.getLessonById(id);
    if (!lesson) {
      return res.status(404).send('Lesson not found');
    }

    lessonsRepo.deleteLesson(id);
    res.redirect(`/lessons?course_id=${lesson.course_id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
