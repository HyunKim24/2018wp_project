const express = require('express');
const User = require('../models/user');
const router = express.Router();
const catchErrors = require('../lib/async-error');

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', '먼저 로그인을 해주세요.');
    res.redirect('/signin');
  }
}

function validateForm(form, options) {
  var name = form.name || "";
  var email = form.email || "";
  name = name.trim();
  email = email.trim();

  if (!name) {
    return '사용자 이름은 필수입니다.';
  }

  if (!email) {
    return '이메일은 필수입니다..';
  }

  if (!form.password && options.needPassword) {
    return '패스워드는 필수입니다.';
  }

  if (form.password !== form.password_confirmation) {
    return '패스워드가 일치하지 않습니다.';
  }

  if (form.password.length < 6) {
    return '패스워드는 반드시 6자리 이상이어야 합니다.';
  }

  return null;
}

router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  if (term) {
    query = {$or: [
      {name: {'$regex': term, '$options': 'i'}},
      {email: {'$regex': term, '$options': 'i'}},
    ]};
  }
  const users = await User.find(query, {});
  res.render('users/index', {users: users, term: term, query: req.query});
}));

router.get('/new', (req, res, next) => {
  res.render('users/new', {messages: req.flash()});
});


router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.render('users/edit', {user: user});
}));

router.put('/:id', needAuth, catchErrors(async (req, res, next) => {
  const err = validateForm(req.body);
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }

  const user = await User.findById({_id: req.params.id});
  if (!user) {
    req.flash('danger', '사용자가 존재하지 않습니다.');
    return res.redirect('back');
  }

  if (!await user.validatePassword(req.body.current_password)) {
    req.flash('danger', '현재 패스워드가 틀립니다.');
    return res.redirect('back');
  }

  user.name = req.body.name;
  user.email = req.body.email;
  if (req.body.password) {
    user.password = await user.generateHash(req.body.password);
  }
  await user.save();
  req.flash('success', '업데이트 되었습니다.');
  res.redirect('/');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  const user = await User.findOneAndRemove({_id: req.params.id});
  req.flash('success', '삭제 되었습니다.');
  res.redirect('/');
}));

router.get('/:id', catchErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.render('users/show', {user: user});
}));

router.post('/', catchErrors(async (req, res, next) => {
  var err = validateForm(req.body, {needPassword: true});
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }
  var user = await User.findOne({email: req.body.email});
  console.log('USER???', user);
  if (user) {
    req.flash('danger', '이메일 아이디가 이미 존재합니다.');
    return res.redirect('back');
  }
  user = new User({
    name: req.body.name,
    email: req.body.email,
  });
  user.password = await user.generateHash(req.body.password);
  await user.save();
  req.flash('success', '환영합니다. 이제 로그인을 하면 다양한 기능을 사용 할 수 있습니다.');
  res.redirect('/');
}));

module.exports = router;
