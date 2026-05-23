const express = require('express');
const v1Routes = require('./v1');

const router = express.Router();   //we are using express router to manage all the routes in one place and then we will export it to the main file app.js and use it there. so that we can keep our code organized and maintainable.
router.use('/v1',v1Routes); 

module.exports=router;