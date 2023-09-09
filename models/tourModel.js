const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const user=require('./userModel');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    maxLength: [40, 'A tour must have less or equal to 40 characters'],
    minLength: [10, 'A tour must have greater or equal to 10 characters'],
    // validate: [validator.isAlpha, 'Tour name must only contain characters'],
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A Tour must have a Duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A Tour must have a group size'],
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1.0, 'Rating must be above 1.0'],
    max: [5.0, 'Rating must be above 5.0'],
    set: (val) => Math.round(val * 10) / 10,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  difficulty: {
    type: String,
    required: [true, 'A Tour must have a Difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either easy, medium, defficult',
    },
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDisc: {
    type: Number,
    validate: {
      validator: function (val) {
        //this only point to current doc on NEW document creation
        return val < this.price;
      },
      message: 'Discount price ({VALUE}) should be below regular price',
    },
  },
  summary: {
    type: String,
    trim: true,
    // required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A Tour must have image cover'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: [Date],
  secreteTour: {
    type: Boolean,
    default: false,
  },
  startLocation: {
    //GeoJSON
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
    address: String,
    description: String,
  },
  locations: [
    {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number,
    },
  ],
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
   
},
//SHOW VIRTUAL PROPERTY
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

tourSchema.index({ price: 1 });
tourSchema.index({startLocation:'2dsphere'})

/////VIRTUAL POPULATE
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

////DOCUMENT MIDDELWARE:  runs before .save() and .create() ONLY!
tourSchema.pre('save', function (next) {
  //this -> current processed document
  this.slug = slugify(this.name, { lower: true });
  next();
});
tourSchema.post('save', function (doc, next) {
  // console.log(doc);
  next();
});

//QUERY MIDDlEWARE
tourSchema.pre(/^find/, function (next) {
  // this->query
  this.find({ secreteTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v   -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  this.find({ secreteTour: { $ne: true } });
  console.log(`Query took  ${Date.now() - this.start} millisecond`);
  // console.log(docs);
  next();
});

//AGGREGATION MIDDELWARE
// tourSchema.pre('aggregate', function (next) {
//  this->Current Aggregation Object
//   console.log(this.pipeline());
//   this.pipeline().unshift({ $match: { secreteTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
