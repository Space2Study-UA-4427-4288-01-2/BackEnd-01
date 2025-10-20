const Category = require('~/models/category')
const { ObjectId } = require('mongodb')

const categoryService = {
  getCategories: async () => await Category.find({}),

  getCategoryNames: async () => await Category.find({}, { name: 1, _id: 1 }),

  getCategoryById: async (id) => await Category.find({ _id: ObjectId(id) })
}

module.exports = categoryService
