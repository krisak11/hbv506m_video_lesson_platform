module.exports = {
    canCreate(user, course) {
        // TODO
    },
    
    canView(user, course, lesson, enrollment) {
        if (!user) return false
        if (!user.is_active) return false
        if (user.role === 'admin') return true 
        if (user.role === 'instructor' && course.created_by_user_id === user.id) return true
        if (!course.is_published) return false
        if (!lesson.is_published) return false;
        return (user.role === 'student' || user.role === 'instructor') && enrollment?.status === 'active'
    },

    canEdit(user, course, lesson) {
        // TODO
    },

    canDelete(user, course, lesson) {
        // TODO
    },

    canViewProgress(user, progressRecord) {
        // TODO
    },

    canUpdateProgress(user, progressRecord) {
        // TODO
    },
}