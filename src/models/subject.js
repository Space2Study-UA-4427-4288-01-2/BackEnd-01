const mongoose = require('mongoose')

const SubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    totalOffers: {
      student: { type: Number, default: 0, min: 0 },
      tutor: { type: Number, default: 0, min: 0 }
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Subject', SubjectSchema)
