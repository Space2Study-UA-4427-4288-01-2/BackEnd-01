const categoryService = require('~/services/category')

const getCategoryNames = async (req, res) => {
  const categoryNames = await categoryService.getCategoryNames()

  res.status(200).json(categoryNames)
}

module.exports = {
  getCategoryNames,
}
