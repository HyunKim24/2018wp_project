const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  competition: { type: Schema.Types.ObjectId, ref: 'Competition' },
  createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});
var DisLikeLog = mongoose.model('DisLikeLog', schema);

module.exports = DisLikeLog;