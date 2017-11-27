// Firebase Cloud Database Functions


const functions = require('firebase-functions');
const topicName = "event_processing";
const topic = pubsub.topic(topicName);
const publisher = topic.publisher();



const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


exports.getEventKey = functions.database.ref('event_data')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      const keys = Object.keys(original);
      var eventkey = keys[keys.length-1];
      var dataToSend = {
      	data: {
      		action: EVENT_CREATED,
      		eventkey: eventkey,
      		info: original.eventkey
      	}
      };
      var buffer = new Buffer.from(JSON.stringify(dataToSend));

      publisher.publish(buffer,(err) => {
      	if(err) {
      		console.log("Error publishing new event.");
      	} else {
      		console.log("Publishing new event...");
      	}
      });

      return 0;
    });


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
