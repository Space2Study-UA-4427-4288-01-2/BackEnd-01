const langMiddleware = require('~/middlewares/appLanguage')
const { createError } = require('~/utils/errorsHelper')
const { INVALID_LANGUAGE } = require('~/consts/errors')
const { APP_LANG_ENUM } = require('~/consts/validation').enums

describe('langMiddleware', () => {
  let req, res, next

  beforeEach(() => {
    res = {}
    next = jest.fn()
    req = {
      acceptsLanguages: jest.fn()
    }
  })

  it('should set req.lang to the accepted language if valid', () => {
    req.acceptsLanguages.mockReturnValue(APP_LANG_ENUM[0])

    langMiddleware(req, res, next)

    expect(req.lang).toBe(APP_LANG_ENUM[0])
    expect(next).toHaveBeenCalled()
  })

  it('should throw 400 INVALID_LANGUAGE if language is not supported', () => {
    req.acceptsLanguages.mockReturnValue(false)

    expect(() => langMiddleware(req, res, next)).toThrow(createError(400, INVALID_LANGUAGE))
    expect(next).not.toHaveBeenCalled()
  })
})
