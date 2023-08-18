const jwt = require("jsonwebtoken");
const { error } = require("../utils/responseWrapper");
const Users = require("../models/Users");

module.exports = async (req, res, next) => {
  if (
    !req.headers ||
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return res.send(error(401, "authorization header is required"));
  }

  const accessToken = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_PRIVATE_KEY
    );

    req._id = decoded._id; //? Decoded key have id so send this id to req._id

    const user = await Users.findById(req._id);
    if(!user) {
      return res.send(error(404,"User Not Found"))
    }

    next(); 
  } catch (e) {
    return res.send(error(401, "Invalid access key"));
  }
};
