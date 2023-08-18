const Users = require("../models/Users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { error, success } = require("../utils/responseWrapper");

const signupController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.send(error(400, "All fields are required"));
    }

    // Other validations and checks...

    const oldUser = await Users.findOne({ email });
    if (oldUser) {
      return res.send(error(409, "User is already registered"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the bio field
    const user = await Users.create({
      name,
      email,
      password: hashedPassword,
    });

    // Include a custom success message
    const successMessage = `User ${name} created successfully!`;

    return res.send(
      success(201, {
        message: successMessage,
      })
    );
  } catch (e) {
    return res.send(error(401, e.message));
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.send(error(400, "All fields are required"));
    }

    const user = await Users.findOne({ email }).select("+password");
    if (!user) {
      return res.send(error(404, "User is not registered"));
    }

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
      return res.send(error(403, "Incorrect Password"));
    }

    const accessToken = generateAccessToken({
      _id: user._id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      _id: user._id,
      email: user.email,
    });

    //? Set refresh token as HttpOnly cookie
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
    });

    //? Return access token in the response
    return res.send(
      success(200, {
        accessToken,
      })
    );
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Make this validation for api refresh access accessToken
//? this api will be check refresh token validity and generate a new access token

const refreshAccessTokenController = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies.jwt) {
    return res.send(error(401, "Refresh Token in cookie is Required"));
  }

  const refreshToken = cookies.jwt;

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_PRIVATE_KEY
    );

    const accessToken = generateAccessToken({
      _id: decoded._id,
      email: decoded.email,
    });

    return res.send(
      success(201, {
        accessToken,
      })
    );
  } catch (e) {
    return res.send(error(401, "Invalid Refresh Token"));
  }
};

const logoutController = async (req, res) => {
  try {
    // Clear the refresh token cookie by setting it to an empty value and expiring it immediately
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      expires: new Date(0),
    });

    return res.send(success(200, "Logged out successfully"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//? Main Function..

const generateAccessToken = (data) => {
  return jwt.sign(data, process.env.ACCESS_TOKEN_PRIVATE_KEY, {
    expiresIn: "1d", //? Set an appropriate expiration time
  });
};

const generateRefreshToken = (data) => {
  return jwt.sign(data, process.env.REFRESH_TOKEN_PRIVATE_KEY, {
    expiresIn: "1y", //? Set an appropriate expiration time
  });
};

module.exports = {
  signupController,
  loginController,
  refreshAccessTokenController,
  logoutController,
};
