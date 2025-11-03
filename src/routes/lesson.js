const router = require('express').Router()

const lessonController = require('~/controllers/lesson')
const asyncWrapper = require('~/middlewares/asyncWrapper')
const { authMiddleware, restrictTo } = require('~/middlewares/auth')
const idValidation = require('~/middlewares/idValidation')
const isEntityValid = require('~/middlewares/entityValidation')
const Lesson = require('~/models/lesson')
const {
  roles: { TUTOR, ADMIN }
} = require('~/consts/auth')

router.get('/', asyncWrapper(lessonController.getLessons))
router.param('id', idValidation)
const params = [{ model: Lesson, idName: 'id' }]
router.get('/:id', isEntityValid({ params }), asyncWrapper(lessonController.getLessonById))
router.post('/', authMiddleware, restrictTo(TUTOR, ADMIN), asyncWrapper(lessonController.createLesson))
router.patch(
  '/:id',
  authMiddleware,
  restrictTo(TUTOR, ADMIN),
  isEntityValid({ params }),
  asyncWrapper(lessonController.updateLesson)
)
router.delete(
  '/:id',
  authMiddleware,
  restrictTo(TUTOR, ADMIN),
  isEntityValid({ params }),
  asyncWrapper(lessonController.deleteLesson)
)

module.exports = router
