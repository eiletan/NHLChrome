try {
    importScripts("js/api.js","js/game.js","js/init.js", "js/util.js");
} catch (err) {
    console.log(err);
}



chrome.runtime.onInstalled.addListener(function() {
  // When extension is installed or reloaded, and re-initalize teams data in local storage
  initTeams();
});


chrome.runtime.onStartup.addListener(function() {
  initData();
});

chrome.runtime.onMessage.addListener(function(request,sender,sendResponse) {
  // If this is a message to start tracking a game, call the endpoint to get game data first and then start the recurring schedule
  if (request.gameId != undefined | request.gameId != null) {
    createGame(request.gameId).then((gameObj) => {
      // If the game is created and updated successfully, create alarm and send response back to content script
      // Also open sound window
      let gameTime = gameObj["currentState"]["periodTimeRemaining"];
      // If game is over, don't start tracking
      if (gameTime != undefined && gameTime.valueOf() == "Final") {
        stopTrackingGameOnWin(gameObj);
        chrome.runtime.sendMessage({createGameSuccess: true});
      } else {
        // Open sound window in advance, playing the home team's goal horn
        let title = "Opening Sound Popup Window";
        let msg = "Please keep this window open for the best experience."
        + " It will be closed automatically when the game is over or when you stop tracking this game.";
        sendNotification(title,msg,gameObj["home"]["logo"],gameObj["home"]["goalHorn"]);
        let alarmInfo = {
          "periodInMinutes": 1,
        }
        chrome.alarms.create("liveGame", alarmInfo);
        chrome.alarms.get("liveGame", function (alarm) {
          console.log("liveGame alarm created");
          console.log(alarm);
          chrome.runtime.sendMessage({createGameSuccess: true});
        });
      }  
    }).catch((err) => {
      console.log(err);
      chrome.runtime.sendMessage({createGameSuccess: false});
    });
  } else if (request.updateGameList) {
    let date = String(new Date().toLocaleDateString("en-CA",{timeZone: "America/Los_Angeles"}));
    initScheduledGames(date);
  }
});

chrome.alarms.onAlarm.addListener(onAlarm);

function onAlarm(alarm) {
  if (alarm["name"] == "liveGame") {
    console.log("refreshing!");
    updateGameStatus().then((gameStatus) => {
      let gameTime = gameStatus["currentState"]["periodTimeRemaining"];
      if (gameTime != undefined && gameTime.valueOf() == "Final") {
        stopTrackingGameOnWin(gameStatus);
      }
    });
  }
}

function initData() {
  chrome.storage.local.get(["teams"], function (results) {
    if (results.teams === undefined) {
      try {
        initTeams();
      } catch (err) {
        console.log(err);
      }
    }
  });
}


function stopTrackingGameOnWin(game) {
  chrome.alarms.clear("liveGame");
  let win = determineWinner(game);
  let winTitle =  win["winnerShort"] + " wins! " + "(" + win["awayShort"] +  ": " + win["awayGoals"] + " | " + win["homeShort"] +  ": " + win["homeGoals"] + ")";
  let winMsg = "The " + win["winner"] + " win in " + win["winType"] + "!";
  sendNotification(winTitle,winMsg,game[win["winnerLoc"]]["logo"],game[win["winnerLoc"]]["goalHorn"],game[win["winnerLoc"]]["hornLength"]).then((res) => {
    chrome.storage.local.get(["soundWindowId"], function(results) {
      if (results.soundWindowId != undefined || results.soundWindowId != null ) {
        timer = setTimeout(function() {chrome.windows.remove(results.soundWindowId)},game[win["winnerLoc"]]["hornLength"]); 
      }
    });
  });
}