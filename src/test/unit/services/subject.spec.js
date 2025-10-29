describe('subjects service', () => {
  let subjectsService
  let SubjectMock

  beforeEach(() => {
    jest.resetModules()
    SubjectMock = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndDelete: jest.fn()
    }
    jest.doMock('~/models/subject', () => SubjectMock)
    subjectsService = require('~/services/subject')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('list', () => {
    it('getSubjects returns items and count', async () => {
      const fakeItems = [{ name: 'Math' }]
      SubjectMock.find.mockReturnValue({
        collation: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ exec: async () => fakeItems }) }) }) })
      })
      SubjectMock.countDocuments.mockResolvedValue(1)

      const match = { category: 'cid', name: { $regex: 'm', $options: 'i' } }
      const res = await subjectsService.getSubjects(match, { createdAt: -1 }, 0, 10)

      expect(res.items).toEqual(fakeItems)
      expect(res.count).toBe(1)
      expect(SubjectMock.find).toHaveBeenCalledWith(match)
      expect(SubjectMock.countDocuments).toHaveBeenCalledWith(match)
    })

    it('getSubjects still counts documents when find returns empty', async () => {
      SubjectMock.find.mockReturnValue({
        collation: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ exec: async () => [] }) }) }) })
      })
      SubjectMock.countDocuments.mockResolvedValue(0)

      const match = { category: 'cid' }
      const res = await subjectsService.getSubjects(match, {}, 0, 10)

      expect(res.items).toEqual([])
      expect(res.count).toBe(0)
      expect(SubjectMock.countDocuments).toHaveBeenCalledWith(match)
    })
  })

  describe('names', () => {
    it('getSubjectsNames returns items', async () => {
      SubjectMock.find.mockReturnValue({
        select: () => ({ collation: () => ({ exec: async () => [{ name: 'Math' }] }) })
      })

      const match = { category: 'cid', name: { $regex: 'm', $options: 'i' } }
      const res = await subjectsService.getSubjectsNames(match)

      expect(res).toEqual([{ name: 'Math' }])
      expect(SubjectMock.find).toHaveBeenCalledWith(match)
    })
  })

  describe('get by id', () => {
    it('returns doc when found', async () => {
      const exec = jest.fn().mockResolvedValue({ _id: '1', name: 'Math' })
      SubjectMock.findById.mockReturnValue({ lean: () => ({ exec }) })
      const res = await subjectsService.getSubjectById('1')
      expect(res).toEqual({ _id: '1', name: 'Math' })
      expect(SubjectMock.findById).toHaveBeenCalledWith('1')
    })

    it('throws 404 when not found', async () => {
      const exec = jest.fn().mockResolvedValue(null)
      SubjectMock.findById.mockReturnValue({ lean: () => ({ exec }) })
      await expect(subjectsService.getSubjectById('2')).rejects.toHaveProperty('status', 404)
    })
  })

  describe('create', () => {
    it('creates a subject and returns it', async () => {
      const payload = { name: 'Math', category: '507f1f77bcf86cd799439011' }
      const created = { _id: '507f1f77bcf86cd799439012', ...payload }
      SubjectMock.create.mockResolvedValue(created)

      const res = await subjectsService.addSubject(payload)

      expect(SubjectMock.create).toHaveBeenCalledWith(payload)
      expect(res).toEqual(created)
    })
  })

  describe('delete', () => {
    it('deletes when found', async () => {
      SubjectMock.findByIdAndDelete.mockReturnValue({ exec: () => Promise.resolve({ _id: '1' }) })
      await expect(subjectsService.deleteSubject('1')).resolves.toBeUndefined()
      expect(SubjectMock.findByIdAndDelete).toHaveBeenCalledWith('1')
    })

    it('throws 404 when not found', async () => {
      SubjectMock.findByIdAndDelete.mockReturnValue({ exec: () => Promise.resolve(null) })
      await expect(subjectsService.deleteSubject('2')).rejects.toHaveProperty('status', 404)
    })
  })

  describe('update', () => {
    it('updates allowed fields and saves when found', async () => {
      const doc = { _id: '1', name: 'Old', category: 'cat1', save: jest.fn().mockResolvedValue() }
      SubjectMock.findById.mockReturnValue({ exec: () => Promise.resolve(doc) })

      await expect(
        subjectsService.updateSubject('1', { name: 'New', category: 'cat2', totalOffers: 100 })
      ).resolves.toBeUndefined()

      expect(SubjectMock.findById).toHaveBeenCalledWith('1')
      expect(doc.name).toBe('New')
      expect(doc.category).toBe('cat2')
      // totalOffers should not be updated since it's not in whitelist
      expect(doc.totalOffers).toBeUndefined()
      expect(doc.save).toHaveBeenCalled()
    })

    it('throws 404 when not found', async () => {
      SubjectMock.findById.mockReturnValue({ exec: () => Promise.resolve(null) })
      await expect(subjectsService.updateSubject('2', { name: 'X' })).rejects.toHaveProperty('status', 404)
    })
  })
})
