const categoryService = require('~/services/category')

const getCategories = async (req, res) => {
  const categories = await categoryService.getCategories()

  res.status(200).json(categories)
}

const getCategoryNames = async (req, res) => {
  const categoryNames = await categoryService.getCategoryNames()

  res.status(200).json(categoryNames)
}

const getCategoryById = async (req, res) => {
  const { id } = req.params

  const categoryById = await categoryService.getCategoryById(id)

  res.status(200).json(categoryById)
}

module.exports = {
  getCategories,
  getCategoryNames,
  getCategoryById,
}
