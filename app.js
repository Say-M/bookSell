//Requiring npm
const express = require('express')
const app = express()
const ejs = require('ejs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const fileUpload = require('express-fileupload')
const { v4: uuidv4 } = require('uuid')
const _ = require('lodash')
const e = require('express')
//Creating static folder
app.use(express.static(__dirname + '/public'))

//File upload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: __dirname + '/public/tmp/',
  })
)

//body Parser
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
)

//Setting view engine
app.set('view engine', 'ejs')

//--------------Mongodb functionalities with Mongoose-------------------
//Mongodb connection
mongoose.connect('mongodb://localhost:27017/bookDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

//--------------------Mongoose Schema----------------

//book schema
const bookSchema = new mongoose.Schema({
  book_title: {
    type: String,
    required: true,
  },
  book_price: {
    type: Number,
    required: true,
  },
  book_discount: Number,
  book_category: {
    type: String,
    required: true,
  },
  book_description: {
    type: String,
    required: true,
  },
  book_featured_image: {
    type: String,
    required: true,
  },
})
const Book = mongoose.model('Libary', bookSchema)

//Category Schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
})
const NewCategory = mongoose.model('Category', categorySchema)

//Handaling get method
app.get('/', (req, res) => {
  Book.countDocuments({}, (err, count) => {
    if (err) {
      console.log(err)
    } else {
      const page = Number(req.query.page) || 1
      const postLimit = Number(req.query.limit) || 12
      const postSkip = Number(page * postLimit - postLimit)
      const totalPost = count
      const totalPage = totalPost / postLimit
      Book.find(
        {},
        null,
        {
          skip: postSkip,
          limit: postLimit,
        },
        (err, booklists) => {
          if (err) {
            console.log(err)
          } else {
            if (booklists) {
              res.render('index', {
                bookLists: booklists,
                count: totalPost,
                limit: postLimit,
                page: totalPage,
                current: page,
              })
            } else {
              res.render('index', {
                bookLists: false,
                count: totalPost,
                limit: postLimit,
                page: totalPage,
                current: page,
              })
            }
          }
        }
      )
    }
  })
})
app.get('/books', (req, res) => {
  Book.find((err, bookItems) => {
    if (err) {
      console.log(err)
    } else {
      if (bookItems.length > 0) {
        res.render('book_list', {
          bookItems: bookItems,
          category: false,
        })
      } else {
        res.render('book_list', {
          bookItems: false,
          category: false,
        })
      }
    }
  })
})
app.get('/addbook', (req, res) => {
  NewCategory.find({})
    .sort({
      name: 'asc',
    })
    .exec((err, categories) => {
      if (err) {
        console.log(err)
      } else {
        res.render('addbook', {
          title: '',
          price: '',
          discount: '',
          description: '',
          categories: categories,
          categoryErr: '',
          imgErr: '',
        })
      }
    })
})

app.get('/single_book/:book_id/:book_title', (req, res) => {
  const bookId = req.params.book_id
  Book.findById(bookId, (err, bookInfo) => {
    if (err) {
      console.log(err)
    } else {
      if (bookInfo) {
        NewCategory.find({})
          .sort({
            name: 'asc',
          })
          .exec((err, categories) => {
            if (err) {
              console.log(err)
            } else {
              res.render('single_book', {
                bookInfo: bookInfo,
                categories: categories,
              })
            }
          })
      } else {
        NewCategory.find({})
          .sort({
            name: 'asc',
          })
          .exec((err, categories) => {
            if (err) {
              console.log(err)
            } else {
              res.render('single_book', {
                bookInfo: bookInfo,
                categories: categories,
              })
            }
          })
      }
    }
  })
})

app.get('/category/:cat_id/:cat_name', (req, res) => {
  const catId = req.params.cat_id
  const catName = _.startCase(req.params.cat_name)
  NewCategory.findOne(
    {
      _id: catId,
      name: catName,
    },
    (err, catItem) => {
      if (err) {
        console.log(err)
      } else {
        Book.find(
          {
            book_category: catItem.name,
          },
          (err, bookItems) => {
            if (err) {
              console.log(err)
            } else {
              if (bookItems.length > 0) {
                res.render('book_list', {
                  bookItems: bookItems,
                  category: catItem.name,
                })
              } else {
                res.render('book_list', {
                  bookItems: false,
                  category: catItem.name,
                })
              }
            }
          }
        )
      }
    }
  )
})

//Handerling post method
app.post('/addbook', (req, res) => {
  const title = req.body.title
  const price = req.body.price
  const discount = req.body.discount
  const category = req.body.category
  const description = req.body.description
  const featuredImage = req.files.featuredImage
  if (
    featuredImage.mimetype === 'image/jpg' ||
    featuredImage.mimetype === 'image/jpeg' ||
    (featuredImage.mimetype === 'image/png' && featuredImage.size <= 3145728)
  ) {
    const uniqueId = uuidv4()
    featuredImage.mv(
      __dirname + `/public/content/ID-${uniqueId}-IMG-${featuredImage.name}`,
      (err) => {
        if (err) {
          console.log(err)
        } else {
          const addBook = new Book({
            book_title: title,
            book_price: price,
            book_discount: discount,
            book_category: category,
            book_description: description,
            book_featured_image: `/content/ID-${uniqueId}-IMG-${featuredImage.name}`,
          })
          addBook.save((err) => {
            if (err) {
              console.log(err)
            } else {
              res.redirect('/')
            }
          })
        }
      }
    )
  } else {
    NewCategory.find({})
      .sort({
        name: 'asc',
      })
      .exec((err, categories) => {
        if (err) {
          console.log(err)
        } else {
          res.render('addbook', {
            title: title,
            price: price,
            discount: discount,
            description: description,
            categories: categories,
            categoryErr: '',
            imgErr:
              'Only support PNG, JPG, JPEG types format and less then 3 MB images',
          })
        }
      })
  }
})

app.post('/createCategory', (req, res) => {
  const catName = _.startCase(req.body.createCat)
  const createNewCat = new NewCategory({
    name: catName,
  })
  NewCategory.find(
    {
      name: catName,
    },
    (err, results) => {
      if (err) {
        console.log(err)
      } else {
        if (results.length > 0) {
          NewCategory.find({}, (err, categories) => {
            res.render('addbook', {
              title: '',
              price: '',
              discount: '',
              description: '',
              categories: categories,
              categoryErr: 'This category name is already created',
              imgErr: '',
            })
          })
        } else {
          createNewCat.save((err) => {
            if (err) {
              console.log(err)
            } else {
              res.redirect('/addbook')
            }
          })
        }
      }
    }
  )
})

//Setting server
app.listen(3000, (req, res) => {
  console.log('Server is running on port http://localhost:3000')
})
