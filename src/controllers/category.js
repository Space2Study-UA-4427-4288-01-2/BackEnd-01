const categoryService = require('~/services/category')
const getMatchOptions = require('~/utils/getMatchOptions')
const getSortOptions = require('~/utils/getSortOptions')
const getRegex = require('~/utils/getRegex')
const { createBadRequestError } = require('~/utils/errorsHelper')

const getCategories = async (req, res) => {
  const { name, skip, limit, sort } = req.query

  if (skip && Number.isNaN(Number(skip))) {
    throw createBadRequestError('skip must be a number')
  }
  if (limit && Number.isNaN(Number(limit))) {
    throw createBadRequestError('limit must be a number')
  }
  if (sort && typeof sort !== 'string') {
    throw createBadRequestError('sort must be a string')
  }
  if (name && typeof name !== 'string') {
    throw createBadRequestError('name must be a string')
  }

  const match = getMatchOptions({ name: getRegex(name) })
  const sortOptions = getSortOptions(sort)

  const skipNum = skip ? parseInt(skip, 10) : null
  const limitNum = limit ? parseInt(limit, 10) : null

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
