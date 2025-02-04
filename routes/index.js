const express = require('express')
const router = express.Router()
const { ensureAuth, ensureGuest, ensureAdmin, ensureAdminOrWorker } = require('../middleware/auth')

const User = require('../models/User')

const News = require('../models/News')
const Worker = require('../models/Worker')



// @desc    Login/Landing page
// @route   GET /login
router.get('/login', ensureGuest, (req, res) => {
  res.render('login', {
    layout: 'login',
  })
})


// @desc    home
// @route   GET /home
router.get('/', async (req, res) => {
  try {
    res.render('home/index')
    console.log("You are in / Page !");
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// @desc    home
// @route   GET /home
router.get('/home', async (req, res) => {
  try {
    res.render('home/index')
    console.log("You are in /home Page !");
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})


// @desc    homeadmin
// @route   GET /homeadmin
router.get('/homeadmin', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    res.render('homeadmin', {
      layout: 'homeadmin',
    })
    console.log("You are in /homeAdmin Page !");
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})


// @desc    homeworker
// @route   GET /homeworker
router.get('/homeworker', ensureAuth, ensureAdminOrWorker, async (req, res) => {
  try {
    res.render('homeworker', {
      layout: 'homeworker',
    })
    console.log("You are in /homeWorker Page !");
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})


// @desc    News
// @route   GET /news
router.get('/newspage', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const news = await News.find({ user: req.user.id }).lean()
    res.render('newspage', {
      name: req.user.firstName,
      news,
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})


module.exports = router