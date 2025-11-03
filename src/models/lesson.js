const { Schema, model } = require('mongoose')

const { LESSON, ATTACHMENT, CATEGORY } = require('~/consts/models')

const lessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: ATTACHMENT }],
    category: { type: Schema.Types.ObjectId, ref: CATEGORY, required: true }
  },
  { timestamps: true, versionKey: false }
)

module.exports = model(LESSON, lessonSchema)
