const { Schema, model } = require('mongoose')

const { ATTACHMENT, RESOURCES_CATEGORY } = require('~/consts/models')

const attachmentSchema = new Schema(
  {
    fileName: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    size: { type: Number, required: true, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: RESOURCES_CATEGORY, required: true }
  },
  { timestamps: true, versionKey: false }
)

module.exports = model(ATTACHMENT, attachmentSchema)
