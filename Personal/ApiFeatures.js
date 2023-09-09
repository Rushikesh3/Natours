//1 FILTERING
const queryObj = { ...req.query };
const excludeFields = ['page', 'sort', 'limit', 'fields'];
excludeFields.forEach((el) => delete queryObj[el]);

//1 ADVANCE FILTERING
let queryStr = JSON.stringify(queryObj);
queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
console.log(JSON.parse(queryStr));

let query = Tour.find(JSON.parse(queryStr));

//2 SORTING
if (req.query.sort) {
  const sortBy = req.query.sort.split(',').join(' ');
  query = query.sort(sortBy);
} else {
  query = query.sort('-createdAt');
}

//3 FIELD LIMITING
if (req.query.fields) {
  const fields = req.query.fields.split(',').join(' ');
  query = query.select(fields);
} else {
  query = query.select('-__v');
}

//4 PAGINATION
const page =  req.query.page * 1 || 1;
const limit = req.query.limit * 1 || 100;
const skip = (page - 1) * limit;
query =  query.skip(skip).limit(limit);     