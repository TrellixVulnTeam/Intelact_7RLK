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


	return topic.createSubscription(subscriptionName)
    .then((results) => {
      const subscription = results[0];

      console.log(`Subscription ${subscription.name} created.`);
	  subscription.on("message",handleMessage);
      return subscription;
    });
}

function dbmessage(message,detail,ref) {
  console.log("Pushing message to DB...");
  var date = new Date();
  var datestr = String(date);
  var format_date = datestr.split('GMT');

  ref.push({
        message: message,
        detail: detail,
        timestamp: format_date[0]
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
    var eventKey = parts[1];
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

    dbmessage("Video Uploaded to the Cloud",
      "URL: " + url,messagesRef)
    

    // start analysing
    dbmessage("Analysing video...",
      "This may take a few seconds.",messagesRef);

    var bucketId = message.attributes.bucketId;
    var objectId = message.attributes.objectId;
    var gsurl = "gs://" + bucketId + '/' + objectId;
    analyseVideo(gsurl,eventKey);

	} if(message.attributes.eventType == "ANALYSED_VIDEO") {
    var labels_json = message.attributes.labels;
    var eventKey = message.attributes.eventKey;
    var labels = JSON.parse(labels_json);  
    var messagesRef = fbadmin.database().ref('event_data/' + eventKey + '/messages');

    // upload to database
    dbmessage("Video Analysed.",
      "Labels detected: " + labels,
      messagesRef);
    
    console.log("Classifiying emergency...");
    console.log(labels_json);


    // classify event
    var emergency = false;

    function isFire(x) {
      return x == "fire" || x=="flame" || x=="smoke" || x=="explosion" 
    }

    function isMedical(x) {
      return x == "medical" || x == "blood" || x == "injury" || x=="bone" || x=="hemorrhage" || x=="crash" || x=="accident" || x=="wreckage" || x=="wound" || x=="collision" || x=="flesh"
    }

    function isPhysical(x) {
      return x == "knife" || x=="combat" || x=="riot" || x=="fight" || x=="gun" || x=="weapon" || x=="blade" || x=="machete" || x=="rifle" || x=="violence" || x=="baseball bat"
    }

    function isNatural(x) {
      return x == "tornado" || x=="supercell" || x=="earthquake" || x=="catastrophe" || x=="tsunami" || x=="avalanche" || x=="flood" 
    }

    if(labels.find(isFire)) {
      emergency = true;
      dbmessage("Fire detected!",
        "EXAMPLE RESPONSES: \n Contacting fire brigade...\n Displaying map of current location...\n Displaying fire safety information...\n",
        messagesRef);


    } if(labels.find(isMedical)) {
      emergency = true;
      dbmessage("Medical emergency detected!",
        "EXAMPLE RESPONSES: \n Alerting family members...\n Contacting ambulance service...\n Displaying first aid information...\n",
        messagesRef);


    } if(labels.find(isPhysical)) {
      emergency = true;
      dbmessage("Physcial threat detected!",
        "EXAMPLE RESPONSES: \n Putting device on silent mode...\n Contacting police...\n Alerting family members...\n Displaying directions to nearest safe area...\n",
        messagesRef);

    } if(labels.find(isNatural)) {
      emergency = true;
      dbmessage("Natural disaster detected!",
        "EXAMPLE RESPONSES: \n Displaying local news feed... \n Displaying avoidance areas... \n Displaying emergency advice... \n Contacting emergency services...", messagesRef)
    }

    if(!emergency) {
      dbmessage("No emergency detected.","",messagesRef);
    }


    return 0;

  }

}



function analyseVideo(url,key) {

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

      var i,j,temparray,label_chunk,chunk = 125;
      for (i=0,j=entities.length; i<j; i+=chunk) {
        label_chunk = entities.slice(i,i+chunk);
        // do whatever
        //push to topic
        var dataBuffer = new Buffer("ANALYSED_VIDEO");
        var attributes = {
          eventType: "ANALYSED_VIDEO",
          eventKey: key,
          labels: JSON.stringify(label_chunk)
        }

        var pub_callback = function(err, messageId) {
          if (err) {
            console.error('Publish ERROR:', err);
          } else {
            console.log("Analysed video message published");
          }
        };

        publisher.publish(dataBuffer,attributes,pub_callback);
      }

      

      return 0;

    })
    .catch(err => {
      console.error('Analysis ERROR:', err);
      var messagesRef = fbadmin.database().ref('event_data/' + key + '/messages');
      dbmessage("Error analysing video. Try again by refreshing the page.","",messagesRef)
    });
}

module.exports = pushSubscribe;




