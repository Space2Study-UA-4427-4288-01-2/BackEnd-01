const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const { expectError } = require('~/test/helpers')
const { UNAUTHORIZED, FORBIDDEN, BAD_REQUEST } = require('~/consts/errors')
const testUserAuthentication = require('~/utils/testUserAuth')
const Lesson = require('~/models/lesson')
const Category = require('~/models/category')

const {
  roles: { ADMIN, TUTOR }
} = require('~/consts/auth')

const endpointUrl = '/lessons/'

describe('Lesson controller - integration', () => {
  let app, server, adminToken, tutorToken, studentToken, createdCategory, categoryB

  beforeAll(async () => {
    ;({ app, server } = await serverInit())
  })

  beforeEach(async () => {
    tutorToken = await testUserAuthentication(app, { role: TUTOR, email: `tutor_${Date.now()}@example.com` })

    // create categories directly via model (Category)
    createdCategory = await Category.create({ name: 'STEM' })
    categoryB = await Category.create({ name: 'Humanities' })

    // seed lessons directly via model
    await Lesson.create([
      { title: 'Algebra', description: 'Basics', attachments: [], category: createdCategory._id },
      { title: 'Music Theory', description: 'Intro', attachments: [], category: createdCategory._id },
      { title: 'World History', description: 'Overview', attachments: [], category: categoryB._id }
    ])

    adminToken = await testUserAuthentication(app, { role: ADMIN, email: `admin_${Date.now()}@example.com` })
    studentToken = await testUserAuthentication(app, { email: `student_${Date.now()}@example.com` })
  })

  afterEach(async () => {
    await serverCleanup()
  })

  afterAll(async () => {
    await stopServer(server)
  })

  describe(`GET ${endpointUrl}`, () => {
    it('returns list with items and count (public)', async () => {
      const res = await app.get(endpointUrl)
      expect(res.statusCode).toBe(200)
      expect(res.body).toMatchObject({ count: 3 })
      expect(Array.isArray(res.body.items)).toBe(true)
      expect(res.body.items.length).toBe(3)
    })

    it('supports category filter', async () => {
      const res = await app.get(endpointUrl).query({ categoryId: createdCategory._id.toString() })
      expect(res.statusCode).toBe(200)
      expect(res.body.count).toBe(2)
      const titles = res.body.items.map((i) => i.title).sort()
      expect(titles).toEqual(['Algebra', 'Music Theory'])
    })

    it('supports title substring filter', async () => {
      const res = await app.get(endpointUrl).query({ title: 'Alge' })
      expect(res.statusCode).toBe(200)
      const titles = res.body.items.map((i) => i.title)
      expect(titles).toContain('Algebra')
      expect(titles).not.toContain('World History')
    })

    it('supports pagination (skip, limit) and keeps total count', async () => {
      const res = await app.get(endpointUrl).query({ skip: '1', limit: '1', sort: '{"order":"asc","orderBy":"title"}' })
      expect(res.statusCode).toBe(200)
      expect(res.body.count).toBe(3)
      expect(res.body.items.length).toBe(1)
    })

    it('supports sorting by title asc/desc via JSON string', async () => {
      const asc = await app.get(endpointUrl).query({ sort: '{"order":"asc","orderBy":"title"}' })
      const ascTitles = asc.body.items.map((i) => i.title)
      expect(asc.statusCode).toBe(200)
      expect([...ascTitles].sort()).toEqual(ascTitles)

      const desc = await app.get(endpointUrl).query({ sort: '{"order":"desc","orderBy":"title"}' })
      const descTitles = desc.body.items.map((i) => i.title)
      expect(desc.statusCode).toBe(200)
      expect([...descTitles].sort().reverse()).toEqual(descTitles)
    })

    it('falls back to default sort on invalid sort JSON', async () => {
      const res = await app.get(endpointUrl).query({ sort: '{not valid json' })
      expect(res.statusCode).toBe(200)
    })

    it('returns 400 for invalid skip/limit/sort types', async () => {
      const badSkip = await app.get(endpointUrl).query({ skip: 'NaN' })
      expect(badSkip.statusCode).toBe(400)
      expect(badSkip.body.code).toBe(BAD_REQUEST.code)

      const badLimit = await app.get(endpointUrl).query({ limit: 'x' })
      expect(badLimit.statusCode).toBe(400)
      expect(badLimit.body.code).toBe(BAD_REQUEST.code)

      const badSortType = await app.get(endpointUrl).query({ sort: [1, 2] })
      expect(badSortType.statusCode).toBe(400)
      expect(badSortType.body.code).toBe(BAD_REQUEST.code)
    })

    it('returns 400 for invalid categoryId type', async () => {
      const res = await app.get(endpointUrl).query({ categoryId: 123 })
      expect(res.statusCode).toBe(400)
      expect(res.body.code).toBe(BAD_REQUEST.code)
    })
  })

  describe(`POST ${endpointUrl}`, () => {
    it('returns UNAUTHORIZED without token', async () => {
      const res = await app.post(endpointUrl).send({})
      expectError(401, UNAUTHORIZED, res)
    })

    it('returns FORBIDDEN for non-authorized role', async () => {
      const res = await app
        .post(endpointUrl)
        .send({ title: 'New lesson', category: createdCategory._id })
        .set('Cookie', [`accessToken=${studentToken}`])
      expectError(403, FORBIDDEN, res)
    })

    it('creates a lesson with valid data (Tutor only)', async () => {
      const payload = { title: 'New lesson', description: 'desc', attachments: [], category: createdCategory._id }
      const res = await app
        .post(endpointUrl)
        .send(payload)
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(201)
      expect(res.body).toMatchObject({ title: payload.title, category: createdCategory._id })
      expect(res.body).toHaveProperty('_id')
    })

    it('returns 400 for missing title', async () => {
      const res = await app
        .post(endpointUrl)
        .send({ category: createdCategory._id })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(400)
      expect(res.body.code).toBe(BAD_REQUEST.code)
    })

    it('returns 400 for invalid category type', async () => {
      const res = await app
        .post(endpointUrl)
        .send({ title: 'Bad', category: 123 })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(400)
      expect(res.body.code).toBe(BAD_REQUEST.code)
    })

    it('returns 400 for invalid category ObjectId format', async () => {
      const res = await app
        .post(endpointUrl)
        .send({ title: 'Bad', category: 'not-an-objectid' })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(400)
      expect(res.body.code).toBe(BAD_REQUEST.code)
    })

    it('returns 400 when attachments is not an array', async () => {
      const res = await app
        .post(endpointUrl)
        .send({ title: 'Bad', category: createdCategory._id, attachments: 'not-array' })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(400)
      expect(res.body.code).toBe(BAD_REQUEST.code)
    })

    it('returns 400 when attachments contain invalid ObjectId', async () => {
      const res = await app
        .post(endpointUrl)
        .send({ title: 'Bad', category: createdCategory._id, attachments: ['invalid'] })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(400)
      expect(res.body.code).toBe(BAD_REQUEST.code)
    })
  })

  describe(`GET ${endpointUrl}:id`, () => {
    let existingLesson

    beforeEach(async () => {
      // pick one existing lesson
      existingLesson = await Lesson.findOne({ title: 'Algebra' }).lean()
    })

    it('returns 400 for invalid id format', async () => {
      const response = await app.get(`${endpointUrl}invalid-id`)
      expect(response.statusCode).toBe(400)
    })

    it('returns 404 for non-existent lesson id', async () => {
      const nonExistentId = '64a7f6d3c9a1b2f3e0d1c2b3'
      const response = await app.get(`${endpointUrl}${nonExistentId}`)
      expect(response.statusCode).toBe(404)
    })

    it('returns lesson by id for tutor', async () => {
      const response = await app.get(`${endpointUrl}${existingLesson._id}`)
      expect(response.statusCode).toBe(200)
      expect(response.body).toMatchObject({ _id: String(existingLesson._id), title: existingLesson.title })
    })
  })

  describe(`PATCH ${endpointUrl}:id`, () => {
    let lessonToUpdate

    beforeEach(async () => {
      lessonToUpdate = await Lesson.findOne({ title: 'Algebra' }).lean()
    })

    it('returns UNAUTHORIZED without token', async () => {
      const res = await app.patch(`${endpointUrl}${lessonToUpdate._id}`).send({ title: 'Updated' })
      expectError(401, UNAUTHORIZED, res)
    })

    it('returns FORBIDDEN for non-authorized role', async () => {
      const res = await app
        .patch(`${endpointUrl}${lessonToUpdate._id}`)
        .send({ title: 'Updated' })
        .set('Cookie', [`accessToken=${studentToken}`])
      expectError(403, FORBIDDEN, res)
    })

    it('returns 400 for invalid id format', async () => {
      const res = await app
        .patch(`${endpointUrl}invalid-id`)
        .send({ title: 'Updated' })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(400)
    })

    it('returns 404 for non-existent lesson', async () => {
      const nonExistentId = '64a7f6d3c9a1b2f3e0d1c2b3'
      const res = await app
        .patch(`${endpointUrl}${nonExistentId}`)
        .send({ title: 'Updated' })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(404)
    })

    it('updates allowed fields and returns 204', async () => {
      const res = await app
        .patch(`${endpointUrl}${lessonToUpdate._id}`)
        .send({ title: 'Linear Algebra', description: 'Updated desc' })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(204)

      const getRes = await app.get(`${endpointUrl}${lessonToUpdate._id}`).set('Cookie', [`accessToken=${tutorToken}`])
      expect(getRes.statusCode).toBe(200)
      expect(getRes.body.title).toBe('Linear Algebra')
      expect(getRes.body.description).toBe('Updated desc')
    })

    it('returns 400 for invalid payload shapes', async () => {
      const res1 = await app
        .patch(`${endpointUrl}${lessonToUpdate._id}`)
        .send({ title: 123 })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res1.statusCode).toBe(400)

      const res2 = await app
        .patch(`${endpointUrl}${lessonToUpdate._id}`)
        .send({ attachments: 'not-array' })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res2.statusCode).toBe(400)

      const res3 = await app
        .patch(`${endpointUrl}${lessonToUpdate._id}`)
        .send({ attachments: ['invalid'] })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res3.statusCode).toBe(400)

      const res4 = await app
        .patch(`${endpointUrl}${lessonToUpdate._id}`)
        .send({ category: 123 })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res4.statusCode).toBe(400)

      const res5 = await app
        .patch(`${endpointUrl}${lessonToUpdate._id}`)
        .send({ category: 'invalid' })
        .set('Cookie', [`accessToken=${tutorToken}`])
      expect(res5.statusCode).toBe(400)
    })
  })

  describe(`DELETE ${endpointUrl}:id`, () => {
    let toDelete

    beforeEach(async () => {
      toDelete = await Lesson.findOne({ title: 'World History' }).lean()
    })

    it('returns UNAUTHORIZED without token', async () => {
      const res = await app.delete(`${endpointUrl}${toDelete._id}`)
      expectError(401, UNAUTHORIZED, res)
    })

    it('returns FORBIDDEN for non-authorized role', async () => {
      const res = await app.delete(`${endpointUrl}${toDelete._id}`).set('Cookie', [`accessToken=${studentToken}`])
      expectError(403, FORBIDDEN, res)
    })

    it('returns 400 for invalid id format', async () => {
      const res = await app.delete(`${endpointUrl}invalid-id`).set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(400)
    })

    it('returns 404 for non-existent lesson id', async () => {
      const nonExistentId = '64a7f6d3c9a1b2f3e0d1c2b3'
      const res = await app.delete(`${endpointUrl}${nonExistentId}`).set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(404)
    })

    it('deletes lesson and returns 204', async () => {
      const res = await app.delete(`${endpointUrl}${toDelete._id}`).set('Cookie', [`accessToken=${tutorToken}`])
      expect(res.statusCode).toBe(204)

      const getRes = await app.get(`${endpointUrl}${toDelete._id}`).set('Cookie', [`accessToken=${tutorToken}`])
      expect(getRes.statusCode).toBe(404)
    })
  })
})
