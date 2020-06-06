const crypto = require('crypto');
const User = require('./../models/userModel');
const sendEmail = require('./../utils/email');

exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    const token = newUser.createJWT();
    return res.status(201).json({
      status: 'success',
      token: token,
    });
  } catch (err) {
    return res.status(400).json({
      status: 'failure',
      message: err.message,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user email and password is defined or not
    if (!email || !password) {
      throw new Error('Please provide email and password.');
    }

    // 2. Check if user exists and the password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.checkPassword(password))) {
      throw new Error('Incorrect email or password!');
    }

    // 3. If everything is okay send JWT
    const token = user.createJWT();

    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    return res.status(400).json({
      status: 'failure',
      message: err.message,
    });
  }
};

exports.protectRoute = async (req, res, next) => {
  try {
    let token;

    // 1. Check if token is in correct format
    // Authorization : Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split('')[1];
    }

    if (!token) {
      throw new Error('You are not logged in!');
    }

    // 2. Check if JWT is valid or not
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if the user belonging to the token exists or not
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw new Error('The user belonging to this token does not exists.');
    }

    // 4. Check if user has changed his password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      throw new Error('Your password has been changed. Login Again.');
    }

    // saving the user and calling next middleware
    // in the route handler
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: err.message,
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.body.role)) {
      res.status(400).json({
        status: 'failure',
        message: 'You dont have the permission to perform this action.',
      });
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  try {
    // 1. get user based on the email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      throw new Error('There is no user with that email.');
    }
    // 2. genereate a random password reset token
    const resetToken = user.createPasswordResetToken();
    // 2b. saving the document since we made some changes
    //     in the previous instance method
    await user.save({ validateBeforeSave: false });
    // 3. send the reset token to the email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `To reset your password click this link ${resetURL}. This link will expire in 10 minutes. If you didnt made this request then please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset for NotesApp',
        message: message,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token send to email.',
      });
    } catch (err) {
      // in case the email is not send we have to unset the
      // required fields and let the client know

      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500).json({
        status: 'error',
        message: 'There was a error sending the email. Try again later.',
      });
    }
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1. get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2. if token has not expired, and there is user, set the new password
    if (!user) {
      throw new Error('Token is invalid or has expired!');
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 4. Log the user in, send JWT

    const token = user.createJWT();

    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {}
};
