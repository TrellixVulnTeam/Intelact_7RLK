# Intelact - a cloud based, AI emergency responder

## Introduction

Intelact  is  a  web  application  that  uses  artificial intelligence  and  cloud  based  technology  to  rapidly  detect  and respond  to  emergency  situations.  Using  Google’s  cloud  infras-tructure,  the  application  is  able  to  store  uploaded  videos  in  the cloud, identify the type of emergency situation within videos (e.g. medical,  fire,  physical  threat)  and  subsequently  suggest  tailored responses.  Such  a  system  could  be  used  to  autonomously store video and audio evidence, contact the relevant emergency services and provide useful safety information, with very low requirements for  user  interaction.  

Run the application [here](https://intelact-186119.appspot.com/).

## Demo Instructions

### Before you begin...
* <strong> Make sure you have access to a Google account </strong> - the web application links to a Google account so that it can identify video uploads. Sign in using the button in the top left of the page, to upload a video. 
* Have access to an MP4 video you wish to test. <strong> Uploaded videos must be in MP4 format and must be under 300 seconds in length. </strong> Some sample videos can be found under the test_videos directory in the Github respository. 
* The application works best with Google chrome. 
* The application is a prototype and so is not 100% secure or robust. Please be mindful of the videos uploaded. If the video analysis does not return after about 1 minute, try uploading the video again by refreshing the page.  

### Testing the application 
1. Go to the [Intelact homepage](https://intelact-186119.appspot.com/). 
2. Sign in to your Google account using the button in the top left of the page. 
3. Click the 'Create Event' button to trigger an emergency event. The notification sidebar on the right on the screen will update. 
4. Click the 'Browse' button to select a video file you wish to test. Clicking the file will trigger the webpage to display the video on  screen. 
5. Click the 'Upload' button to upload the video to the cloud. 
6. Once uploaded, the notification sidebar will update to inform you that the video has successfully been uploaded and will now start analysing the video content for information. 
7. After a few seconds to one or two minutes (depending on the video length), the notification sidebar will again update to display the items it detected in the uploaded video. 
8. Very soon afterwards, a classification result is displayed, showing the type of emergency detected and some example responses/tasks that the application could go on to complete. 
<br>

![Intelact Screenshot](https://github.com/dkeitley/Intelact/blob/master/ui_screenshot.PNG)
