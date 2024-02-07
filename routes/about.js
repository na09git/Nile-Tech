const express = require('express')
const router = express.Router()

// @route   GET contact
router.get('/', (req, res) => {
    try {
        res.render('about/index')
    } catch (err) {
        console.error(err)
        res.render('error/500')
    }
})

module.exports = router