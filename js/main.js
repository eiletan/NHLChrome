chrome.storage.local.get(["MAXHEIGHT","MAXWIDTH"], function (result) {
  if (result.MAXHEIGHT == undefined || result.MAXWIDTH == undefined) {
    chrome.storage.local.set({"MAXHEIGHT": window.screen.availHeight, "MAXWIDTH": window.screen.availWidth}, function () {
      console.log("height and width stored");
    });
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    let gameUpdate = request.gameUpdate;
    console.log("message received")
    if (gameUpdate != undefined) {
      console.log("printing gameUpdate from service worker");
      console.log(gameUpdate);
      let el = document.getElementById("score");
      setScoreboard(gameUpdate);
      let score = gameUpdate["awayShort"] + ": " + gameUpdate["currentState"]["away"]["goals"] + " | " + gameUpdate["homeShort"] + ": " + gameUpdate["currentState"]["home"]["goals"];
      el.innerHTML = score;
      return true;
    }
  } catch (err) {
    console.log(err);
  }
  
})



document.getElementById("button").addEventListener("click", function () {
  console.log(new Date().toLocaleDateString("en-CA",{timeZone: "America/New_York"}));
});


document.getElementById("buttonAlarm").addEventListener("click", function () {
  var alarmInfo = {
    "periodInMinutes": 1,
  }
  chrome.alarms.create("liveGame", alarmInfo);
  chrome.alarms.get("liveGame", function (alarm) {
    console.log("alarm found");
    console.log(alarm);
  })
  chrome.alarms.getAll(function(as) {
    console.log(as);
  })
});

document.getElementById("buttonClear").addEventListener("click", function () {
  chrome.alarms.clearAll();
  chrome.storage.local.get(["teams"], function(result) {
    let teams = result.teams;
    chrome.notifications.create({
      title: "VAN GOAL",
      message: "GOAL SCORED BY #40, ASSISTED BY #9 and #43",
      type: "basic",
      iconUrl:  teams["Vancouver Canucks"]["logo"],
      silent: true
    });
    chrome.storage.local.get(["MAXHEIGHT", "MAXWIDTH"], function (heightResult) {
      let url = chrome.runtime.getURL("audio.html");
      url += "?volume=0.6&src=" + teams["Vancouver Canucks"]["goalHorn"] + "&length=" + notifLength;
  
      // Create window to play sound if one does not exist already
      chrome.storage.local.get(["soundTabId"], function (result) {
        let soundTabId = result.soundTabId;
        console.log(soundTabId);
        if (soundTabId == undefined) {
          createWindowForSound(url,heightResult);
        } else {
          chrome.tabs.get(soundTabId, function () {
            if (chrome.runtime.lastError) {
              createWindowForSound(url,heightResult);
            } else {
              chrome.tabs.update(soundTabId, { url: url });
            }
          });
        }
      });
    });

})

  
});

function displayGame() {
  chrome.storage.local.get(["gameTrackingStatus"], function (result) {
    // If game is being tracked, hide list of games today, else show list of games today
    if (gameTrackingStatus) {

    } else {

    }
  })
}


function setScoreboard(game) {
  let team1Abr = document.getElementsByClassName("gameScoreBoardInfo teamScoreboardAbbr teamOneScoreboardAbbr")[0];
  let team2Abr = document.getElementsByClassName("gameScoreBoardInfo teamScoreboardAbbr teamTwoScoreboardAbbr")[0];
  let team1Score = document.getElementsByClassName("gameScoreBoardInfo teamScoreboardScore teamOneScoreboardScore")[0];
  let team2Score = document.getElementsByClassName("gameScoreBoardInfo teamScoreboardScore teamTwoScoreboardScore")[0];
  let team1Logo = document.getElementsByClassName("scoreboardLogoImg teamOneScoreboardLogoImg")[0];
  let team2Logo = document.getElementsByClassName("scoreboardLogoImg teamTwoScoreboardLogoImg")[0];
  team1Abr.innerHTML = game["away"]["abbreviation"];
  team1Abr.style.background = game["away"]["color"];
  team2Abr.innerHTML = game["home"]["abbreviation"];
  team2Abr.style.background = game["home"]["color"];
  team1Score.innerHTML = game["currentState"]["away"]["goals"];
  team2Score.innerHTML = game["currentState"]["home"]["goals"];
  team1Logo.src = game["away"]["logo"];
  team1Logo.style.background = game["away"]["color"];
  team2Logo.src = game["home"]["logo"];
  team2Logo.style.background = game["home"]["color"];
}