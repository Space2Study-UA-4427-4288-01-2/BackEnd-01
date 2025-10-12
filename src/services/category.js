const Category = require('~/models/category')

const categoryService = {
  getCategoryNames: async () => await Category.find({}, { name: 1, _id: 1 }),
}

module.exports = categoryService
