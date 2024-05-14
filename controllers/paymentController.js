const Payment = require("../model/payment");
const jwt = require("jsonwebtoken");
const { Chapa } = require("chapa-nodejs");

const fs = require("fs");

const chapa = new Chapa({
  secretKey:
    process.env.NODE_ENV === "production"
      ? process.env.CHAPA_LIVE_SECRET
      : process.env.CHAPA_TEST_SECRET,
});

const axios = require("axios");
const Order = require("../model/order");
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Course = require("../model/course");
const User = require("../model/user");

const home = async (req, res) => {
  try {
    const data = {
      status: "success",
      data: "Chapa Integrating..",
    };

    console.log({ data });
    res.status(200).json({ data });
  } catch (error) {
    handleErrors(error, res);
  }
};

const pay = async (req, res) => {
  try {
    // Purposebalck Telebirr Integration API
    // const pbe_telebirr_api = process.env.PBE_TELEBIRR_API;
    const pbe_telebirr_api = "https://telebirr.purposeblacketh.com/";
    // const notify_url = process.env.KAPS_TELEBIRR_NOTIFY_URL;

    // Destructure the value
    const { subject, amount, tranx_id } = req.body;

    const return_url = process.env.KAPS_TELEBIRR_RETURN_URL + "/" + tranx_id;
    const new_data = {
      subject,
      amount,
      tranx_id,
      return_url,
    };
    // Sending a post request to the api endpoint
    axios
      .post(pbe_telebirr_api + "telebirr/payer", new_data)
      .then((response) => {
        // This returns a response
        res.status(200).json({ data: response.data });
      })
      .catch((error) => {
        console.error("Error Sending Payment Request:", error);
        // This returns a error
        res.status(200).json({ error });
      });
  } catch (error) {
    handleErrors(error, res);
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * Call this method to initiate chapa payment
 * This method returns a response that contains a toPayUrl(checkout_url) if success
 * This method may return a failure response on fail
 * @returns
 */
const chapa_pay = async (req, res) => {
  try {
    // Generate or feed your Transaction Reference
    const tx_ref = await  generateTransacrionReference();

    const order_id = req.body.order_id;



    // Initiate Payment
    const responsePayment = await initialize_chapa_payment(tx_ref, order_id);

    // Return the response to the client
    return res.status(200).json(responsePayment);
  } catch (error) {
    console.log({ error });
    // Return the error object to the client
    return res.status(400).json(error);
  }
};

/**
 * A callback url that we feed chapa to notify our server and update some status
 * or may be store a transaction document
 */

const chapa_callback = async (req, res) => {
  try {
    const reference = req.params.reference;

    const order_id = req.params.order_id;


    let order =null;

    if (reference) {
      const data_chapa = await chapa.verify({
        tx_ref: reference,
      });

      if(order_id){
        order = await get_order(order_id); 
      }

      if (data_chapa.status === "success") {
        const data = {
          transactionID: data_chapa.data.tx_ref, // This should be a unique ID for the transaction
          response: {},
          amount: data_chapa.data.amount, // Example amount
          currency: data_chapa.data.currency, // Example currency
          paymentMethod: "Chapa", // Example payment method
          customerID: order.user,// Example customer ID
          customerName:
            data_chapa.data.first_name, // Example customer name
          emailAddress: data_chapa.data.email, // Example email address
          orderID: order_id, // Example order ID
          productDetails: "", // Example product details
          billingAddress: {
            country: "Ethiopia",
            postalCode: 1000,
            city: "AA",
            street: "Piassa",
            /* Object containing billing address */
          }, // Example billing address
          shippingAddress: {
            country: "Ethiopia",
            postalCode: 1000,
            city: "AA",
            street: "Piassa",
            /* Object containing shipping address  */
          }, // Example shipping address
          additionalMetadata: {
            /* Additional metadata if needed */
          }, // Example additional metadata
        };

        const payment = await save_payment(data);

        if (payment) {
          // Update the order         
          if(order){
            const updated_order = await updateOrder(order_id,reference);

            const enrolled_course = await enrollCourse(order.orderItems[0].product, order.user)
         }
        }

        res.status(200).json({ success: true });
      }
    } else {
      console.log({ reference: "Reference Error" });
      res.status(500).json({ success: false });
    }
  } catch (error) {
    console.log({ error });
  }
};

const success = async (req, res) => {
  try {
    // res.status(200).json({ data:"Hello Success"});
    res.status(200).json({
      data: req.body,
      success: {
        data: "redirecting Please Wait",
        status: true,
      },
    });
  } catch (error) {
    console.log({ error });
    // handleErrors(error, res);
  }
};

const notifier = async (req, res) => {
  try {
    console.log("Receiving Notification");
    const data = req.body;
    console.log({ incomingData: data });

    const orderID = data.outTradeNo;

    // const orderID = req.params.orderID;
  } catch (error) {
    console.error("Error processing payment success:", error);
    // Return a generic error message in case of server stop or crash
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// an inintializer method for chapa payment
const initialize_chapa_payment = async (tx_ref,order_id) => {
  try {
    // const base_url = process.env.BASE_URL;
    const base_url = process.env.BASE_URL+"/";
    const baseClientUrl = process.env.CLIENT_BASE_URL+"/";
    const order = await get_order(order_id);

    const user = await get_user(order.user);

    const encrypted_url = encrypt_lesson_url(order.orderItems[0].product);

    const response = await chapa.initialize({
      first_name: user.fullname,
      last_name: user.fullname,
      email: user.email,
      currency: "ETB",
      amount: order.total,
      tx_ref: tx_ref,
      callback_url: base_url + "payment/chapa/callback/" + order_id + "/" + tx_ref,
      return_url: baseClientUrl + "lesson/" + encrypted_url,
      customization: {
        title: "Kegeberew",
        description: "Kegeberew University",
      },
    });
    console.log({ response });
    return response; // Assuming you want to return the response from chapa.initialize()
  } catch (error) {
    console.error("Error initializing payment:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

// Santim pay Integration
const santim_pay_callback = (req, res) => {
  try {
    const publicKey = process.env.SANTIM_PAY_PUBLIC_KEY;
    const headerStringValue = req.headers["signed-token"];
    const decoded = jwt.verify(headerStringValue, publicKey, {
      algorithms: ["ES256"],
    });

    const orderId = parseInt(
      decoded.thirdPartyId.substring(0, decoded.thirdPartyId.length - 16)
    );
    // Process order status based on decoded status
    if (decoded.Status === "COMPLETED") {
      // Update order status to 'processing'
      console.log(`Order ${orderId} payment completed.`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error processing Santimpay webhook:", err.message);
    res.status(500).json({ success: false });
  }
};


// Arif pay Integration
const arif_pay_callback = async (req, res) => {
    //chapis work arif pay notified

    try{
      const {orderId,sessionId,items} = req.body;


      const order = await get_order(orderId);

      if(order){
        const data = {
          transactionID: sessionId, // This should be a unique ID for the transaction
          response: {},
          amount: data_chapa.data.amount, // Example amount(from order)
          currency: 'ETB', // Example currency
          paymentMethod: "Chapa", // Example payment method
          customerID: order.user,// Example customer ID
          customerName:
            data_chapa.data.first_name, // Example customer name
          emailAddress: data_chapa.data.email, // Example email address(from order)
          orderID: orderId, // Example order ID
          productDetails: "", // Example product details
          billingAddress: {
            country: "Ethiopia",
            postalCode: 1000,
            city: "AA",
            street: "Piassa",
            /* Object containing billing address */
          }, // Example billing address
          shippingAddress: {
            country: "Ethiopia",
            postalCode: 1000,
            city: "AA",
            street: "Piassa",
            /* Object containing shipping address  */
          }, // Example shipping address
          additionalMetadata: {
            /* Additional metadata if needed */
          }, // Example additional metadata
        };

        const payment = await save_payment(data);

        if (payment) {
          // Update the order         
          if(order){
            const updated_order = await updateOrder(orderId,sessionId);

            const enrolled_course = await enrollCourse(order.orderItems[0].product, order.user)
         }
        }
      }

      
    }catch(error){
      console.log({error})

      res.status(500).json({error: error});
    }
};


// This function initiates santim pay payment
const santim_pay_process_payment = async (req, res) => {
  try {
    // Grab the credentials from environment variable
    const privateKey = process.env.SANTIM_PAY_PRIVATE_KEY;
    const authToken = process.env.SANTIM_PAY_TOKEN;
    const merchant_id = process.env.SANTIM_PAY_MERCHANT_ID;
    // Get the body of the request
    const orderDetail = req.body;
    const reason = orderDetail.reason;
    // Prepare the payload to be signed
    const data = {
      amount: orderDetail.total,
      phone_number: "0935587112",
      paymentReason: reason,
      merchantId: merchant_id,
      generated: Math.floor(Date.now() / 1000),
    };

    // Sign the payload
    const token = jwt.sign(data, privateKey, { algorithm: "ES256" });
    const base_url = process.env.BASE_URL+"/";
    const baseClientUrl = process.env.CLIENT_BASE_URL;

    // Static data
    const static_data = {
      returnUrl: baseClientUrl,
      failureRedirectUrl: baseClientUrl + "?failed=true",
      notifyUrl:
      base_url+"/payment/santim-pay/callback",
    };
    // Request body for santim-pay
    const body = {
      id: orderDetail.order_id + Math.random().toString(16).substring(2, 10),
      amount: orderDetail.total,
      reason: reason,
      merchantId: merchant_id,
      signedToken: token,
      successRedirectUrl:
        static_data.returnUrl + "CourseDetail/660678ef24f65af4485f2164",
      failureRedirectUrl: static_data.failureRedirectUrl,
      notifyUrl: static_data.notifyUrl,
    };

    // Send request to Santimpay API
    // Example: You can use 'axios' to make HTTP requests
    const response = await axios.post(
      "https://services.santimpay.com/api/v1/gateway/initiate-payment",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    // Log the response to track the response
    console.log({ response });
    // return the response to the client app
    return res.status(200).json({ response: response.data });
  } catch (err) {
    console.error("Error processing Santimpay payment:", err.message);
    return res.status(500).json({ err });
  }
};

//

const save_payment = async (data) => {
  // Process Saving The data (save payment Info)
  const newPaymentData = {
    transactionID: data.transactionID, // This should be a unique ID for the transaction
    paymentGatewayResponse: { response: data.response },
    amount: data.amount, // Example amount
    currency: data.currency, // Example currency
    paymentMethod: data.paymentMethod, // Example payment method
    customerID: data.customerID, // Example customer ID
    customerName: data.customerName, // Example customer name
    emailAddress: data.emailAddress, // Example email address
    orderID: data.orderID, // Example order ID
    productDetails: data.productDetails, // Example product details
    billingAddress: data.billingAddress, // Example billing address
    shippingAddress: data.shippingAddress, // Example shipping address
    additionalMetadata: data.additionalMetadata,
  };
  // Creating a new Payment document
  Payment.create(newPaymentData)
    .then((payment) => {
      console.log("Payment created successfully:", payment);
    })
    .catch((error) => {
      console.error("Error creating payment:", error);
    });
  return true;
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const generateTransacrionReference = async () =>{
   // Generate or feed your Transaction Reference
   const tx_ref = await chapa.generateTransactionReference({
    prefix: "KU", // defaults to `TX`
    size: 20, // defaults to `15`
  });

  return tx_ref
}

const get_user = async (user_id) => {
  return await User.findById(user_id);
}

// Get single order
const get_order = async (order_id) => {
  const order = await Order.findOne({ _id: order_id });
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${order_id}`);
  }

  return order;
}

const updateOrder = async (orderId, reference) => {
  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    return false;
  }

  order.paymentIntentId = reference;
  order.status = 'paid';
  await order.save();

  return order;
};

const encrypt_lesson_url = (product_id) => {
  return btoa(product_id);
}

const enrollCourse = async (courseId,userId) => {
  try {

      // Check if the course exists
      const course = await Course.findById(courseId);

      if (!course) {
          return false
      }

      // Check if the user is already enrolled in the course
      if (course.userWhoHasBought.includes(userId)) {
          return false
      }

      // Add the user to the list of users who have bought the course
      course.userWhoHasBought.push(userId); 
      await course.save();

      // Add the course to the user's enrolled courses
      const user = await User.findById(userId);

      if (!user) {
         return false
      }
      // Add the course to the user's enrolled courses with progress set to 0
      user.enrolledCourses.push({ course: courseId, progress: 0 });
      await user.save();

     return user;
  } catch (error) {
      console.error('Error enrolling user in course:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
};


module.exports = {
  home,
  pay,
  chapa_pay,
  chapa_callback,
  santim_pay_process_payment,
  santim_pay_callback,
  success,
  notifier,
  arif_pay_callback
};
