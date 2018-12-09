const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  title: {type: String, trim: true, required: true},
  content: {type: String, trim: true, required: true},
  tags: [String],
  sponsor: {type: String, trim: true, required: true},
  who: {type: String, trim: true, required: true},
  date: {type: String, trim: true, required: true},
  master: {type: String, trim: true, required: true},
  call: {type: String, trim: true, required: true},
  numLikes: {type: Number, default: 0},
  numdisLikes: {type: Number, default: 0},
  numAnswers: {type: Number, default: 0},
  numReads: {type: Number, default: 0},
  img: {type: String},  // 이미지의 path를 저장하기 위해 추가
  createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});
schema.plugin(mongoosePaginate);
var Competition = mongoose.model('competition', schema);

module.exports = Competition;
