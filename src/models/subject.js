//TEMPORARY MODEL FOR TESTING PURPOSES

const mongoose = require('mongoose')

const SubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourcesCategory' }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Subject', SubjectSchema)
