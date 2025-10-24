const router = require('express').Router()
const subjectController = require('~/controllers/subject')
const asyncWrapper = require('~/middlewares/asyncWrapper')
const { authMiddleware, restrictTo } = require('~/middlewares/auth')
const idValidation = require('~/middlewares/idValidation')
const {
  roles: { ADMIN }
} = require('~/consts/auth')

router.param('id', idValidation)
router.get('/', asyncWrapper(subjectController.getSubjects))
router.get('/names', asyncWrapper(subjectController.getSubjectsNames))
router.get('/:id', asyncWrapper(subjectController.getSubjectById))
router.post('/', authMiddleware, restrictTo(ADMIN), asyncWrapper(subjectController.addSubject))
router.delete('/:id', authMiddleware, restrictTo(ADMIN), asyncWrapper(subjectController.deleteSubject))
router.patch('/:id', authMiddleware, restrictTo(ADMIN), asyncWrapper(subjectController.updateSubject))

module.exports = router
