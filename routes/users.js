const express = require('express');
const router = express.Router();
const { authorize } = require('../utils/authz/authorize');
const ABILITIES = require('../utils/authz/abilities');
const { loadUser } = require('../utils/authz/loaders');
const usersRepo = require('../db/usersRepo');
const { safeAuditLog, getChangedFields, userTarget } = require('../utils/auditLogger');

// GET profile (self or admin view)
router.get(
  '/:id', 
  loadUser('id'),
  authorize(ABILITIES.USER_VIEW),
  function (req, res, next) {
    try {
      const user = req.resource.user;

      res.render('users/profile', {
        user,
        adminView: req.user.role === 'admin', // optionally show admin controls
        csrfToken: req.csrfToken(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST update profile
router.post(
  '/:id',
  loadUser('id'),
  authorize(ABILITIES.USER_EDIT),
  function (req, res, next) {
    try {
      const user = req.resource.user;
      const { display_name, email } = req.body;

      // Only allow admins to change the role
      let role = user.role; 
      if (req.user.role === 'admin' && req.body.role) {
        const allowedRoles = ['student', 'admin', 'instructor'];
        if (allowedRoles.includes(req.body.role)) {
          role = req.body.role;
        }
      }

      // Update the user
      usersRepo.updateUser(user.id, { display_name, email, role });

      // Audit log
      safeAuditLog(req, {
        event_type: req.user.id === user.id ? 'user_update_profile' : 'admin_update_user',
        severity: 'info',
        actor_user_id: req.user.id,
        message: `User profile updated`,
        metadata: {
          ...userTarget(user),
          updatedFields: getChangedFields(req.body),
        },
      });

      res.redirect(`/users/${user.id}`);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/:id/deactivate', loadUser('id'), authorize(ABILITIES.USER_DEACTIVATE), (req, res, next) => {
  try {
    const userToDeactivate = req.resource.user;

    usersRepo.updateUser(userToDeactivate.id, { is_active: false });

    safeAuditLog(req, {
      event_type: 'admin_deactivate_user',
      severity: 'warn',
      actor_user_id: req.user.id,
      message: `User deactivated`,
      metadata: userTarget(userToDeactivate),
    });

    res.redirect(`/users/${userToDeactivate.id}`);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/activate', loadUser('id'), authorize(ABILITIES.USER_ACTIVATE), (req, res, next) => {
  try {
    const userToActivate = req.resource.user;

    usersRepo.updateUser(userToActivate.id, { is_active: true });

    safeAuditLog(req, {
      event_type: 'admin_activate_user',
      severity: 'warn',
      actor_user_id: req.user.id,
      message: `User activated`,
      metadata: userTarget(userToActivate),
    });

    res.redirect(`/users/${userToActivate.id}`);
  } catch (err) {
    next(err);
  }
});


module.exports = router;
