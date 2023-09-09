const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
// const crypto = require('crypto');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    require: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    require: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    require: [true, 'please confirm your password'],
    validate: {
      ////THIS ONLY WORKS ON CREATE AND  SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not same ',
    },
    // select:false
  },
  passwordChangedAt: Date,
  PasswordResetToken: String,
  PasswordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //  ONLY RUN THIS FUNCRION IF PASSWORD IS ACTUALLY MODIFIED
  if (!this.isModified('password')) return next();

  //HASH PASSWORD WITH COST OF 12//  async
  this.password = await bcrypt.hash(this.password, 12);

  //DELETE  passwordConfirm FIELDS
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) { 
  //THIS POINT TO THE CURRENT QUERY
  this.find({ active: { $ne: false } });
  next();
});
//INSTANCE METHOD AVAILABLE ON ALL DOCUMENTS OF CERTAIN <COLECTION></COLECTION>
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//IN INSTANCE METHOD THIS-> POINTS TO CURRENT DOCUMENT
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimeStamp, JWTTimestamp);

    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  console.log(resetToken);
  this.PasswordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log({ resetToken }, this.PasswordResetToken);
  this.PasswordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
