const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);



const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const routes = require("./routes");

const app = express();


// MIDDLEWARE
app.use(cors());
app.use(express.json());


// ROUTES
app.use("/api", routes);


// BASIC TEST ROUTE
app.get("/", (req, res) => {
  res.send("Backend server is running");
});


// MONGODB CONNECTION
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("MongoDB connected successfully");

//     app.listen(process.env.PORT, () => {
//       console.log(
//         `Server running on http://localhost:${process.env.PORT}`
//       );
//     });
//   })
//   .catch((error) => {
//     console.log("MongoDB connection error:", error);
//   });


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(process.env.PORT, () => {
      console.log(
        `Server running on http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch((error) => {
    console.log("FULL MONGODB ERROR:");
    console.log(error);
  });