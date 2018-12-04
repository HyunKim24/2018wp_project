const express = require('express');
const Competition = require('../models/competition');
const User = require('../models/user'); 
const Answer = require('../models/answer'); 
const catchErrors = require('../lib/async-error');

// 새로 추가된 패키지
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

module.exports = io => {
  const router = express.Router();
  
  // 동일한 코드가 users.js에도 있습니다. 이것은 나중에 수정합시다.
  function needAuth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash('danger', '먼저 로그인을 해주세요.');
      res.redirect('/signin');
    }
  }

  /* GET competitions listing. */
  router.get('/', catchErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    var query = {};
    const term = req.query.term;
    if (term) {
      query = {$or: [
        {title: {'$regex': term, '$options': 'i'}},
        {content: {'$regex': term, '$options': 'i'}}
      ]};
    }
    const competitions = await Competition.paginate(query, {
      sort: {createdAt: -1}, 
      populate: 'author', 
      page: page, limit: limit
    });
    res.render('competitions/index', {competitions: competitions, term: term, query: req.query});
  }));

  router.get('/new', needAuth, (req, res, next) => {
    res.render('competitions/new', {competition: {}});
  });

  router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
    const competition = await Competition.findById(req.params.id);
    res.render('competitions/edit', {competition: competition});
  }));

  router.get('/:id', catchErrors(async (req, res, next) => {
    const competition = await Competition.findById(req.params.id).populate('author');
    const answers = await Answer.find({competition: competition.id}).populate('author');
    competition.numReads++;    // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록???

    await competition.save();
    res.render('competitions/show', {competition: competition, answers: answers});
  }));

  router.put('/:id', catchErrors(async (req, res, next) => {
    const competition = await Competition.findById(req.params.id);

    if (!competition) {
      req.flash('danger', '등록된 공모전이 없습니다.');
      return res.redirect('back');
    }
    competition.title = req.body.title;
    competition.content = req.body.content;
    competition.author= req.user._id;
    competition.tags = req.body.tags.split(" ").map(e => e.trim());
    competition.img = req.body.img;
    competition.sponsor= req.body.sponsor;
    competition.who= req.body.who;
    competition.date= req.body.date;
    competition.master= req.body.master;
    competition.call = req.body.call;

    await competition.save();
    req.flash('success', '성공적으로 업데이트 되었습니다.');
    res.redirect('/competitions');
  }));

  router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
    await Competition.findOneAndRemove({_id: req.params.id});
    req.flash('success', '성공적으로 삭제되었습니다.');
    res.redirect('/competitions');
  }));


  const mimetypes = {
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/png": "png"
  };
  const upload = multer({
    dest: 'tmp', 
    fileFilter: (req, file, cb) => {
      var ext = mimetypes[file.mimetype];
      if (!ext) {
        return cb(new Error('오직 이미지 파일만 등록 가능합니다.(jpg,gif,png)'), false);
      }
      cb(null, true);
    }
  }); // tmp라는 폴더를 미리 만들고 해야 함.

  router.post('/', needAuth, 
        upload.single('img'), // img라는 필드를 req.file로 저장함.
        catchErrors(async (req, res, next) => {
    var competition = new Competition({
      title: req.body.title,
      author: req.user._id,
      content: req.body.content,
      call: req.body.call,
      tags: req.body.tags.split(" ").map(e => e.trim()),
      sponsor: req.body.sponsor,
      who: req.body.who,
      date: req.body.date,
      master: req.body.master
    });
    if (req.file) {
      const dest = path.join(__dirname, '../public/images/uploads/');  // 옮길 디렉토리
      console.log("File ->", req.file); // multer의 output이 어떤 형태인지 보자.
      const filename = competition.id + "/" + req.file.originalname;
      await fs.move(req.file.path, dest + filename);
      competition.img = "/images/uploads/" + filename;
    }
    await competition.save();
    req.flash('success', '성공적으로 등록되었습니다.');
    res.redirect('/competitions');
  }));

  router.post('/:id', catchErrors(async (req, res, next) => {
    const competition = await Competition.findById(req.params.id);

    if (!competition) {
      req.flash('danger', 'Not exist question');
      return res.redirect('back');
    }
    competition.title= req.body.title;
    // competition.author= req.user._id,
    competition.content= req.body.content;
    competition.call= req.body.call;
    competition.tags= req.body.tags.split(" ").map(e => e.trim());
    competition.sponsor= req.body.sponsor;
    competition.who= req.body.who;
    competition.date= req.body.date;
    competition.master=req.body.master;

    if (req.file) {
      const dest = path.join(__dirname, '../public/images/uploads/');  // 옮길 디렉토리
      console.log("File ->", req.file); // multer의 output이 어떤 형태인지 보자.
      const filename = competition.id + "/" + req.file.originalname;
      await fs.move(req.file.path, dest + filename);
      competition.img = "/images/uploads/" + filename;
    }
    await competition.save();
    req.flash('success', '성공적으로 수정되었습니다.');
    res.redirect('/competitions');
  }));

  router.post('/:id/answers', needAuth, catchErrors(async (req, res, next) => {
    const user = req.user;
    const competition = await Competition.findById(req.params.id);

    if (!competition) {
      req.flash('danger', '등록된 공모전이 없습니다.');
      return res.redirect('back');
    }

    var answer = new Answer({
      author: user._id,
      competition: competition._id,
      content: req.body.content
    });
    await answer.save();
    competition.numAnswers++;
    await competition.save();

    const url = `/competitions/${competition._id}#${answer._id}`;
    // io.to(competition.author.toString())
    //   .emit('answered', {url: url, competition: competition});
    // console.log('SOCKET EMIT', competition.author.toString(), 'answered', {url: url, competition: competition})
    req.flash('success', '댓글이 성공적으로 등록되었습니다.');
    res.redirect(`/competitions/${competition._id}`);
  }));

  return router;
};
