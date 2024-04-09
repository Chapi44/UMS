const { createJWT, isTokenValid, attachCookiesToResponse } = require('./jwt');
const {createTokenUser ,createTokenUser1}= require('./createTokenUser');
const checkPermissions = require('./checkPermissions');
module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  createTokenUser,
  createTokenUser1,
  checkPermissions,
};
