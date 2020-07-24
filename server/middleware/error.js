const winston = require("winston");

module.exports = function(err, req, res, next) {
  //log error to console
  console.log(err.message, err.stack);

  //log levels: error, warn, info, verbose, debug, silly
  //log error into file
  winston.error(err.message, err);

  //Send error to client
  res.status(500).send("Hubo un error");
};
