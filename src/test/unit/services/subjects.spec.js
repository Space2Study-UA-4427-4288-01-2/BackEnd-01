describe('subjects service', () => {
  let subjectsService
  let SubjectMock

  beforeEach(() => {
    jest.resetModules()
    SubjectMock = {
      find: jest.fn(),
      countDocuments: jest.fn()
    }
    jest.doMock('~/models/subject', () => SubjectMock)
    subjectsService = require('~/services/subject')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

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

  it('getSubjectsNames returns items', async () => {
    SubjectMock.find.mockReturnValue({
      select: () => ({ collation: () => ({ exec: async () => [{ name: 'Math' }] }) })
    })

    const match = { category: 'cid', name: { $regex: 'm', $options: 'i' } }
    const res = await subjectsService.getSubjectsNames(match)

    expect(res).toEqual([{ name: 'Math' }])
    expect(SubjectMock.find).toHaveBeenCalledWith(match)
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
