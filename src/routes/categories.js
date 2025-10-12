const router = require('express').Router({ mergeParams: true })

const asyncWrapper = require('~/middlewares/asyncWrapper')
const { authMiddleware } = require('~/middlewares/auth')

const categoryController = require('~/controllers/category')

router.use(authMiddleware)

router.get('/names', asyncWrapper(categoryController.getCategoryNames))

module.exports = router
