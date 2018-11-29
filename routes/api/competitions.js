const express = require('express');
const Competition = require('../../models/competition');
const catchErrors = require('../../lib/async-error');

const router = express.Router();

// Index
router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const competitions = await Competition.paginate({}, {
    sort: {createdAt: -1}, 
    populate: 'author',
    page: page, limit: limit
  });
  res.json({competitions: competitions.docs, page: competitions.page, pages: competitions.pages});   
}));

// Read
router.get('/:id', catchErrors(async (req, res, next) => {
  const competition = await Competition.findById(req.params.id).populate('author');
  res.json(competition);
}));

// Create
router.post('', catchErrors(async (req, res, next) => {
  var competition = new Competition({

    title: req.body.title,
    author: req.user._id,
    content: req.body.content,
    tags: req.body.tags.map(e => e.trim()),
    img : req.body.img,
    sponsor : req.body.sponsor,
    who : req.body.who,
    date : req.body.date,
    master : req.body.master,
    call : req.body.call

  });
  await competition.save();
  res.json(competition)
}));

// Put
router.put('/:id', catchErrors(async (req, res, next) => {
  const competition = await Competition.findById(req.params.id);
  if (!competition) {
    return next({status: 404, msg: 'Not exist competition'});
  }
  if (competition.author && competition.author._id != req.user._id) {
    return next({status: 403, msg: 'Cannot update'});
  }
  competition.title = req.body.title;
  competition.content = req.body.content;
  competition.author = req.user._id;
  competition.tags = req.body.tags;
  competition.img = req.body.img;
  competition.sponsor = req.body.sponsor;
  competition.who = req.body.who;
  competition.date = req.body.date;
  competition.master = req.body.master;
  competition.call = req.body.call;
  await competition.save();
  res.json(competition);
}));

// Delete
router.delete('/:id', catchErrors(async (req, res, next) => {
  const competition = await Competition.findById(req.params.id);
  if (!competition) {
    return next({status: 404, msg: '등록된 공모전이 없습니다.'});
  }
  if (competition.author && competition.author._id != req.user._id) {
    return next({status: 403, msg: '업데이트 할수 없습니다.'});
  }
  await Competition.findOneAndRemove({_id: req.params.id});
  res.json({msg: '삭제되었습니다.'});
}));


module.exports = router;