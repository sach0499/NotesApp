const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const userRouter = require('./routers/userRouter');

// initializing express
const app = express();

//view engine

app.set("view engine","ejs");

// loading the environment vars
dotenv.config({ path: './config.env' });

//connecting the database
const DB = "mongodb://localhost:27017/notesapp";

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

//public folder
app.use(express.static(__dirname + "/public"));

// request body parser
app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({extended: true}));

// Serving Static Files
app.use(express.static(`${__dirname}/public`));

// routers
app.get('/', (req, res) => res.render("landingPage"));
app.use('/api/v1/users', userRouter);



const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log('Yeah, server is connected!');
});
