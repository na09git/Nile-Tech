const express = require('express')
const router = express.Router()
const multer = require('multer');
const fs = require('fs');
const { ensureAuth, ensureAdmin } = require('../middleware/auth')

const Portfolio = require('../models/Portfolio')


// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploadportfolio');
    },
    filename: function (req, file, cb) {
        var ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

const upload = multer({ storage: storage });

// @desc    Show create page
// @route   GET /portfolio/create
router.get('/create', ensureAuth, ensureAdmin, (req, res) => {
    res.render('portfolio/create')
})


// @desc Process add portfolio  form with image upload
// @route POST /portfolio
router.post('/', ensureAuth, ensureAdmin, upload.single('image'), async (req, res) => {
    try {
        const file = req.file;

        if (!file || file.length === 0) {
            const error = new Error('Please choose files');
            error.httpStatusCode = 400;
            throw error;
        }

        const img = fs.readFileSync(file.path);
        const encode_image = img.toString('base64');

        const newUpload = new Portfolio({
            ...req.body,
            user: req.user.id,
            contentType: file.mimetype,
            imageBase64: encode_image,
        });

        try {
            await newUpload.save();
            res.redirect('/portfolio');
            console.log("New portfolio with image/upload is Successfully  Broadcasted !");

        } catch (error) {
            if (error.name === 'MongoError' && error.code === 11000) {
                return res.status(400).json({ error: `Duplicate ${file.originalname}. File Already exists! ` });
            }
            return res.status(500).json({ error: error.message || `Cannot Upload ${file.originalname} Something Missing!` });
        }
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Internal Server Error' });
    }
});



// @desc    Show all portfolio
// @route   GET /portfolio
router.get('/', async (req, res) => {
    try {
        const portfolio = await Portfolio.find()
            .populate('user')
            .sort({ createdAt: -1 })
            .lean()

        res.render('portfolio/index', {
            portfolio,
        })
        console.log("portfolio/index rendered");
        console.log("You can now see All portfolio Here !");
    } catch (err) {
        console.error(err)
        res.render('error/500')
    }
})


// @desc    Show single portfolio
// @route   GET /portfolio/:id
router.get('/:id', async (req, res) => {
    try {
        let portfolio = await Portfolio.findById(req.params.id)
            .populate('user')
            .lean()

        res.render('portfolio/show', {
            portfolio,
        })
        console.log("You can now see the portfolio details");

    } catch (err) {
        console.error(err)
        res.render('error/404')
    }
})



// @desc    Show edit page
// @route   GET /portfolio/edit/:id
router.get('/edit/:id', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ _id: req.params.id }).lean()

        if (!portfolio) {
            return res.render('error/404')
        }

        if (portfolio.user != req.user.id) {
            res.redirect('/portfolio')
        } else {
            res.render('portfolio/edit', {
                portfolio,
            })
            console.log("You are in portfolio edit page & can Edit this portfolio");
        }
    } catch (err) {
        console.error(err)
        return res.render('error/500')
    }
})



// @desc Show Update page
// @route POST /portfolio/:id
router.post('/:id', ensureAuth, ensureAdmin, upload.single('image'), async (req, res) => {
    try {
        let portfolio = await Portfolio.findById(req.params.id).lean();

        if (!portfolio) {
            console.log('portfolio not found');
            return res.render('error/404');
        }

        if (String(portfolio.user) !== req.user.id) {
            console.log('User not authorized');
            return res.redirect('/portfolio');
        }

        const file = req.file;
        const existingImage = portfolio.imageBase64;

        let updatedFields = req.body;

        if (file) {
            const img = fs.readFileSync(file.path);
            const encode_image = img.toString('base64');
            updatedFields = {
                ...updatedFields,
                contentType: file.mimetype,
                imageBase64: encode_image,
            };
        } else {
            updatedFields = {
                ...updatedFields,
                contentType: portfolio.contentType,
                imageBase64: existingImage,
            };
        }

        // Use await here
        portfolio = await Portfolio.findOneAndUpdate(
            { _id: req.params.id },
            updatedFields,
            { new: true, runValidators: true }
        );

        console.log('portfolio updated successfully');
        res.redirect('/portfolio');
    } catch (err) {
        console.error(err);
        return res.render('error/500');
    }
});




// @desc    Delete portfolio
// @route   DELETE /portfolio/:id
router.delete('/:id', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        let portfolio = await Portfolio.findById(req.params.id).lean()

        if (!portfolio) {
            return res.render('error/404')
        }

        if (portfolio.user != req.user.id) {
            res.redirect('/portfoliopage')
        } else {
            await Portfolio.deleteOne({ _id: req.params.id })
            res.redirect('/portfoliopage')
        }
        console.log("portfolio Deleted Successfully !");

    } catch (err) {
        console.error(err)
        return res.render('error/500')
    }
})


// @desc    User portfolio
// @route   GET /portfolio/user/:userId
router.get('/user/:userId', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const portfolio = await Portfolio.find({ user: req.params.userId, })
            .populate('user')
            .lean()

        res.render('portfolio/index', {
            portfolio,
        })
    } catch (err) {
        console.error(err)
        res.render('error/500')
    }
})

//@desc Search portfolio by title
//@route GET /portfolio/search/:query
router.get('/search/:query', async (req, res) => {
    try {
        const portfolio = await Portfolio.find({ title: new RegExp(req.query.query, 'i'), })
            .populate('user')
            .sort({ createdAt: 'desc' })
            .lean()
        res.render('portfolio/index', {
            portfolio,
        })
        console.log("Search is working !");
    } catch (err) {
        console.log(err)
        res.render('error/404')
    }
})


module.exports = router
