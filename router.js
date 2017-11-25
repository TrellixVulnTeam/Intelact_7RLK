'use strict';

const express = require('express');
const router = express.Router();
const uploader = require('./uploadToGCS.js');



/*router.post(
  '/',
  uploader.multer.single('videoFile'),
  uploader.sendUploadToGCS,
  (req, res, next) => {
    console.log("Callback ended")
    res.redirect('back');
  }
);
*/
module.exports = router;
