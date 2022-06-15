try {
    importScripts("js/api.js","js/game.js","js/init.js", "js/util.js");
} catch (err) {
    console.log(err);
}



chrome.runtime.onInstalled.addListener(function() {
  // When extension is installed or reloaded, create alarm for getting games daily, and re-initalize teams data in local storage
  createAlarmForDailySchedule();
  initTeams();
});


chrome.runtime.onStartup.addListener(function() {
  createAlarmForDailySchedule();
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
      if (gameTime.valueOf() == "Final") {
        stopTrackingGame(gameObj);
        chrome.runtime.sendMessage({createGameSuccess: true});
      } else {
        // Open sound window in advance, playing the home team's goal horn
        playSound(gameStatus["home"]["goalHorn"]);
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
  }
});

chrome.alarms.onAlarm.addListener(onAlarm);

function onAlarm(alarm) {
  if (alarm["name"] ==  "getScheduleForToday") {
    let date = String(new Date().toLocaleDateString("en-CA",{timeZone: "America/Los_Angeles"}));
    findGames(date).then((games) => {
      console.log(games);
      chrome.storage.local.set({"gamesForToday": games});
      chrome.runtime.sendMessage({gamesForToday: games});
    }).catch((err) => {
      console.log(err);
    });
  } else if (alarm["name"] == "liveGame") {
    console.log("refreshing!");
    updateGameStatus().then((gameStatus) => {
      let gameTime = gameStatus["currentState"]["periodTimeRemaining"];
      if (gameTime.valueOf() == "Final") {
        stopTrackingGame(gameStatus);
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


function createAlarmForDailySchedule() {
  console.log("This function ran");
  chrome.alarms.get("getScheduleForToday", function(alarm) {
    // If alarm to get schedule doesn't exist, create it
    if (alarm == undefined || alarm == null) {
      // Run alarm to get daily schedule at 12am PST
      let startDate = new Date();
      let offset = startDate.getTimezoneOffset()/60;
      console.log(startDate.getMinutes())
      let endDate = new Date();
      endDate.setDate(startDate.getDate()+1);
      endDate.setHours(7-offset,5,0);
      console.log(endDate.getTime());
      let mseconds = (endDate.getTime() - startDate.getTime());
      console.log(mseconds);
      let alarmJson = {
        periodInMinutes: 1440,
        when: Date.now() + mseconds
      };
      chrome.alarms.create("getScheduleForToday",alarmJson);
    }
  })
}


function stopTrackingGame(game) {
  chrome.alarms.clear("liveGame");
  let win = determineWinner(game);
  let winTitle =  win["winnerShort"] + " wins! " + "(" + win["awayShort"] +  ": " + win["awayGoals"] + " | " + win["homeShort"] +  ": " + win["homeGoals"] + ")";
  let winMsg = "The " + win["winner"] + " win in " + win["winType"] + "!";
  sendNotification(winTitle,winMsg,game[win["winnerLoc"]]["logo"],game[win["winnerLoc"]]["goalHorn"]).then((res) => {
    chrome.storage.local.get(["soundWindowId"], function(results) {
      if (results.soundWindowId != undefined || results.soundWindowId != null ) {
        timer = setTimeout(function() {chrome.windows.remove(results.soundWindowId)},notifLength); 
      }
    });
  });

}