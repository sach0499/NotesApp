const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');

const userRouter = require('./routers/userRouter');

// initializing express
const app = express();

// loading the environment vars
dotenv.config({ path: './config.env' });

//connecting the database
const DB = process.env.DB_LOCAL;
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

// request body parser
app.use(express.json({ limit: '10kb' }));

// Serving Static Files
app.use(express.static(`${__dirname}/public`));

// routers
app.get('/', (req, res) => res.send('Everything all right!'));
app.use('/api/v1/users', userRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Yeah, server is connected!');
});
