const subjectService = require('~/services/subject')
const getMatchOptions = require('~/utils/getMatchOptions')
const getSortOptions = require('~/utils/getSortOptions')
const getRegex = require('~/utils/getRegex')

async function getSubjects(req, res) {
  const categoryId = req.params?.categoryId || req.query?.categoryId
  const { name, skip, limit, sort } = req.query
  const { createBadRequestError } = require('~/utils/errorsHelper')

  if ((skip && Number.isNaN(Number(skip))) || (limit && Number.isNaN(Number(limit)))) {
    throw createBadRequestError()
  }

  if (sort && typeof sort !== 'string') {
    throw createBadRequestError()
  }

  if (name && typeof name !== 'string') {
    throw createBadRequestError()
  }

  if (categoryId && typeof categoryId !== 'string') {
    throw createBadRequestError()
  }

  const match = getMatchOptions({ category: categoryId, name: getRegex(name) })
  const sortOptions = getSortOptions(sort)

  const pageNum = skip ? parseInt(skip, 10) : undefined
  const limitNum = limit ? parseInt(limit, 10) : undefined

  const resources = await subjectService.getSubjects(match, sortOptions, pageNum, limitNum)

  res.status(200).json(resources)
}

async function getSubjectsNames(req, res) {
  const categoryId = req.params?.categoryId || req.query?.categoryId

  const match = getMatchOptions({ category: categoryId })
  const items = await subjectService.getSubjectsNames(match)

  res.status(200).json(items)
}

module.exports = {
  getSubjects,
  getSubjectsNames
}
