const router = require('express').Router({ mergeParams: true })

const idValidation = require('~/middlewares/idValidation')

const Category = require('~/models/category')
const asyncWrapper = require('~/middlewares/asyncWrapper')
const { authMiddleware } = require('~/middlewares/auth')
const isEntityValid = require('~/middlewares/entityValidation')

const categoryController = require('~/controllers/category')

const params = [{ model: Category, idName: 'id' }]

router.use(authMiddleware)
router.param('id', idValidation)

router.get('/', asyncWrapper(categoryController.getCategories))
router.get('/names', asyncWrapper(categoryController.getCategoryNames))
router.get('/:id', isEntityValid({ params }), asyncWrapper(categoryController.getCategoryById))

module.exports = router
