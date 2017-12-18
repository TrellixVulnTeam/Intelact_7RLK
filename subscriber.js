'use strict';


//const view = require('./public/view.js');

const Pubsub = require('@google-cloud/pubsub');
const pubsub = Pubsub({
  projectId: "intelact-186119"
});

const topicName = "event_processing";
const topic = pubsub.topic(topicName);
const publisher = topic.publisher();
const subscriptionName = "AE_subscription";
const fbadmin = require("firebase-admin");
const videoIntelligence = require('@google-cloud/video-intelligence');
const aiclient = new videoIntelligence.VideoIntelligenceServiceClient();


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

var eventKey = "";
var messagesRef = "";

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
    eventKey = parts[1];
    var timestamp = parts[2];


    // add to firebase database
    var updates = {};
    var url = "https://storage.googleapis.com/intelact_event_videos/" + filename;
    updates['event_data/' + eventKey + '/videoUrl'] = url;
    fbadmin.database().ref().update(updates);

    messagesRef = fbadmin.database().ref('event_data/' + eventKey + '/messages');
    var date = new Date();
    var datestr = String(date);
    var format_date = datestr.split('GMT');

    console.log("About to push upload message...");
    messagesRef.push({
      message: "Video Uploaded to the Cloud",
      detail: "URL: " + url,
      timestamp: format_date[0]
    });

    // start analysing
    console.log("Analysing video...");
    if(eventKey !="") {
      messagesRef.push({
        message: "Analysing video...",
        detail: "This may take a few seconds.",
        timestamp: format_date[0]
      });
    }


    var bucketId = message.attributes.bucketId;
    var objectId = message.attributes.objectId;
    var gsurl = "gs://" + bucketId + '/' + objectId;
    analyseVideo(gsurl);

	} if(message.attributes.eventType == "ANALYSED_VIDEO") {
    var labels_json = message.attributes.labels;
    var labels = JSON.parse(labels_json);  

    // upload to database
    var date = new Date();
    var datestr = String(date);
    var format_date = datestr.split('GMT');

    if(eventKey !="") {
      console.log("Event key: " + eventKey);
      messagesRef.push({
        message: "Video Analysed.",
        detail: "Labels detected: " + labels,
        timestamp: format_date[0]
      });
    }
    


    
    console.log("Classifiying emergency...");
    console.log(labels_json);


    // classify event
    const EVENT_TYPE = [];

    function isFire(x) {
      return x == "fire"
    }

    function isMedical(x) {
      return x == "blood" || x == "injury"
    }

    function isPhysical(x) {
      return x == "knife" || x=="combat" || x=="riot"
    }

    if(labels.find(isFire)) {
      EVENT_TYPE.push("FIRE");
      console.log("Fire detected.");
    } if(labels.find(isMedical)) {
      EVENT_TYPE.push("MEDICAL EMERGENCY");
      console.log("Medical emergency detected.");
    } if(labels.find(isPhysical)) {
      EVENT_TYPE.push("PHYSICAL THREAT");
      console.log("Physical threat detected.");
    } if(EVENT_TYPE.length == 0) {
      EVENT_TYPE.push("NO EMERGENCY");
      console.log("No emergency detected.");
    }

    // upload to database
    var date = new Date();
    var datestr = String(date);
    var format_date = datestr.split('GMT');

    if(eventKey != "") {
      messagesRef.push({
        message: "Event Classified.",
        detail: EVENT_TYPE.toString() + " detected.",
        timestamp: format_date[0]
      });
    }

  }

}


function analyseVideo(url) {

  var entities = []

  // Construct request
  const request = {
    inputUri: url,
    features: ['LABEL_DETECTION'],
  };

  // Execute request
  aiclient
    .annotateVideo(request)
    .then(results => {
      const operation = results[0];
      console.log(
        'Waiting for operation to complete... (this may take a few minutes)'
      );
      return operation.promise();
    })
    .then(results => {
      // Gets annotations for video
      const annotations = results[0].annotationResults[0];
      // Gets labels for video from its annotations
      const labelAnnotations = annotations.segmentLabelAnnotations;
      labelAnnotations.forEach(label => {
        entities.push(label.entity.description)
      });

      const shotAnnotations = annotations.shotLabelAnnotations;
      shotAnnotations.forEach(label => {
        entities.push(label.entity.description)
      });

      const frameAnnotations = annotations.frameLabelAnnotations;
      frameAnnotations.forEach(label => {
        entities.push(label.entity.description)
      });


      console.log("Finished analysing");

      //push to topic
      var dataBuffer = new Buffer("ANALYSED_VIDEO");
      var attributes = {
        eventType: "ANALYSED_VIDEO",
        labels: JSON.stringify(entities)
      }

      var pub_callback = function(err, messageId) {
        if (err) {
          console.error('Publish ERROR:', err);
        } else {
          console.log("Analysed video message published");
        }
      };

      publisher.publish(dataBuffer,attributes,pub_callback);

      return 0;

    })
    .catch(err => {
      console.error('Analysis ERROR:', err);
    });
}

module.exports = pushSubscribe;




