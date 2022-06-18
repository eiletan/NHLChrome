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