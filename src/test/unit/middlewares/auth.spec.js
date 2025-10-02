require('~/initialization/envSetup')
const { authMiddleware } = require('~/middlewares/auth')
const { createUnauthorizedError } = require('~/utils/errorsHelper')
const tokenService = require('~/services/token')

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
    const { accessToken } = tokenService.generateTokens(payload)
    const mockRequest = { cookies: { accessToken } }

    authMiddleware(mockRequest, mockResponse, mockNextFunc)

    expect(mockRequest.user).toEqual(expect.objectContaining(payload))
  })
})

describe('AuthService Google login', () => {
  const email = 'googleuser@test.com'
  const user = {
    _id: 'googleUserId',
    email,
    password: 'hashedPassword',
    lastLoginAs: 'user',
    isFirstLogin: true,
    isEmailConfirmed: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Should allow login via Google (isFromGoogle = true)', async () => {
    authService.getUserByEmail = jest.fn().mockResolvedValue(user)
    authService.privateUpdateUser = jest.fn().mockResolvedValue(true)
    tokenService.generateTokens = jest.fn().mockReturnValue({
      accessToken: 'access_token_mock',
      refreshToken: 'refresh_token_mock'
    })
    tokenService.saveToken = jest.fn().mockResolvedValue(true)

    const tokens = await authService.login(email, 'wrong_password', true)

    expect(authService.getUserByEmail).toHaveBeenCalledWith(email)
    expect(tokens).toHaveProperty('accessToken', 'access_token_mock')
    expect(tokens).toHaveProperty('refreshToken', 'refresh_token_mock')
  })

  it('Should throw error if Google user is not found', async () => {
    authService.getUserByEmail = jest.fn().mockResolvedValue(null)

    await expect(authService.login(email, 'anyPassword', true)).rejects.toThrow('USER_NOT_FOUND')
  })
})
