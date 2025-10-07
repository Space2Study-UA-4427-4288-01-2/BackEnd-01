const router = require('express').Router()

const asyncWrapper = require('~/middlewares/asyncWrapper')
const validationMiddleware = require('~/middlewares/validation')
const langMiddleware = require('~/middlewares/appLanguage')

const authController = require('~/controllers/auth')
const { RATE_LIMIT_EXCEEDED } = require('~/consts/errors')
const signupValidationSchema = require('~/validation/schemas/signup')
const { loginValidationSchema } = require('~/validation/schemas/login')
const resetPasswordValidationSchema = require('~/validation/schemas/resetPassword')
const forgotPasswordValidationSchema = require('~/validation/schemas/forgotPassword')
const rateLimit = require('express-rate-limit')

const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: RATE_LIMIT_EXCEEDED,
  standardHeaders: true,
  legacyHeaders: false
})

router.post(
  '/signup',
  validationMiddleware(signupValidationSchema),
  langMiddleware,
  asyncWrapper(authController.signup)
)
router.post('/login', validationMiddleware(loginValidationSchema), asyncWrapper(authController.login))
router.post('/google-auth', googleAuthLimiter, asyncWrapper(authController.googleAuth))
router.post('/logout', asyncWrapper(authController.logout))
router.get('/refresh', asyncWrapper(authController.refreshAccessToken))
router.post(
  '/forgot-password',
  validationMiddleware(forgotPasswordValidationSchema),
  langMiddleware,
  asyncWrapper(authController.sendResetPasswordEmail)
)
router.patch(
  '/reset-password/:token',
  validationMiddleware(resetPasswordValidationSchema),
  langMiddleware,
  asyncWrapper(authController.updatePassword)
)

module.exports = router
