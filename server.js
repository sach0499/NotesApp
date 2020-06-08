const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const cloudinary = require('cloudinary').v2;

const userRouter = require('./routers/userRouter');

//models
const User = require('./models/userModel');
const Comment = require('./models/comments');
const Book = require('./models/book');
const Notes = require('./models/notes');

// initializing express
const app = express();

//view engine

app.set('view engine', 'ejs');

// loading the environment vars
dotenv.config({ path: './config.env' });

//connecting the database
const DB = 'mongodb://localhost:27017/notesapp';

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connnection successful.'));

// middlewares

// development logger
app.use(morgan('dev'));

//express-session
app.use(
  require('express-session')({
    secret: 'Blah Blah',
    resave: true,
    saveUninitialized: true
  })
);

//public folder
app.use(express.static(__dirname + '/public'));

// request body parser
app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serving Static Files
app.use(express.static(`${__dirname}/public`));

//hjghjvhj
app.use(methodOverride('_method'));

app.use(flash());

//momment js
app.locals.moment = require('moment');

//middle ware
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

//multer set up
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

// image and pdf filter
var imageFilter = function(req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter });
//cloudinary set up
cloudinary.config({
  cloud_name: 'ddlxlne6k',
  api_key: '773777794947995',
  api_secret: '8vOPCNy496bfbxWAOxBh6jauPE4'
});

// routers
app.get('/', (req, res) => res.render('landingPage'));
app.use('/api/v1/users', userRouter);

//creating routes for different purposes

//add book routes
app.post('/addbook', upload.array('images', 6), async function(req, res) {
  try {
    var filePaths = req.files.map(file => file.path);
    var upload_res = new Array();

    let multipleUpload = new Promise(async (resolve, reject) => {
      let upload_len = filePaths.length;

      for (let i = 0; i <= upload_len + 1; i++) {
        let filePath = filePaths[i];
        await cloudinary.uploader.upload(filePath, (error, result) => {
          if (upload_res.length === upload_len) {
            /* resolve promise after upload is complete */
            resolve(upload_res);
          } else if (result) {
            /*push public_ids in an array */

            upload_res.push(result.secure_url);
          } else if (error) {
            console.log(error);
            reject(error);
            res.send(JSON.stringify(err));
          }
        });
      }
    })
      .then(result => result)
      .catch(error => {
        console.log('That did not go well.');
        res.redirect('/');
      });

    /*waits until promise is resolved before sending back response to user*/
    let upload = await multipleUpload;
    // res.json({'response':upload});

    let book=req.body.book;
    book.author={
      id:req.user._id,
      username:req.user.name
    }

    Book.create(book, function(err, book) {
      if (err) {
        console.log(err);
        res.json({ response: err });
      } else {
        upload.forEach(function(u) {
          book.photos.push(u);
        });
        book.save();
        console.log(book);
      }
    });

    res.status(200).json({
      status: 'success',
      message:"created",
    });

  } 
  catch (error) {
    return res.status(400).json({
      status: 'failure',
      message: err.message,
    });
  }
});

// creating comment route for book

app.post("/book/:id/comment",function(req,res){

  Book.findById(req.params.id,function(err,book){
    if(err)
    {
      return res.status(400).json({
        status: 'failure',
        message: err.message,
      });
    }
    else
    {
      Comment.create(req.body.comment,function(err,comm){
        if(err)
        {
          return res.status(400).json({
            status: 'failure',
            message: err.message,
          });
        }

        else
        {
          comment.author.id = req.user._id;
					comment.author.username = req.user.name;
					//save comment
          comment.save();
          book.reviews.push(comment);
          book.save();
          console.log("Book "+book);
        }
      });
    }
  });
});

//deleting book

app.delete("/book/:id",function(req,res){

  Book.findByIdAndRemove(req.params.id,function(err,book){
    if(err){
      return res.status(400).json({
        status: 'failure',
        message: err.message,
      });
		}
		else{
			return res.status(200).json({
        status: 'success',
        message: 'Done',
      });
		}
  });

});

//reviews delete route for book

app.delete("/book/:id/comments/:comment_id",function(req, res){
	
	Comment.findByIdAndRemove(req.params.comment_id, function(err,comment){
		if(err){
			return res.status(400).json({
        status: 'failure',
        message: err.message,
      });
		} else{
      return res.status(200).json({
        status: 'success',
        message: 'Done',
      });
		}
	
});
});

//==========Notes Routes=================

//add notes routes 

app.post("/addnotes",upload.single("file"), function(req,res){

  let note=req.body.note;
    note.author={
      id:req.user._id,
      username:req.user.name
    }
  cloudinary.uploader.upload(req.file.path, function(err,result) {
   
    note.fileLink=result.secure_url;
    Notes.create(note,function(err,note){
      if(err)
      {
        console.log(err);
        return res.status(400).json({
          status: 'failure',
          message: err.message,
        });
      }
      else
      {
        console.log(note);
        return res.status(200).json({
          status: 'success',
          message: "Done"
        });
      }
    });
  });
});

// creating comment route for notes

app.post("/notes/:id/comment",function(req,res){

  Notes.findById(req.params.id,function(err,book){
    if(err)
    {
      return res.status(400).json({
        status: 'failure',
        message: err.message,
      });
    }
    else
    {
      Comment.create(req.body.comment,function(err,comm){
        if(err)
        {
          return res.status(400).json({
            status: 'failure',
            message: err.message,
          });
        }

        else
        {
          comment.author.id = req.user._id;
					comment.author.username = req.user.name;
					//save comment
          comment.save();
          book.reviews.push(comment);
          book.save();
          console.log("Notes "+book);
        }
      });
    }
  });
});

//deleting Notes

app.delete("/book/:id",function(req,res){

  Notes.findByIdAndRemove(req.params.id,function(err,book){
    if(err){
      return res.status(400).json({
        status: 'failure',
        message: err.message,
      });
		}
		else{
			return res.status(200).json({
        status: 'success',
        message: 'Done',
      });
		}
  });

});

//reviews delete route for notes

app.delete("/notes/:id/comments/:comment_id",function(req, res){
	
	Comment.findByIdAndRemove(req.params.comment_id, function(err,comment){
		if(err){
			return res.status(400).json({
        status: 'failure',
        message: err.message,
      });
		} else{
      return res.status(200).json({
        status: 'success',
        message: 'Done',
      });
		}
	
});
});

const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log('Yeah, server is connected!');
});
