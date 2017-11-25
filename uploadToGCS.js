'use strict';

const Storage = require('@google-cloud/storage');

const CLOUD_BUCKET = 'intelact_event_videos'
const GCLOUD_PROJECT = 'intelact-186119'

const storage = Storage({
  projectId: GCLOUD_PROJECT
});
const bucket = storage.bucket(CLOUD_BUCKET);

function getPublicUrl (filename) {
  return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`;
}

function sendUploadToGCS (req, res, next) {
  if (!req.file) {
    return next();
  }

  const gcsname = Date.now() + '_' + req.file.originalname;
  const file = bucket.file(gcsname);

  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  stream.on('error', (err) => {
    console.log(err)
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    console.log("Finished Uploading...")
    req.file.cloudStorageObject = gcsname;
    file.makePublic().then(() => {
      req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
      next();
    });
  });

  stream.end(req.file.buffer);
}

const Multer = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // no larger than 100mb
  }
});

module.exports = {
  sendUploadToGCS,
  multer
};