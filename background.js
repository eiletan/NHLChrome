try {
    importScripts("js/api.js","js/game.js","js/init.js");
} catch (err) {
    console.log(err);
}


chrome.alarms.onAlarm.addListener(onAlarm);


function onAlarm(alarm) {
    console.log("refreshing!");
    initTeams();
    createGame("2021030173").then((gameObj) => {
      return updateGameStatus();
    }).then((gameStatus) => {
      console.log("updated: ");
      console.log(gameStatus);
    }).catch((err) => {
      console.log(err); 
    });
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





console.log("hi");