const validationMiddleware = require('~/middlewares/idValidationMiddleware')
const { BODY_IS_NOT_DEFINED } = require('~/consts/errors')
const { validateRequired, validateFunc } = require('~/utils/validationHelper')

jest.mock('~/utils/validationHelper', () => ({
  validateRequired: jest.fn(),
  validateFunc: {
    isString: jest.fn(),
    minLength: jest.fn(),
    maxLength: jest.fn()
  }
}))

jest.mock('~/utils/errorsHelper', () => ({
  createError: jest.fn((status, msg) => ({ status, msg }))
}))

describe('validationMiddleware', () => {
  let req, res, next, schema

  beforeEach(() => {
    res = {}
    next = jest.fn()
    req = {}
    jest.clearAllMocks()

    schema = {
      id: {
        required: true,
        isString: true,
        minLength: 5,
        maxLength: 10
      }
    }
  })

  it('should throw BODY_IS_NOT_DEFINED if body is missing', () => {
    req.body = undefined

    expect(() => validationMiddleware(schema)(req, res, next)).toThrow({
      status: 422,
      msg: BODY_IS_NOT_DEFINED
    })

    expect(next).not.toHaveBeenCalled()
  })

  it('should call validateRequired and validateFunc for schema fields', () => {
    req.body = { id: 'abcde' }

    validationMiddleware(schema)(req, res, next)

    expect(validateRequired).toHaveBeenCalledWith('id', true, 'abcde')

    expect(validateFunc.isString).toHaveBeenCalledWith('id', true, 'abcde')
    expect(validateFunc.minLength).toHaveBeenCalledWith('id', 5, 'abcde')
    expect(validateFunc.maxLength).toHaveBeenCalledWith('id', 10, 'abcde')

    expect(next).toHaveBeenCalled()
  })

  it('should skip validateFunc calls if field not present in body', () => {
    req.body = {}

    validationMiddleware(schema)(req, res, next)

    expect(validateRequired).toHaveBeenCalledWith('id', true, undefined)
    expect(validateFunc.isString).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
