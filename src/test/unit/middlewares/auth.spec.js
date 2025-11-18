require('~/initialization/envSetup')

jest.mock('~/services/token')
jest.mock('~/services/user', () => ({
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  privateUpdateUser: jest.fn(),
  createUserFromGoogle: jest.fn(),
  getUserById: jest.fn()
}))
jest.mock('~/services/email')
jest.mock('~/utils/errorsHelper')

const { authMiddleware } = require('~/middlewares/auth')
const { createUnauthorizedError } = require('~/utils/errorsHelper')
const tokenService = require('~/services/token')
const authService = require('~/services/auth')
const { getUserByEmail, privateUpdateUser } = require('~/services/user')
const mailService = require('~/services/email')
const { createError } = require('~/utils/errorsHelper')

describe('Auth middleware', () => {
  const error = createUnauthorizedError()
  const mockResponse = {}
  const mockNextFunc = jest.fn()

  it('Should throw UNAUTHORIZED error when access token is not given', () => {
    const mockRequest = { cookies: { accessToken: 'invalid_token' } }

    const middlewareFunc = () => authMiddleware(mockRequest, mockResponse, mockNextFunc)

    expect(middlewareFunc).toThrow(error)
  })

  it('Should throw UNAUTHORIZED error when access token is invalid', () => {
    const mockRequest = { cookies: { accessToken: 'token' } }

    const middlewareFunc = () => authMiddleware(mockRequest, mockResponse, mockNextFunc)

    expect(middlewareFunc).toThrow(error)
  })

  it('Should save userData from accessToken to a request object', () => {
    const payload = { userId: 'testId' }
    tokenService.validateAccessToken = jest.fn().mockReturnValue(payload)

    const mockRequest = { cookies: { accessToken: 'mock_access_token' } }
    const mockResponse = {}
    const mockNextFunc = jest.fn()

    authMiddleware(mockRequest, mockResponse, mockNextFunc)

    expect(mockRequest.user).toEqual(expect.objectContaining(payload))
    expect(mockNextFunc).toHaveBeenCalled()
  })
})

describe('AuthService — Google login', () => {
  const email = 'googleuser@test.com'

  beforeEach(() => {
    jest.resetAllMocks()

    createError.mockImplementation((status, errorObj) => {
      const err = new Error(errorObj.message || 'error')
      err.code = errorObj.code || status
      err.status = status
      return err
    })
  })

  it('Should allow login via Google for existing user and return tokens', async () => {
    const email = 'googleuser@test.com'
    const user = {
      _id: 'googleUserId',
      email,
      password: 'hashedPassword',
      lastLoginAs: 'user',
      isFirstLogin: true,
      isEmailConfirmed: true
    }

    getUserByEmail.mockResolvedValue(user)
    privateUpdateUser.mockResolvedValue({ ...user, isFirstLogin: false })

    tokenService.generateTokens.mockReturnValue({
      accessToken: 'access_token_mock',
      refreshToken: 'refresh_token_mock'
    })
    tokenService.saveToken.mockResolvedValue(true)

    const tokens = await authService.login(email, 'any_password_ignored_for_google', true)

    expect(getUserByEmail).toHaveBeenCalledWith(email)
    expect(privateUpdateUser).toHaveBeenCalledWith(user._id, { isFirstLogin: false })
    expect(tokenService.generateTokens).toHaveBeenCalledWith({
      id: user._id,
      role: user.lastLoginAs,
      lastLoginAs: 'user',
      isFirstLogin: true
    })
    expect(tokenService.saveToken).toHaveBeenCalledWith(user._id, 'refresh_token_mock', 'refreshToken')
    expect(tokens).toEqual({
      accessToken: 'access_token_mock',
      refreshToken: 'refresh_token_mock'
    })
  })

  it('Should throw USER_NOT_FOUND if Google user is not found', async () => {
    getUserByEmail.mockResolvedValue(null)

    createError.mockImplementation((code, message) => {
      const err = new Error(message || 'error')
      err.code = message
      return err
    })

    await authService.login(email, 'anyPassword', true).catch((err) => {
      expect(err.code.code).toBe('USER_NOT_FOUND')
    })
  })
})
