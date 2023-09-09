const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const Email = require('./../utils/email');

const signTokens = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signTokens(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  /////THIS CODE WILL US TO NOT ALLOWING EVERYONE TO BE AS AN ADMIN
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

///////////////////////////////LOGIN USER
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1] Check if email && password exist
  if (!email || !password) {
    return next(new appError('Please provide email and password'), 404);
  }

  // 2]Check if user exist and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('Incorrect email or password', 401));
  }
  //   3]  IF EVERYTHING IS OK THEN SEND TOKEN TO CLIENT
  createSendToken(user, 200, res);
});

//////////////LOG OUT
exports.logout = (req, res) => {
  // console.log('3 logout');
  res.cookie('jwt', 'loggeddout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

/////////////////////////////////CHECKING IF USER IS LOGIN OR NOT
exports.protect = catchAsync(async (req, res, next) => {
  //1)GETTING TOKENS AND CHEKING IF IT IS THERE
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new appError(
        'Your  are not logged in please logged in to get access',
        401
      )
    );
  }
  // console.log("THIS TOKEN IS THE PROOF OF MY IDENTITY : ",token);

  //2) VERIFICATION OF TOKENS
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)CHECK IF USER STILL EXIST
  const currentUser = await User.findById(decode.id);
  if (!currentUser) {
    return next(
      new appError('The user belongs to this token does not exist', 401)
    );
  }

  //4)CHECK IF USER CHANGED THE PASSWORD AFTER THE TOKEN WAS ISSUED
  if (currentUser.changedPasswordAfter(decode.iat)) {
    return next(
      new appError('User recently changed password,please logged in again', 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//Only for rendered pages , no errors
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) VERIFICATION OF TOKENS
      const decode = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) CHECK IF USER STILL EXIST
      const currentUser = await User.findById(decode.id);
      if (!currentUser) {
        return next();
      }

      // 3) CHECK IF USER CHANGED THE PASSWORD AFTER THE TOKEN WAS ISSUED
      if (currentUser.changedPasswordAfter(decode.iat)) {
        return next();
      }

      // console.log(currentUser)
      //  There is logged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

////////////////////////ONLY SPECIFIED USER CAN HAVE PERMISSION
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new appError('You dont have a permission to perform this action', 403)
      );
    }
    next();
  };
};

//////////////////FORGOT PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
  /////1) GET USER BASED ON POSTED EMAIL
  // const user=await User.findOne({email:req.body.email});
  // const email=req.body.email;

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new appError('There is no user with this email adress', 404));
  }

  /////2) GENERATE THE RANDOM RESET TOKEN
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  ////////3) SEND IT TO USER MAIL
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPasssword/${resetToken}`;

  const message = `Forgot your password? Submitt  a Patch request with your new Password and passwordConfirm to ${resetURL}.\nIf you dein't forgot your password please ignore this email!!`;
  try {
    // await Email({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min only)',
    //   message,
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (err) {
    console.log(err);
    user.PasswordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new appError('There was an error  sending the email.Try again later'),
      500
    );
  }
});

///////RESET PASSWORD
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) GET USER BASED ON TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  console.log('req.params.token', req.params.token);
  console.log('hashedToken', hashedToken);

  const user = await User.findOne({
    PasswordResetToken: hashedToken,
    PasswordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new appError('Token is invalid or Expires', 400));
  }
  // 2) IF THE TOKEN HAS NOT EXPIRED AND THERE IS A  USER, SET THE NEW PASSWORD

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.PasswordResetToken = undefined;
  user.PasswordResetExpires = undefined;
  await user.save();

  //3)  UPDATE CHANGE PASSWORD FOR PROPERTY

  //4) LOG THE USER IN, SEND JWT
  createSendToken(user, 200, res);
});

/////UPDATE PASSWORD WOTHOUT FORGGETING IT
//THIS FACILITY IS ONLY FOR LOGGED IN USER
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) GET USER FROM COLLECION

  const user = await User.findById(req.user.id).select('+password');

  //2) CHECK IF POSTED CURRENT PASSWORD IS CURRENT
  // console.log(req.body.passwordCurrent);

  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new appError('Your current password is wrong', 401));
  }

  //3) IF SO, UPDATE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4) log user in, send JWT
  createSendToken(user, 200, res);
});
