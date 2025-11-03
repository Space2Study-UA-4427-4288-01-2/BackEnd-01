const Category = require('~/models/category')
const { ObjectId } = require('mongodb')

const categoryService = {
  getCategories: async (match = {}, sort = {}, skip = null, limit = null) => {
    const query = Category.find(match).collation({ locale: 'en', strength: 1 }).sort(sort)

    if (typeof skip === 'number') query.skip(skip)
    if (typeof limit === 'number') query.limit(limit)

    const items = await query.exec()
    const count = await Category.countDocuments(match)

    return { items, count }
  },

  getCategoryNames: async () => await Category.find({}, { name: 1, _id: 1 }),

  getCategoryById: async (id) => await Category.find({ _id: ObjectId(id) })
}

module.exports = categoryService
