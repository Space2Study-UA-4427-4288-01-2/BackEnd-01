const User = require('~/models/user')

// Creates a valid user directly in DB and returns an access token via /auth/login
// Ensures all required fields are present, sets a valid nativeLanguage, and uses a unique email when not provided.
const testUserAuthentication = async (app, overrides = {}) => {
  const roleValue = Array.isArray(overrides.role) ? overrides.role : [overrides.role || 'student']

  const uniqueEmail = overrides.email || `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`

  const baseUser = {
    role: roleValue,
    firstName: 'Test',
    lastName: 'User',
    email: uniqueEmail,
    password: 'Qwerty123@',
    nativeLanguage: 'English',
    FAQ: { student: [{ question: 'question1', answer: 'answer1' }] },
    isEmailConfirmed: true,
    lastLoginAs: roleValue[0]
  }

  const userData = { ...baseUser, ...overrides, role: roleValue, email: uniqueEmail, lastLoginAs: roleValue[0] }

  await User.create(userData)

  const loginUserResponse = await app.post('/auth/login').send({ email: userData.email, password: userData.password })

  return loginUserResponse.body.accessToken
}

module.exports = testUserAuthentication
