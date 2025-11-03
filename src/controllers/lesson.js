const mongoose = require('mongoose')
const lessonService = require('~/services/lesson')
const getMatchOptions = require('~/utils/getMatchOptions')
const getSortOptions = require('~/utils/getSortOptions')
const getRegex = require('~/utils/getRegex')
const { createBadRequestError } = require('~/utils/errorsHelper')

async function getLessons(req, res) {
  const categoryId = req.query?.categoryId
  const { title, skip, limit, sort } = req.query

  if (skip && Number.isNaN(Number(skip))) {
    throw createBadRequestError('skip must be a number')
  }
  if (limit && Number.isNaN(Number(limit))) {
    throw createBadRequestError('limit must be a number')
  }
  if (sort && typeof sort !== 'string') {
    throw createBadRequestError('sort must be a string')
  }
  if (title && typeof title !== 'string') {
    throw createBadRequestError('title must be a string')
  }
  if (categoryId) {
    if (typeof categoryId !== 'string') {
      throw createBadRequestError('categoryId must be a string')
    }
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw createBadRequestError('categoryId must be a valid ObjectId')
    }
  }

  const match = getMatchOptions({
    category: categoryId ? new mongoose.Types.ObjectId(categoryId) : undefined,
    title: getRegex(title)
  })
  const sortOptions = getSortOptions(sort)

  const skipNum = skip ? parseInt(skip, 10) : null
  const limitNum = limit ? parseInt(limit, 10) : null

  const resources = await lessonService.getLessons(match, sortOptions, skipNum, limitNum)

  res.status(200).json(resources)
}

async function getLessonById(req, res) {
  const { id } = req.params

  const lesson = await lessonService.getLessonById(id)

  res.status(200).json(lesson)
}

async function createLesson(req, res) {
  const { title, description, attachments, category } = req.body || {}

  if (!title || typeof title !== 'string') {
    throw createBadRequestError('title must be a non-empty string')
  }

  if (!category || typeof category !== 'string') {
    throw createBadRequestError('category must be a string')
  }
  if (!mongoose.Types.ObjectId.isValid(category)) {
    throw createBadRequestError('category must be a valid ObjectId')
  }

  if (attachments !== undefined) {
    if (!Array.isArray(attachments)) {
      throw createBadRequestError('attachments must be an array of ObjectIds')
    }
    for (const id of attachments) {
      if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
        throw createBadRequestError('attachments must contain valid ObjectId strings')
      }
    }
  }

  const data = { title: title.trim(), description, attachments, category }
  const created = await lessonService.createLesson(data)

  res.status(201).json(created)
}

async function updateLesson(req, res) {
  const { id } = req.params
  const { title, description, attachments, category } = req.body || {}

  const updateData = {}

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      throw createBadRequestError('title must be a non-empty string')
    }
    updateData.title = title.trim()
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      throw createBadRequestError('description must be a string')
    }
    updateData.description = description
  }

  if (category !== undefined) {
    if (typeof category !== 'string') {
      throw createBadRequestError('category must be a string')
    }
    if (!mongoose.Types.ObjectId.isValid(category)) {
      throw createBadRequestError('category must be a valid ObjectId')
    }
    updateData.category = category
  }

  if (attachments !== undefined) {
    if (!Array.isArray(attachments)) {
      throw createBadRequestError('attachments must be an array of ObjectIds')
    }
    for (const attId of attachments) {
      if (typeof attId !== 'string' || !mongoose.Types.ObjectId.isValid(attId)) {
        throw createBadRequestError('attachments must contain valid ObjectId strings')
      }
    }
    updateData.attachments = attachments
  }

  await lessonService.updateLesson(id, updateData)

  res.status(204).end()
}

async function deleteLesson(req, res) {
  const { id } = req.params

  await lessonService.deleteLesson(id)

  res.status(204).end()
}

module.exports = { getLessons, getLessonById, createLesson, updateLesson, deleteLesson }
