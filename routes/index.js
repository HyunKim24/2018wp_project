var express = require('express');
var router = express.Router();
var competition = require('../models/competition');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/', function(req, res, next) {
  const competition = competition.find({}, function(err, competitions) {
    if (err) {
      return next(err);
    }
    res.render('index', {competitions: competition});
  });
});

module.exports = router;
