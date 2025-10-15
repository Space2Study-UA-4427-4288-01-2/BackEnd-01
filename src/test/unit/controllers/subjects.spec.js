const subjectService = require('~/services/subject')
const subjectsController = require('~/controllers/subject')

const mockRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn()
  res.end = jest.fn()
  return res
}

jest.mock('~/services/subject', () => ({
  getSubjects: jest.fn(),
  getSubjectsNames: jest.fn()
}))

describe('subjects controller', () => {
  beforeEach(() => {
    subjectService.getSubjects.mockReset()
    subjectService.getSubjectsNames.mockReset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('getSubjects reads categoryId from query and returns json', async () => {
    const req = { query: { categoryId: 'cid', skip: '0', limit: '10' } }
    const res = mockRes()

    subjectService.getSubjects.mockResolvedValue({ items: [], count: 0 })

    await subjectsController.getSubjects(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ items: [], count: 0 })
  })

  it('getSubjectsNames reads categoryId from query and returns json', async () => {
    const req = { query: { categoryId: 'cid' } }
    const res = mockRes()

    subjectService.getSubjectsNames.mockResolvedValue([{ name: 'Math' }])

    await subjectsController.getSubjectsNames(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([{ name: 'Math' }])
  })

  it('getSubjects accepts missing skip/limit and passes undefined to service', async () => {
    const req = { query: { categoryId: 'cid' } }
    const res = mockRes()

    subjectService.getSubjects.mockResolvedValue({ items: [], count: 0 })

    await subjectsController.getSubjects(req, res)

    expect(subjectService.getSubjects).toHaveBeenCalled()
    const callArgs = subjectService.getSubjects.mock.calls[0]
    // args: match, sortOptions, pageNum, limitNum
    expect(callArgs[2]).toBeUndefined()
    expect(callArgs[3]).toBeUndefined()
  })

  it('getSubjects throws 400 for invalid sort param', async () => {
    const req = { query: { categoryId: 'cid', sort: { not: 'a string' } } }
    const res = mockRes()

    await expect(subjectsController.getSubjects(req, res)).rejects.toHaveProperty('status', 400)
  })

  it('getSubjects throws 400 for invalid name param', async () => {
    const req = { query: { categoryId: 'cid', name: 123 } }
    const res = mockRes()

    await expect(subjectsController.getSubjects(req, res)).rejects.toHaveProperty('status', 400)
  })

  it('getSubjects throws 400 for invalid categoryId param', async () => {
    const req = { query: { categoryId: 123 } }
    const res = mockRes()

    await expect(subjectsController.getSubjects(req, res)).rejects.toHaveProperty('status', 400)
  })

  it('getSubjects throws 400 for invalid skip/limit query params', async () => {
    const req = { query: { categoryId: 'cid', skip: 'not-a-number', limit: '10' } }
    const res = mockRes()

    await expect(subjectsController.getSubjects(req, res)).rejects.toHaveProperty('status', 400)
  })
})
