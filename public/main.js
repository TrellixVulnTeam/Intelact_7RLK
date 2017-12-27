'use strict';

// Initializes FriendlyChat.
function IntelactPortal() {

  // Shortcuts to DOM Elements.

  this.messageList = document.getElementById('messages');
  this.videoSpace = document.getElementById('video');
  this.submitVideoButton = document.getElementById('submitVideo');
  this.videoForm = document.getElementById('video-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.createEventButton = document.getElementById('createEvent');

  this.createEventButton.addEventListener('click',this.createEvent.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  this.submitVideoButton.style.visibility = "hidden";
  this.mediaCapture.style.visibility = "hidden";
  // Events for video upload.

/*this.submitVideoButton.addEventListener('click', function(e) {
     e.preventDefault();
     this.mediaCapture.click();
   }.bind(this));
   this.mediaCapture.addEventListener('change', this.displayVideo.bind(this));
 */
  this.initFirebase();
}

IntelactPortal.MESSAGE_TEMPLATE =
    '<div id="messages-card" >' +
      '<div class="spacing"></div>' +
      '<div class="time"></div>' +
      '<strong><div class="message"></div></strong>' +
      '<div class="detail"></div><br>' +
    '</div>';


IntelactPortal.VIDEO_TEMPLATE =
    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="video"></div>' +
      '</div>';


IntelactPortal.prototype.displayMessage = function(key,message,detail,timestamp) {
  
  var div = document.getElementById(key);
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = IntelactPortal.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
  }

  div.querySelector('.message').textContent = message;
  var messageElement = div.querySelector('.detail');

  if (detail) { // If the message is text.
    messageElement.textContent = detail;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  }
  if(timestamp) {
    var timeElement = div.querySelector('.time');
    timeElement.textContent = timestamp;
    timeElement.innerHTML = timeElement.innerHTML.replace(/\n/g, '<br>');

  }
};


// Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
IntelactPortal.prototype.setVideoUrl = function(videoUri, vidElement) {
  // If the image is a Cloud Storage URI we fetch the URL.
  
    if (vidElement.canPlayType("video/mp4")) {
      vidElement.src = videoUri;
    }
  
};

// Sets up shortcuts to Firebase features and initiate firebase auth.
IntelactPortal.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();

  this.eventsRef = this.database.ref('event_data');
  this.usersRef = this.database.ref('user_data');
  this.usersRef.off()
  this.eventsRef.off()



  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Signs-in Friendly Chat.
IntelactPortal.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithRedirect(provider);
};




// Signs-out of Friendly Chat.
IntelactPortal.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Returns true if user is signed-in. Otherwise false and displays a message.
IntelactPortal.prototype.checkSignedInWithMessage = function() {
  // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  return false;
};

IntelactPortal.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';


IntelactPortal.prototype.createEvent = function() {
  var timestamp = Date.now()
  console.log("Creating Event...");
  const self = this;


  // Check if the user is signed-in
  if (this.checkSignedInWithMessage()) {
    console.log("Signed in.");

    // We add a message with a loading icon that will get updated with the shared image.
    var currentUser = self.auth.currentUser;
    this.eventProm = this.eventsRef.push({ 
      eventID: "",
      uid: currentUser.uid,
      start_timestamp: timestamp,
      end_timestamp: 0,
      location: "",
      videoUrl: "",
      messages: ""
    }).then(function(data) {  
      console.log("Event created."); 
      var filename = currentUser.uid + "/" + data.key + "/" + Date.now();
      document.getElementById('gcs_key').setAttribute('value',
                    filename);

      data.update({eventID: data.key});
      this.addUserEvent(data.key);

      this.loadMessages(data.key);
      var date = new Date();
      var datestr = String(date);
      var format_date = datestr.split('GMT');
      this.eventsRef.child(data.key).child("messages").push({
        message: "Event Created",
        detail: "",
        timestamp: format_date[0]
      });


        return;
      }.bind(this));

      this.submitVideoButton.style.visibility = "visible";
      this.mediaCapture.style.visibility = "visible";
      this.createEventButton.setAttribute('hidden','true');

    }

  }  

IntelactPortal.prototype.loadMessages = function(key) {
    this.messagesRef = this.database.ref('event_data/' + key + '/messages');
    this.messagesRef.off();

    var setMessage = function(data) {
      console.log("Message found: displaying to screen");

      var notif = document.getElementById('notif');
      var notif_num = parseInt(notif.getAttribute('data-badge'));
      notif.setAttribute('data-badge',String(notif_num+1));

      var val = data.val();
      this.displayMessage(data.key, val.message, val.detail,val.timestamp);
  }.bind(this);

  this.messagesRef.on('child_added', setMessage);
  this.messagesRef.on('child_changed', setMessage);

};


IntelactPortal.prototype.addUserEvent = function(key) {
  var currentUser = this.auth.currentUser
  var newEventRef = this.usersRef.child(currentUser.uid).child('events').child(key);
    newEventRef.set({
      eventID: key     
    });
}



IntelactPortal.prototype.checkUserExists = function() {
  var currentUser = this.auth.currentUser;
  this.userRef = this.database.ref('user_data');

  this.userRef.once("value",snapshot => {
    var hasUser = snapshot.hasChild(currentUser.uid)
    if (hasUser){
    } else {
      this.userRef.child(currentUser.uid).set({
        uid: currentUser.uid,
        name: currentUser.displayName,
        photoURL: currentUser.photoURL,
        events: ""
      });

    }
});
}

IntelactPortal.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');
    document.getElementById("gcs_key").setAttribute('value', user.uid);


    this.checkUserExists();


  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};


IntelactPortal.prototype.getUploadFileName = function() {
  console.log(firebase.auth().currentUser)
  var filename = firebase.auth().currentUser.uid + "-" + Date.now();
  return filename;
}

// Returns true if user is signed-in. Otherwise false and displays a message.
IntelactPortal.prototype.checkSignedInWithMessage = function() {
  // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

window.onload = function() {
  window.intelactPortal = new IntelactPortal();
};

