const { Schema, model } = require('mongoose')

const { CATEGORY } = require('~/consts/models')
const { FIELD_CANNOT_BE_EMPTY, FIELD_CANNOT_BE_SHORTER } = require('~/consts/errors')

const categorySchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, FIELD_CANNOT_BE_EMPTY('name')],
      minLength: [1, FIELD_CANNOT_BE_SHORTER('name', 2)],
    },
    appearance: {
      icon: {
        type: String,
        default: 'mocked-path-to-icon',
      },
      color: {
        type: String,
        default: '#66C42C',
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

module.exports = model(CATEGORY, categorySchema)
