const mongoose = require('mongoose')
const { INVALID_ID } = require('~/consts/errors')
const { createError } = require('~/utils/errorsHelper')

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn()
    }
  }
}))

jest.mock('~/utils/errorsHelper', () => ({
  createError: jest.fn((status, msg) => {
    const error = new Error(msg)
    error.status = status
    return error
  })
}))

const idValidation = require('~/middlewares/idValidation')

describe('idValidation', () => {
  let req, res, next

  beforeEach(() => {
    res = {}
    next = jest.fn()
    req = {}
    jest.clearAllMocks()
  })

  it('should call next() for valid ObjectId', () => {
    const validId = '507f1f77bcf86cd799439011'

    mongoose.Types.ObjectId.isValid.mockReturnValue(true)

    idValidation(req, res, next, validId)

    expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(validId)
    expect(next).toHaveBeenCalled()
    expect(createError).not.toHaveBeenCalled()
  })

  it('should throw INVALID_ID for invalid ObjectId', () => {
    const invalidId = 'invalid-id'

    mongoose.Types.ObjectId.isValid.mockReturnValue(false)

    expect(() => {
      idValidation(req, res, next, invalidId)
    }).toThrow()

    expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidId)
    expect(next).not.toHaveBeenCalled()
    expect(createError).toHaveBeenCalledWith(400, INVALID_ID)
  })

  it('should throw INVALID_ID if id is missing', () => {
    expect(() => {
      idValidation(req, res, next, undefined)
    }).toThrow()

    expect(next).not.toHaveBeenCalled()
    expect(createError).toHaveBeenCalledWith(400, INVALID_ID)
  })

  it('should throw INVALID_ID if id is null', () => {
    expect(() => {
      idValidation(req, res, next, null)
    }).toThrow()

    expect(next).not.toHaveBeenCalled()
    expect(createError).toHaveBeenCalledWith(400, INVALID_ID)
  })
})
