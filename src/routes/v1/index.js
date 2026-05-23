const express = require('express');
const {InfoController} = require('../../controllers')
const router = express.Router(); //router object is used to define the routes for our application. it is a middleware that is used to handle the requests and responses for our application. it is used to define the routes for our application and then we can use it in our main file app.js to use the routes defined in this file.
router.get('/info',InfoController.info);
module.exports = router;