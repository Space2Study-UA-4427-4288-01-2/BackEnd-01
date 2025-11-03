jest.mock('~/services/lesson', () => ({
  getLessons: jest.fn(),
  getLessonById: jest.fn(),
  createLesson: jest.fn(),
  updateLesson: jest.fn(),
  deleteLesson: jest.fn()
}))

jest.mock('~/utils/getMatchOptions', () => jest.fn((args) => args))
jest.mock('~/utils/getSortOptions', () => jest.fn(() => ({ updatedAt: -1 })))
jest.mock('~/utils/getRegex', () => jest.fn((s) => (s ? `/${s}/i` : undefined)))

const mongoose = require('mongoose')
const lessonService = require('~/services/lesson')
const getMatchOptions = require('~/utils/getMatchOptions')
const getSortOptions = require('~/utils/getSortOptions')
const getRegex = require('~/utils/getRegex')

const { getLessons, getLessonById, createLesson, updateLesson, deleteLesson } = require('~/controllers/lesson')

const makeRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.end = jest.fn().mockReturnValue(res)
  return res
}

describe('Lesson controller unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getLessons', () => {
    it('throws 400 for invalid skip', async () => {
      const req = { query: { skip: 'NaN' } }
      const res = makeRes()
      await expect(getLessons(req, res)).rejects.toMatchObject({ status: 400 })
    })

    it('throws 400 for invalid limit', async () => {
      const req = { query: { limit: 'x' } }
      const res = makeRes()
      await expect(getLessons(req, res)).rejects.toMatchObject({ status: 400 })
    })

    it('throws 400 for invalid sort type', async () => {
      const req = { query: { sort: [1, 2] } }
      const res = makeRes()
      await expect(getLessons(req, res)).rejects.toMatchObject({ status: 400 })
    })

    it('throws 400 for invalid title type', async () => {
      const req = { query: { title: 10 } }
      const res = makeRes()
      await expect(getLessons(req, res)).rejects.toMatchObject({ status: 400 })
    })

    it('throws 400 when categoryId is not string', async () => {
      const req = { query: { categoryId: 123 } }
      const res = makeRes()
      await expect(getLessons(req, res)).rejects.toMatchObject({ status: 400 })
    })

    it('throws 400 when categoryId is not a valid ObjectId', async () => {
      const req = { query: { categoryId: 'invalid-objectid' } }
      const res = makeRes()
      await expect(getLessons(req, res)).rejects.toMatchObject({ status: 400 })
    })

    it('calls service with parsed options and returns 200', async () => {
      const categoryId = new mongoose.Types.ObjectId().toHexString()
      const req = {
        query: {
          categoryId,
          title: 'Alg',
          skip: '2',
          limit: '3',
          sort: '{"order":"desc","orderBy":"updatedAt"}'
        }
      }
      const res = makeRes()
      lessonService.getLessons.mockResolvedValue({ items: [], count: 0 })

      await getLessons(req, res)

      expect(getRegex).toHaveBeenCalledWith('Alg')
      expect(getMatchOptions).toHaveBeenCalled()
      expect(getSortOptions).toHaveBeenCalledWith(req.query.sort)
      expect(lessonService.getLessons).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 2, 3)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ items: [], count: 0 })
    })
  })

  describe('getLessonById', () => {
    it('returns 200 with lesson', async () => {
      const id = new mongoose.Types.ObjectId().toHexString()
      const req = { params: { id } }
      const res = makeRes()
      const lesson = { _id: id, title: 'Algebra' }
      lessonService.getLessonById.mockResolvedValue(lesson)

      await getLessonById(req, res)

      expect(lessonService.getLessonById).toHaveBeenCalledWith(id)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(lesson)
    })
  })

  describe('createLesson', () => {
    it('validates required fields', async () => {
      const res = makeRes()
      await expect(createLesson({ body: {} }, res)).rejects.toMatchObject({ status: 400 })
      await expect(createLesson({ body: { title: 'x' } }, res)).rejects.toMatchObject({ status: 400 })
      await expect(createLesson({ body: { title: 'x', category: 1 } }, res)).rejects.toMatchObject({ status: 400 })
      await expect(createLesson({ body: { title: 'x', category: 'invalid' } }, res)).rejects.toMatchObject({
        status: 400
      })
    })

    it('validates attachments', async () => {
      const category = new mongoose.Types.ObjectId().toHexString()
      const res = makeRes()
      await expect(createLesson({ body: { title: 'x', category, attachments: 'bad' } }, res)).rejects.toMatchObject({
        status: 400
      })
      await expect(createLesson({ body: { title: 'x', category, attachments: ['bad'] } }, res)).rejects.toMatchObject({
        status: 400
      })
    })

    it('creates lesson and returns 201', async () => {
      const category = new mongoose.Types.ObjectId().toHexString()
      const req = { body: { title: 'New', description: 'd', attachments: [], category } }
      const res = makeRes()
      const created = { _id: new mongoose.Types.ObjectId().toHexString(), ...req.body }
      lessonService.createLesson.mockResolvedValue(created)

      await createLesson(req, res)

      expect(lessonService.createLesson).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(created)
    })
  })

  describe('updateLesson', () => {
    it('validates payload shapes', async () => {
      const id = new mongoose.Types.ObjectId().toHexString()
      const res = makeRes()
      await expect(updateLesson({ params: { id }, body: { title: 1 } }, res)).rejects.toMatchObject({ status: 400 })
      await expect(updateLesson({ params: { id }, body: { description: 1 } }, res)).rejects.toMatchObject({
        status: 400
      })
      await expect(updateLesson({ params: { id }, body: { category: 1 } }, res)).rejects.toMatchObject({ status: 400 })
      await expect(updateLesson({ params: { id }, body: { category: 'invalid' } }, res)).rejects.toMatchObject({
        status: 400
      })
      await expect(updateLesson({ params: { id }, body: { attachments: 'bad' } }, res)).rejects.toMatchObject({
        status: 400
      })
      await expect(updateLesson({ params: { id }, body: { attachments: ['bad'] } }, res)).rejects.toMatchObject({
        status: 400
      })
    })

    it('calls service and returns 204', async () => {
      const id = new mongoose.Types.ObjectId().toHexString()
      const req = { params: { id }, body: { title: 'Ok', description: 'd' } }
      const res = makeRes()

      await updateLesson(req, res)

      expect(lessonService.updateLesson).toHaveBeenCalledWith(id, { title: 'Ok', description: 'd' })
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.end).toHaveBeenCalled()
    })
  })

  describe('deleteLesson', () => {
    it('calls service and returns 204', async () => {
      const id = new mongoose.Types.ObjectId().toHexString()
      const req = { params: { id } }
      const res = makeRes()

      await deleteLesson(req, res)

      expect(lessonService.deleteLesson).toHaveBeenCalledWith(id)
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.end).toHaveBeenCalled()
    })
  })
})
