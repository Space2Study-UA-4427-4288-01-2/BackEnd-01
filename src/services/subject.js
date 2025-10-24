const Subject = require('~/models/subject')
const { createError } = require('~/utils/errorsHelper')
const { DOCUMENT_NOT_FOUND } = require('~/consts/errors')
const subjectService = {
  getSubjects: async (match, sort, skip, limit) => {
    const items = await Subject.find(match)
      .collation({ locale: 'en', strength: 1 })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec()

    const count = await Subject.countDocuments(match)

    return { items, count }
  },

  getSubjectsNames: async (match) => {
    return await Subject.find(match).select('name').collation({ locale: 'en', strength: 1 }).exec()
  },

  getSubjectById: async (id) => {
    const subject = await Subject.findById(id).lean().exec()
    if (!subject) {
      throw createError(404, DOCUMENT_NOT_FOUND(['Subject']))
    }
    return subject
  },

  addSubject: async (data) => {
    const { name, category } = data || {}
    return await Subject.create({ name, category })
  },

  updateSubject: async (id, data) => {
    const subject = await Subject.findById(id).exec()
    if (!subject) {
      throw createError(404, DOCUMENT_NOT_FOUND(['Subject']))
    }

    const updatableFields = ['name', 'category']
    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        subject[field] = data[field]
      }
    })

    await subject.save()
  },

  deleteSubject: async (id) => {
    const deleted = await Subject.findByIdAndDelete(id).exec()
    if (!deleted) {
      throw createError(404, DOCUMENT_NOT_FOUND(['Subject']))
    }
  }
}

module.exports = subjectService
