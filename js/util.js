  /**
   * Plays an audio file using a popup browser
   * @param {String} uri Relative path of the audio file
   * @param {String} length Desired length of audio playback
   * @returns Promise that resolves when sound plays
   */
  function playSound(uri, length) {
    let retprom = new Promise((resolve,reject) => {
        chrome.storage.local.get(["MAXHEIGHT", "MAXWIDTH"], function (heightResult) {
            let url = chrome.runtime.getURL("audio.html");
            url += "?volume=0.6&src=" + uri + "&length=" + length;
        
            // Create window to play sound if one does not exist already
            chrome.storage.local.get(["soundTabId"], function (result) {
              let soundTabId = result.soundTabId;
              // If sound tab doesn't exist, create one and save the id into local storage
              if (soundTabId == undefined) {
                createWindowForSound(url,heightResult).then((res) => {
                    resolve();
                    return;
                });
              } else {
                // If it exists, check if it is actually an id of an open tab
                chrome.tabs.get(soundTabId, function () {
                  // If tab isn't actually open, then create one and save the id into local storage
                  // Else reuse the open tab to play the goal horn
                  if (chrome.runtime.lastError) {
                    createWindowForSound(url,heightResult).then((res) => {
                        resolve();
                        return;
                    });
                  } else {
                    chrome.tabs.update(soundTabId, { url: url }, function() {
                        resolve();
                        return;
                    });
                  }
                });
              }
            });
          });
    });
    return retprom;
  }
  


  /**
   * Opens popup window to play audio file
   * @param {*} url Full URL which opens audio.html and plays the sound file
   * @param {*} dimensions Dimensions of the popup sound window
   * @returns Promise which resolves when the popup window is opened
   */
  function createWindowForSound(url,dimensions) {
    let retprom = new Promise((resolve,reject) => {
        chrome.windows.create({
            type: 'popup',
            focused: true,
            top: dimensions.MAXHEIGHT-100,
            left: dimensions.MAXWIDTH-200,
            height: 1,
            width: 1,
            url,
        }, function (Window) {
            // Get window and store the id of the tab so it can be reused to play goal horns
            let tabId = Window["tabs"][0]["id"];
            chrome.storage.local.set({"soundTabId": tabId, "soundWindowId": Window["id"]}, function() {
                resolve();
                return;
            });    
        });
    })
    return retprom;
  }

  /**
   * Sends chrome desktop notification
   * @param {String} title Title of the notification
   * @param {String} message Notification message
   * @param {String} iconUrl Relative path of image to be used in notification
   * @param {String} audioUrl Relative path of audio file to be played with the notification
   * @param {String} length Length of notification
   * @returns Promise which resolves when the notification is sent
   */
  function sendNotification(title,message,iconUrl,audioUrl,length=notifLength) {
    let retprom = new Promise((resolve,reject) => {
        let opt = {
            title: title,
            message: message,
            type: "basic",
            iconUrl: iconUrl,
            silent: true,
            requireInteraction: true
        }
        chrome.notifications.create("",opt,function (id) {
            playSound(audioUrl,length).then((res) => {
                timer = setTimeout(function() {chrome.notifications.clear(id);},notifLength); 
                resolve();
                return;
            });
            
        });
    });
    return retprom;
  }