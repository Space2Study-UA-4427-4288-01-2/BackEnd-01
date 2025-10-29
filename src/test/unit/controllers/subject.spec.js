const subjectService = require('~/services/subject')
const subjectsController = require('~/controllers/subject')

const mockRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn()
  res.send = jest.fn()
  res.end = jest.fn()
  return res
}

jest.mock('~/services/subject', () => ({
  getSubjects: jest.fn(),
  getSubjectsNames: jest.fn(),
  getSubjectById: jest.fn(),
  addSubject: jest.fn(),
  updateSubject: jest.fn(),
  deleteSubject: jest.fn()
}))

describe('subjects controller', () => {
  beforeEach(() => {
    subjectService.getSubjects.mockReset()
    subjectService.getSubjectsNames.mockReset()
    subjectService.getSubjectById && subjectService.getSubjectById.mockReset()
    subjectService.addSubject && subjectService.addSubject.mockReset()
    subjectService.updateSubject && subjectService.updateSubject.mockReset()
    subjectService.deleteSubject && subjectService.deleteSubject.mockReset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /subjects', () => {
    it('reads categoryId from query and returns json', async () => {
      const req = { query: { categoryId: '64a7f6d3c9a1b2f3e0d1c2b3', skip: '0', limit: '10' } }
      const res = mockRes()

      subjectService.getSubjects.mockResolvedValue({ items: [], count: 0 })

      await subjectsController.getSubjects(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ items: [], count: 0 })
    })

    it('accepts missing skip/limit and passes null to service', async () => {
      const req = { query: { categoryId: '64a7f6d3c9a1b2f3e0d1c2b3' } }
      const res = mockRes()

      subjectService.getSubjects.mockResolvedValue({ items: [], count: 0 })

      await subjectsController.getSubjects(req, res)

      expect(subjectService.getSubjects).toHaveBeenCalled()
      const callArgs = subjectService.getSubjects.mock.calls[0]
      // args: match, sortOptions, pageNum, limitNum
      expect(callArgs[2]).toBeNull()
      expect(callArgs[3]).toBeNull()
    })

    it('throws 400 for invalid sort param', async () => {
      const req = { query: { categoryId: '64a7f6d3c9a1b2f3e0d1c2b3', sort: { not: 'a string' } } }
      const res = mockRes()

      await expect(subjectsController.getSubjects(req, res)).rejects.toHaveProperty('status', 400)
    })

    it('throws 400 for invalid name param', async () => {
      const req = { query: { categoryId: '64a7f6d3c9a1b2f3e0d1c2b3', name: 123 } }
      const res = mockRes()

      await expect(subjectsController.getSubjects(req, res)).rejects.toHaveProperty('status', 400)
    })

    it('throws 400 for invalid skip/limit query params', async () => {
      const req = { query: { categoryId: '64a7f6d3c9a1b2f3e0d1c2b3', skip: 'not-a-number', limit: '10' } }
      const res = mockRes()

      await expect(subjectsController.getSubjects(req, res)).rejects.toHaveProperty('status', 400)
    })
  })

  describe('GET /subjects/names', () => {
    it('reads categoryId from query and returns json', async () => {
      const req = { query: { categoryId: '64a7f6d3c9a1b2f3e0d1c2b3' } }
      const res = mockRes()

      subjectService.getSubjectsNames.mockResolvedValue([{ name: 'Math' }])

      await subjectsController.getSubjectsNames(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith([{ name: 'Math' }])
    })
  })

  describe('GET /subjects/:id', () => {
    it('returns 200 and subject when found', async () => {
      const req = { params: { id: '64a7f6d3c9a1b2f3e0d1c2b3' } }
      const res = mockRes()
      const subject = { _id: req.params.id, name: 'Math' }
      subjectService.getSubjectById.mockResolvedValue(subject)

      await subjectsController.getSubjectById(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(subject)
    })

    it('propagates 404 when subject not found', async () => {
      const req = { params: { id: '64a7f6d3c9a1b2f3e0d1c2b3' } }
      const res = mockRes()
      const err = new Error('not found')
      err.status = 404
      subjectService.getSubjectById.mockRejectedValue(err)

      await expect(subjectsController.getSubjectById(req, res)).rejects.toHaveProperty('status', 404)
    })
  })

  describe('POST /subjects', () => {
    it('creates subject and returns 201', async () => {
      const req = { body: { name: 'Math', category: '64a7f6d3c9a1b2f3e0d1c2b3' } }
      const res = mockRes()
      const created = {
        _id: '507f1f77bcf86cd799439011',
        ...req.body,
        createdAt: new Date().toJSON(),
        updatedAt: new Date().toJSON()
      }
      subjectService.addSubject.mockResolvedValue(created)

      await subjectsController.addSubject(req, res)

      expect(subjectService.addSubject).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.send).toHaveBeenCalledWith(created)
    })
  })

  describe('DELETE /subjects/:id', () => {
    it('deletes subject and returns 204', async () => {
      const req = { params: { id: '64a7f6d3c9a1b2f3e0d1c2b3' } }
      const res = mockRes()
      subjectService.deleteSubject.mockResolvedValue()

      await subjectsController.deleteSubject(req, res)

      expect(subjectService.deleteSubject).toHaveBeenCalledWith(req.params.id)
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.end).toHaveBeenCalled()
    })

    it('propagates 404 when subject not found', async () => {
      const req = { params: { id: '64a7f6d3c9a1b2f3e0d1c2b3' } }
      const res = mockRes()
      const err = new Error('not found')
      err.status = 404
      subjectService.deleteSubject.mockRejectedValue(err)

      await expect(subjectsController.deleteSubject(req, res)).rejects.toHaveProperty('status', 404)
    })
  })

  describe('PATCH /subjects/:id', () => {
    it('updates subject and returns 204', async () => {
      const req = { params: { id: '64a7f6d3c9a1b2f3e0d1c2b3' }, body: { name: 'New name' } }
      const res = mockRes()
      subjectService.updateSubject.mockResolvedValue()

      await subjectsController.updateSubject(req, res)

      expect(subjectService.updateSubject).toHaveBeenCalledWith(req.params.id, req.body)
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.end).toHaveBeenCalled()
    })

    it('propagates 404 when subject not found', async () => {
      const req = { params: { id: '64a7f6d3c9a1b2f3e0d1c2b3' }, body: { name: 'New name' } }
      const res = mockRes()
      const err = new Error('not found')
      err.status = 404
      subjectService.updateSubject.mockRejectedValue(err)

      await expect(subjectsController.updateSubject(req, res)).rejects.toHaveProperty('status', 404)
    })
  })
})
