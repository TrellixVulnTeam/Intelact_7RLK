'use strict';


//const view = require('./public/view.js');

const Pubsub = require('@google-cloud/pubsub');
const pubsub = Pubsub({
  projectId: "intelact-186119"
});

const topicName = "event_processing";
const topic = pubsub.topic(topicName);
const subscriptionName = "AE_subscription";
const fbadmin = require("firebase-admin");


var serviceAccount = require("./intelact-b15ab-firebase-adminsdk-0ktq9-dc5c862445.json");
fbadmin.initializeApp({
  credential: fbadmin.credential.cert(serviceAccount),
  databaseURL: "https://intelact-b15ab.firebaseio.com"
});






const options = {
    pushConfig: {
    	// change to https://${pubsub.projectId}.appspot.com/push
    	// once deployed
      pushEndpoint: "https://localhost:8080/push"
    }
  };

function listSubscriptions () {
  // Instantiates a client
  // Lists all subscriptions in the current project
  return pubsub.getSubscriptions()
    .then((results) => {
      const subscriptions = results[0];

      console.log('Subscriptions:');
      subscriptions.forEach((subscription) => console.log(subscription.name));

      return subscriptions;
    });
}

function pushSubscribe(subscriptionName) {


	console.log("pushSubscribe");
	return topic.createSubscription(subscriptionName)
    .then((results) => {
      const subscription = results[0];

      console.log(`Subscription ${subscription.name} created.`);
	  subscription.on("message",handleMessage);
      return subscription;
    });
}

function handleMessage(message,err) {
	
	if (err) {
	  console.log("Error: " + err);
      throw err;
    }
    console.log("Handling message.");
    const data = message.data;
    message.ack();

	if(message.attributes.eventType == "OBJECT_FINALIZE") {
		var json = JSON.parse(data.toString());
    var filename = json.name;
    var parts = filename.split('/');

    var user = parts[0];
    var eventKey = parts[1];
    var timestamp = parts[2];


    // add to firebase database
    var updates = {};
    var url = "https://storage.googleapis.com/intelact_event_videos/" + filename;
    updates['event_data/' + eventKey + '/videoUrl'] = url;
    fbadmin.database().ref().update(updates);

	}

  if(data.action == "EVENT_CREATED") {

  }


}

module.exports = pushSubscribe;




