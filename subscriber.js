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

	if(message.attributes.eventType == "OBJECT_FINALIZE") {
		var json = JSON.parse(data.toString());
    var filename = json.name;
    var parts = filename.split('_');
    console.log(parts);
    var user = parts[0];
    var eventKey = parts[1];
    var timestamp = parts[2];


    console.log(user);
    console.log(eventKey);
    console.log(timestamp);
    //console.log(json);
		//view(data.selfLink)
	}

  if(data.action == "EVENT_CREATED") {

  }


}

module.exports = pushSubscribe;




