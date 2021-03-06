const express = require('express');
const Competition = require('../../models/competition'); 
const Answer = require('../../models/answer'); 
const LikeLog = require('../../models/like-log'); 
const DisLikeLog = require('../../models/dislike-log');
const catchErrors = require('../../lib/async-error');

const router = express.Router();

router.use(catchErrors(async (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    next({status: 401, msg: 'Unauthorized'});
  }
}));

router.use('/competitions', require('./competitions'));

// Like for competition
router.post('/competitions/:id/like', catchErrors(async (req, res, next) => {
  const competition = await Competition.findById(req.params.id);
  if (!competition) {
    return next({status: 404, msg: 'Not exist competition'});
  }
  var likeLog = await LikeLog.findOne({author: req.user._id, competition: competition._id});
  if (!likeLog) {
    competition.numLikes++;
    await Promise.all([
      competition.save(),
      LikeLog.create({author: req.user._id, competition: competition._id})
    ]);
  }
  return res.json(competition);
}));

router.post('/competitions/:id/dislike', catchErrors(async (req, res, next) => {
  const competition = await Competition.findById(req.params.id);
  if (!competition) {
    return next({status: 404, msg: 'Not exist competition'});
  }
  var dislikeLog = await DisLikeLog.findOne({author: req.user._id, competition: competition._id});
  if (!dislikeLog) {
    competition.numdisLikes++;
    await Promise.all([
      competition.save(),
      DisLikeLog.create({author: req.user._id, competition: competition._id})
    ]);
  }
  return res.json(competition);
}));

// Like for Answer
router.post('/answers/:id/like', catchErrors(async (req, res, next) => {
  const answer = await Answer.findById(req.params.id);
  answer.numLikes++;
  await answer.save();
  //answer 오브젝트를 그냥 리턴함
  return res.json(answer);
}));

router.post('/answers/:id/dislike', catchErrors(async (req, res, next) => {
  const answer = await Answer.findById(req.params.id);
  answer.numdisLikes++;
  await answer.save();
  //answer 오브젝트를 그냥 리턴함
  return res.json(answer);
}));

router.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    status: err.status,
    msg: err.msg || err
  });
});

module.exports = router;
