'use strict';


//const view = require('./public/view.js');

const Pubsub = require('@google-cloud/pubsub');
const pubsub = Pubsub({
  projectId: "intelact-186119"
});

const topicName = "event_processing";
const topic = pubsub.topic(topicName);
const subscriptionName = "AE_subscription";



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
		//view(data.selfLink)
	}


}

module.exports = pushSubscribe;




