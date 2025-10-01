const errorMiddleware = require('~/middlewares/error')
const logger = require('~/logger/logger')
const getUniqueFields = require('~/utils/getUniqueFields')
const {
  DOCUMENT_ALREADY_EXISTS,
  MONGO_SERVER_ERROR,
  VALIDATION_ERROR,
  INTERNAL_SERVER_ERROR
} = require('~/consts/errors')

jest.mock('~/logger/logger', () => ({ error: jest.fn() }))
jest.mock('~/utils/getUniqueFields', () => jest.fn(() => ['email']))

describe('error middleware (unit)', () => {
  let res

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
  })

  afterEach(() => {
    expect(logger.error).toHaveBeenCalledTimes(1)
    jest.clearAllMocks()
  })

  it('returns 409 + DOCUMENT_ALREADY_EXISTS when MongoServerError with code 11000', () => {
    const err = { name: 'MongoServerError', message: 'E11000 duplicate key error', code: 11000 }
    errorMiddleware(err, null, res, null)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json.mock.calls[0][0]).toMatchObject(DOCUMENT_ALREADY_EXISTS(['email']))
    expect(getUniqueFields).toHaveBeenCalledWith(err.message)
  })

  it('returns 500 + MONGO_SERVER_ERROR for MongoServerError with non-11000 code', () => {
    const err = { name: 'MongoServerError', message: 'Other mongo error', code: 9999 }
    errorMiddleware(err, null, res, null)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json.mock.calls[0][0]).toMatchObject(MONGO_SERVER_ERROR(err.message))
  })

  it('returns 409 + VALIDATION_ERROR for ValidationError', () => {
    const err = { name: 'ValidationError', message: 'Invalid field' }
    errorMiddleware(err, null, res, null)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json.mock.calls[0][0]).toMatchObject(VALIDATION_ERROR('Invalid field'))
  })

  it('returns 500 + INTERNAL_SERVER_ERROR for generic Error without status/code', () => {
    const err = new Error('boom')
    errorMiddleware(err, null, res, null)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json.mock.calls[0][0]).toMatchObject({
      status: 500,
      code: INTERNAL_SERVER_ERROR.code,
      message: 'boom'
    })
  })

  it('passes through error object when status and code are present', () => {
    const err = { status: 400, code: 'BAD_REQUEST', message: 'bad' }
    errorMiddleware(err, null, res, null)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json.mock.calls[0][0]).toEqual({ status: 400, code: 'BAD_REQUEST', message: 'bad' })
  })
})
