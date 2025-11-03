jest.mock('~/models/lesson')

const Lesson = require('~/models/lesson')
const lessonService = require('~/services/lesson')

describe('lessonService unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getLessons returns items and count', async () => {
    const chain = { collation: jest.fn(), sort: jest.fn(), skip: jest.fn(), limit: jest.fn(), exec: jest.fn() }
    chain.collation.mockReturnValue(chain)
    chain.sort.mockReturnValue(chain)
    chain.skip.mockReturnValue(chain)
    chain.limit.mockReturnValue(chain)
    chain.exec.mockResolvedValue([{ _id: '1' }])
    Lesson.find.mockReturnValue(chain)
    Lesson.countDocuments.mockResolvedValue(1)

    const res = await lessonService.getLessons({ category: 'c' }, { updatedAt: -1 }, 0, 10)

    expect(Lesson.find).toHaveBeenCalledWith({ category: 'c' })
    expect(Lesson.countDocuments).toHaveBeenCalledWith({ category: 'c' })
    expect(res).toEqual({ items: [{ _id: '1' }], count: 1 })
  })

  test('getLessonById returns doc', async () => {
    const exec = jest.fn().mockResolvedValue({ _id: 'id1' })
    Lesson.findById.mockReturnValue({ exec })

    const doc = await lessonService.getLessonById('id1')
    expect(Lesson.findById).toHaveBeenCalledWith('id1')
    expect(doc).toEqual({ _id: 'id1' })
  })

  test('createLesson uses model.create', async () => {
    const payload = { title: 't', category: 'c' }
    Lesson.create.mockResolvedValue({ _id: 'id', ...payload })

    const created = await lessonService.createLesson(payload)
    expect(Lesson.create).toHaveBeenCalledWith(payload)
    expect(created._id).toBe('id')
  })

  test('updateLesson loads, mutates and saves', async () => {
    const save = jest.fn()
    const doc = { _id: 'id', title: 'old', save }
    Lesson.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(doc) })

    await lessonService.updateLesson('id', { title: 'new' })
    expect(Lesson.findById).toHaveBeenCalledWith('id')
    expect(doc.title).toBe('new')
    expect(save).toHaveBeenCalled()
  })

  test('deleteLesson removes by id', async () => {
    const exec = jest.fn().mockResolvedValue()
    Lesson.findByIdAndRemove.mockReturnValue({ exec })

    await lessonService.deleteLesson('id')
    expect(Lesson.findByIdAndRemove).toHaveBeenCalledWith('id')
  })
})
