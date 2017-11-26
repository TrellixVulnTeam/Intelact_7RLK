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
		console.log(data)
		//view(data.selfLink)
	}

}

module.exports = pushSubscribe;




