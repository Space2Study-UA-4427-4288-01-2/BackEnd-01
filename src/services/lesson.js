const Lesson = require('~/models/lesson')

const lessonService = {
  getLessons: async (match, sort, skip, limit) => {
    const items = await Lesson.find(match)
      .collation({ locale: 'en', strength: 1 })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec()

    const count = await Lesson.countDocuments(match)

    return { items, count }
  },

  getLessonById: async (id) => {
    return Lesson.findById(id).exec()
  },

  createLesson: async (data) => {
    return Lesson.create(data)
  },

  updateLesson: async (id, updateData) => {
    const lesson = await Lesson.findById(id).exec()

    if (!lesson) {
      throw createNotFoundError('Lesson not found')
    }

    for (const field in updateData) {
      lesson[field] = updateData[field]
    }

    await lesson.save()
  },

  deleteLesson: async (id) => {
    await Lesson.findByIdAndRemove(id).exec()
  }
}

module.exports = lessonService
