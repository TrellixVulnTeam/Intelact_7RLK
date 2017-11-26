'use strict';


	const VIDEO_TEMPLATE =
	    '<div class="message-container">' +
	      '<div class="spacing"></div>' +
	      '<div class="video"></div>' +
	      '</div>';



	// Displays uploaded video in the UI.
	function displayVideo(videoUrl) {
      var videourl = "http://storage.googleapis.com/intelact_event_videos/" + filename;

	  var videoSpace = document.getElementById('video');

	  var div = document.getElementById(videoUrl);
	  // If an element for that message does not exists yet we create it.
	  if(!div) {
	    var container = document.createElement('div');
	    container.innerHTML = VIDEO_TEMPLATE;
	    div = container.firstChild;
	    div.setAttribute('id', videoUrl);
	    videoSpace.appendChild(div);
	  }


	  if(videoUrl) {
	    var videoElement = div.querySelector('.video');
	    var video = document.createElement('video');
	    video.setAttribute("controls", "controls");

	    video.addEventListener('load', function() {
	      this.videoSpace.scrollTop = videoSpace.scrollHeight;
	    });
	    videoElement.innerHTML = '';
	    videoElement.appendChild(video);
	  }
	  // Show the card fading-in.
	  setTimeout(function() {div.classList.add('visible')}, 1);
	  this.videoSpace.scrollTop = this.videoSpace.scrollHeight;

	  //this.submitVideoButton.setAttribute('hidden', 'true');
	  //this.mediaCapture.setAttribute('hidden', 'true');

	};
	module.exports = displayVideo;


