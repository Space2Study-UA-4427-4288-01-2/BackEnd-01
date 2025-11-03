const categoryService = require('~/services/category')
const getMatchOptions = require('~/utils/getMatchOptions')
const getSortOptions = require('~/utils/getSortOptions')
const getRegex = require('~/utils/getRegex')
const { createBadRequestError } = require('~/utils/errorsHelper')

const getCategories = async (req, res) => {
  const { name, skip, limit, sort } = req.query

  if (skip !== undefined && (Number.isNaN(Number(skip)) || Number(skip) < 0)) {
    throw createBadRequestError()
  }
  if (limit !== undefined && (Number.isNaN(Number(limit)) || Number(limit) < 1)) {
    throw createBadRequestError()
  }
  if (sort !== undefined) {
    try {
      JSON.parse(sort)
    } catch {
      throw createBadRequestError()
    }
  }

  const match = getMatchOptions({ name: name ? getRegex(name) : undefined })
  const sortOptions = getSortOptions(sort)

  const skipNum = skip ? Number(skip) : null
  const limitNum = limit ? Number(limit) : null

  const categories = await categoryService.getCategories(match, sortOptions, skipNum, limitNum)

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
  getCategoryById
}
