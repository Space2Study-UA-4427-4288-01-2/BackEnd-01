const subjectService = require('~/services/subject')
const getMatchOptions = require('~/utils/getMatchOptions')
const getSortOptions = require('~/utils/getSortOptions')
const getRegex = require('~/utils/getRegex')
const { createBadRequestError } = require('~/utils/errorsHelper')

async function getSubjects(req, res) {
  const categoryId = req.query?.categoryId
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
  if (categoryId && typeof categoryId !== 'string') {
    throw createBadRequestError('categoryId must be a string')
  }

  const match = getMatchOptions({ category: categoryId, name: getRegex(name) })
  const sortOptions = getSortOptions(sort)

  const skipNum = skip ? parseInt(skip, 10) : null
  const limitNum = limit ? parseInt(limit, 10) : null

  const resources = await subjectService.getSubjects(match, sortOptions, skipNum, limitNum)

  res.status(200).json(resources)
}

async function getSubjectsNames(req, res) {
  const categoryId = req.query?.categoryId

  if (categoryId && typeof categoryId !== 'string') {
    throw createBadRequestError('categoryId must be a string')
  }

  const match = getMatchOptions({ category: categoryId })
  const items = await subjectService.getSubjectsNames(match)

  res.status(200).json(items)
}

module.exports = {
  getSubjects,
  getSubjectsNames
}
