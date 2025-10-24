const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const { expectError } = require('~/test/helpers')
const { UNAUTHORIZED, FORBIDDEN, BAD_REQUEST, INVALID_ID } = require('~/consts/errors')
const testUserAuthentication = require('~/utils/testUserAuth')
const {
  roles: { ADMIN, TUTOR }
} = require('~/consts/auth')

const endpointUrl = '/subjects/'

describe('Subject controller - integration', () => {
  let app, server, adminToken, tutorToken, createdCategory

  beforeAll(async () => {
    ;({ app, server } = await serverInit())
  })

  beforeEach(async () => {
    tutorToken = await testUserAuthentication(app, { role: TUTOR, email: `tutor_${Date.now()}@example.com` })

    const categoryRes = await app
      .post('/resources-categories/')
      .send({ name: 'STEM' })
      .set('Cookie', [`accessToken=${tutorToken}`])

    createdCategory = categoryRes.body

    adminToken = await testUserAuthentication(app, { role: ADMIN, email: `admin_${Date.now()}@example.com` })
  })

  afterEach(async () => {
    await serverCleanup()
  })

  afterAll(async () => {
    await stopServer(server)
  })

  describe(`POST ${endpointUrl}`, () => {
    it('creates a new subject (ADMIN only)', async () => {
      const payload = { name: 'Mathematics', category: createdCategory._id }

      const response = await app
        .post(endpointUrl)
        .send(payload)
        .set('Cookie', [`accessToken=${adminToken}`])

      expect(response.statusCode).toBe(201)
      expect(response.body).toMatchObject({
        _id: expect.any(String),
        name: payload.name,
        category: payload.category,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
    })

    it('returns UNAUTHORIZED without token', async () => {
      const response = await app.post(endpointUrl).send({ name: 'Physics', category: createdCategory._id })

      expectError(401, UNAUTHORIZED, response)
    })

    it('returns FORBIDDEN for non-admin', async () => {
      const response = await app
        .post(endpointUrl)
        .send({ name: 'Chemistry', category: createdCategory._id })
        .set('Cookie', [`accessToken=${tutorToken}`])

      expectError(403, FORBIDDEN, response)
    })

    it('handles validation error for invalid data', async () => {
      // Missing required name
      const response = await app
        .post(endpointUrl)
        .send({ category: createdCategory._id })
        .set('Cookie', [`accessToken=${adminToken}`])

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ code: 'VALIDATION_ERROR' })
    })
  })

  describe(`DELETE ${endpointUrl}:id`, () => {
    it('deletes a subject (ADMIN only)', async () => {
      const createRes = await app
        .post(endpointUrl)
        .send({ name: 'Biology', category: createdCategory._id })
        .set('Cookie', [`accessToken=${adminToken}`])

      const id = createRes.body._id

      const delRes = await app.delete(endpointUrl + id).set('Cookie', [`accessToken=${adminToken}`])

      expect(delRes.statusCode).toBe(204)
    })

    it('returns 404 when subject does not exist', async () => {
      const nonExistingId = '64a7f6d3c9a1b2f3e0d1c2b3'
      const response = await app.delete(endpointUrl + nonExistingId).set('Cookie', [`accessToken=${adminToken}`])

      expect(response.statusCode).toBe(404)
    })

    it('returns UNAUTHORIZED without token', async () => {
      const response = await app.delete(endpointUrl + '64a7f6d3c9a1b2f3e0d1c2b3')
      expectError(401, UNAUTHORIZED, response)
    })

    it('returns FORBIDDEN for non-admin', async () => {
      const createRes = await app
        .post(endpointUrl)
        .send({ name: 'History', category: createdCategory._id })
        .set('Cookie', [`accessToken=${adminToken}`])

      const id = createRes.body._id
      const response = await app.delete(endpointUrl + id).set('Cookie', [`accessToken=${tutorToken}`])

      expectError(403, FORBIDDEN, response)
    })
  })

  describe(`PATCH ${endpointUrl}:id`, () => {
    it('updates a subject (ADMIN only)', async () => {
      const createRes = await app
        .post(endpointUrl)
        .send({ name: 'Geography', category: createdCategory._id })
        .set('Cookie', [`accessToken=${adminToken}`])

      const id = createRes.body._id

      const patchRes = await app
        .patch(endpointUrl + id)
        .send({ name: 'World Geography' })
        .set('Cookie', [`accessToken=${adminToken}`])

      expect(patchRes.statusCode).toBe(204)
    })

    it('returns 404 when subject does not exist', async () => {
      const nonExistingId = '64a7f6d3c9a1b2f3e0d1c2b3'
      const response = await app
        .patch(endpointUrl + nonExistingId)
        .send({ name: 'Non existing' })
        .set('Cookie', [`accessToken=${adminToken}`])

      expect(response.statusCode).toBe(404)
    })

    it('returns UNAUTHORIZED without token', async () => {
      const response = await app.patch(endpointUrl + '64a7f6d3c9a1b2f3e0d1c2b3').send({ name: 'X' })
      expectError(401, UNAUTHORIZED, response)
    })

    it('returns FORBIDDEN for non-admin', async () => {
      const createRes = await app
        .post(endpointUrl)
        .send({ name: 'Algebra', category: createdCategory._id })
        .set('Cookie', [`accessToken=${adminToken}`])

      const id = createRes.body._id
      const response = await app
        .patch(endpointUrl + id)
        .send({ name: 'Linear Algebra' })
        .set('Cookie', [`accessToken=${tutorToken}`])

      expectError(403, FORBIDDEN, response)
    })

    it('handles validation error for invalid data', async () => {
      const createRes = await app
        .post(endpointUrl)
        .send({ name: 'Zoology', category: createdCategory._id })
        .set('Cookie', [`accessToken=${adminToken}`])

      const id = createRes.body._id

      const response = await app
        .patch(endpointUrl + id)
        .send({ name: '' })
        .set('Cookie', [`accessToken=${adminToken}`])

      expect(response.statusCode).toBe(409)
      expect(response.body).toMatchObject({ code: 'VALIDATION_ERROR' })
    })
  })

  describe(`GET ${endpointUrl}(list, names, by id)`, () => {
    let categoryB, subjects

    beforeEach(async () => {
      const catBRes = await app
        .post('/resources-categories/')
        .send({ name: 'Humanities' })
        .set('Cookie', [`accessToken=${tutorToken}`])
      categoryB = catBRes.body

      const s1 = await app
        .post(endpointUrl)
        .send({ name: 'Mathematics', category: createdCategory._id })
        .set('Cookie', [`accessToken=${adminToken}`])

      const s2 = await app
        .post(endpointUrl)
        .send({ name: 'Music', category: createdCategory._id })
        .set('Cookie', [`accessToken=${adminToken}`])

      const s3 = await app
        .post(endpointUrl)
        .send({ name: 'History', category: categoryB._id })
        .set('Cookie', [`accessToken=${adminToken}`])

      subjects = [s1.body, s2.body, s3.body]
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
        const res = await app.get(endpointUrl).query({ categoryId: createdCategory._id })
        expect(res.statusCode).toBe(200)
        expect(res.body.count).toBe(2)
        const names = res.body.items.map((i) => i.name).sort()
        expect(names).toEqual(['Mathematics', 'Music'])
      })

      it('supports name substring filter (case-insensitive per implementation)', async () => {
        const res = await app.get(endpointUrl).query({ name: 'Mat' })
        expect(res.statusCode).toBe(200)
        const names = res.body.items.map((i) => i.name)
        expect(names).toContain('Mathematics')
        expect(names).not.toContain('History')
      })

      it('supports pagination (skip, limit) and keeps total count', async () => {
        const res = await app
          .get(endpointUrl)
          .query({ skip: '1', limit: '1', sort: '{"order":"asc","orderBy":"name"}' })
        expect(res.statusCode).toBe(200)
        expect(res.body.count).toBe(3)
        expect(res.body.items.length).toBe(1)
      })

      it('supports sorting by name asc/desc via JSON string', async () => {
        const asc = await app.get(endpointUrl).query({ sort: '{"order":"asc","orderBy":"name"}' })
        const ascNames = asc.body.items.map((i) => i.name)
        expect(asc.statusCode).toBe(200)
        expect([...ascNames].sort()).toEqual(ascNames)

        const desc = await app.get(endpointUrl).query({ sort: '{"order":"desc","orderBy":"name"}' })
        const descNames = desc.body.items.map((i) => i.name)
        expect(desc.statusCode).toBe(200)
        expect([...descNames].sort().reverse()).toEqual(descNames)
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
    })

    describe(`GET ${endpointUrl}names`, () => {
      it('returns names array (public)', async () => {
        const res = await app.get(endpointUrl + 'names')
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        const names = res.body.map((x) => x.name).sort()
        expect(names).toEqual(['History', 'Mathematics', 'Music'])
      })

      it('filters names by category', async () => {
        const res = await app.get(endpointUrl + 'names').query({ categoryId: categoryB._id })
        expect(res.statusCode).toBe(200)
        const names = res.body.map((x) => x.name)
        expect(names).toEqual(['History'])
      })

      it('returns 400 for invalid categoryId type', async () => {
        const res = await app.get(endpointUrl + 'names').query({ categoryId: 123 })
        expect(res.statusCode).toBe(400)
        expect(res.body.code).toBe(BAD_REQUEST.code)
      })
    })

    describe(`GET ${endpointUrl}:id`, () => {
      it('returns subject by id (public)', async () => {
        const res = await app.get(endpointUrl + subjects[0]._id)
        expect(res.statusCode).toBe(200)
        expect(res.body).toMatchObject({ _id: subjects[0]._id, name: subjects[0].name })
      })

      it('returns 400 for invalid id format', async () => {
        const res = await app.get(endpointUrl + 'not-an-id')
        expect(res.statusCode).toBe(400)
        expect(res.body.code).toBe(INVALID_ID.code)
      })

      it('returns 404 for non-existing id', async () => {
        const res = await app.get(endpointUrl + '64a7f6d3c9a1b2f3e0d1c2b3')
        expect(res.statusCode).toBe(404)
      })
    })
  })
})
