const mongoose = require("mongoose");

module.exports = async () => {
  const mongoUri =
    "mongodb+srv://rs668335:YgIc18kOikKUAzs2@cluster0.1lvnsrb.mongodb.net/?retryWrites=true&w=majority";
  try {
    const connect = await mongoose.connect(mongoUri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log(`MonogoDB Connect: ${connect.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
