// Firebase Cloud Database Functions


const functions = require('firebase-functions');


const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


exports.getEventKey = functions.database.ref('event_data')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      const keys = Object.keys(original);

      console.log(keys[keys.length-1]);
      return 0;
    });


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
