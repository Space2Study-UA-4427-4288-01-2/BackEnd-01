const router = require('express').Router()
const subjectController = require('~/controllers/subject')
const asyncWrapper = require('~/middlewares/asyncWrapper')
const { authMiddleware, restrictTo } = require('~/middlewares/auth')
const {
  roles: { TUTOR, ADMIN }
} = require('~/consts/auth')

router.use(authMiddleware)
router.use(restrictTo(TUTOR, ADMIN))

router.get('/', asyncWrapper(subjectController.getSubjects))
router.get('/names', asyncWrapper(subjectController.getSubjectsNames))

module.exports = router
