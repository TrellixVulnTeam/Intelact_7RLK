'use strict';

// Initializes FriendlyChat.
function IntelactPortal() {

  // Shortcuts to DOM Elements.

  this.videoSpace = document.getElementById('video');
  this.submitVideoButton = document.getElementById('submitVideo');
  this.videoForm = document.getElementById('video-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');

  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  // Events for video upload.

 // this.submitVideoButton.addEventListener('click', this.createEvent.bind(this));

  this.initFirebase();
}

IntelactPortal.MESSAGE_TEMPLATE =
    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="message"></div>' +
      '<div class="name"></div>' +
    '</div>';


IntelactPortal.VIDEO_TEMPLATE =
    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="video"></div>' +
      '</div>';


// Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
IntelactPortal.prototype.setVideoUrl = function(videoUri, vidElement) {
  // If the image is a Cloud Storage URI we fetch the URL.
  if (videoUri.startsWith('gs://')) {
    if (vidElement.canPlayType("video/mp4")) {
      vidElement.src = IntelactPortal.LOADING_IMAGE_URL; // Display a loading image first.
      this.storage.refFromURL(videoUri).getMetadata().then(function(metadata) {
        vidElement.src = metadata.downloadURLs[0];
    }); }
  } else {
    if (vidElement.canPlayType("video/mp4")) {
      vidElement.src = videoUri;
    }
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


IntelactPortal.prototype.createEvent = function(self) {
  var timestamp = Date.now()

  console.log(self);

  // Check if the user is signed-in
  if (self.checkSignedInWithMessage(self)) {

    // We add a message with a loading icon that will get updated with the shared image.
    var currentUser = self.auth.currentUser;
    var filename = document.getElementById("gcs_key").value;
    var videourl = "http://storage.googleapis.com/intelact_event_videos/" + filename;
    self.eventProm = self.eventsRef.push({ 
      eventID: "",
      uid: currentUser.uid,
      start_timestamp: timestamp,
      end_timestamp: 0,
      location: "",
      videoUrl: videourl
    }).then(function(data) {   
      data.update({eventID: data.key});
      self.addUserEvent(data.key)
      self.displayVideo(data.key, currentUser.displayName, currentUser.photoUrl, videourl);
        return;
      }.bind(this));

    }

  }  


IntelactPortal.prototype.addUserEvent = function(key) {
  var currentUser = this.auth.currentUser
  var newEventRef = this.usersRef.child(currentUser.uid).child('events').child(key)
    newEventRef.set({
      eventID: key     
    });
}





// Displays uploaded video in the UI.
IntelactPortal.prototype.displayVideo = function(key, name, photoUrl , videoUri) {

  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if(!div) {
    var container = document.createElement('div');
    container.innerHTML = IntelactPortal.VIDEO_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.videoSpace.appendChild(div);
  }

  if (photoUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + photoUrl + ')';
  } 

  if(videoUri) {
    var videoElement = div.querySelector('.video');
    var video = document.createElement('video');
    video.setAttribute("controls", "controls");

    video.addEventListener('load', function() {
      this.videoSpace.scrollTop = this.videoSpace.scrollHeight;
    }.bind(this));
    this.setVideoUrl(videoUri, video);
    videoElement.innerHTML = '';
    videoElement.appendChild(video);
  }
  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.videoSpace.scrollTop = this.videoSpace.scrollHeight;

  this.submitVideoButton.setAttribute('hidden', 'true');
  this.mediaCapture.setAttribute('hidden', 'true');

  document.getElementById('gcs_key').setAttribute('value',"");

};


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
IntelactPortal.prototype.checkSignedInWithMessage = function(self) {
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
