require("express-async-errors");

const cors = require("cors");
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

const connectDB = require("./db/connect.js");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userroutes.js");
const productRoutes= require("./routes/postRoutes.js")
const orderRoutes= require("./routes/orderRoutes.js")
const reviewRoutes= require("./routes/ReviewRoutes.js")
const cartRoutes= require("./routes/cartRoutes.js")
const corsOptions = require("./config/corsOptions.js")
const paymentRouter = require("./routes/paymentRouter.js");
// Middleware
const notFoundMiddleware = require("./middleware/not-found.js");
const errorHandlerMiddleware = require("./middleware/error-handler.js");

app.use(cors(corsOptions));
app.use(morgan("tiny"));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/product", productRoutes)
app.use("/api/v1/orders", orderRoutes)
app.use("/api/v1/review", reviewRoutes)
app.use("/api/v1/cart",cartRoutes )

app.use("/payment", paymentRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

