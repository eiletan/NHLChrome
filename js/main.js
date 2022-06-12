// Display game if one is currently being "watched"
window.onload = function () {
  displayGame();
  displayGamesToday();
}


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
    let games = request.gamesForToday;
    console.log("message received");
    if (gameUpdate != undefined) {
      console.log("printing gameUpdate from service worker");
      console.log(gameUpdate);
      setScoreboard(gameUpdate);
      return true;
    }
    if (games != undefined) {
      console.log("printing games from service worker");
      console.log(games);
      displayGamesToday(games);
    }
    if (request.createGameSuccess == true) {
      // If game is created and updated successfully, display it on the screen and hide the gamesToday table
      console.log("game created being displayed");
      displayGame();
      let gameTableDiv = document.getElementById("gamesTableDiv");
      gameTableDiv.style.display = "none";
    }
  } catch (err) {
    console.log(err);
  }
  
})



document.getElementById("button").addEventListener("click", function () {
  let date = String(new Date().toLocaleDateString("en-CA",{timeZone: "America/Los_Angeles"}));
  console.log(date);
  chrome.alarms.getAll(function(alarms){
    console.log(alarms);
  })
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
  chrome.alarms.clear("liveGame");
  // chrome.alarms.clearAll();
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
  chrome.storage.local.get(["currentGame"], function (result) {
    let curGame = result.currentGame;
    if (curGame != null && curGame != undefined) {
      setScoreboard(curGame);
    }
  });
}

function displayGamesToday() {
  chrome.storage.local.get(["gamesForToday"], function (result) {
    let games = result.gamesForToday;
    let gamesTable = document.getElementsByClassName("gamePreviewsTable")[0];
    if (games.length != 0) {
      chrome.storage.local.get(["teams"], function (teamresults) {
        let internalTeams = teamresults.teams;
        let wipeIndex = 0;
        let game = games[0];
        for (game of games) {
          let away = game["teams"]["away"]["team"]["name"];
          let home = game["teams"]["home"]["team"]["name"];
          let awayLogo = internalTeams[away]["logo"];
          let homeLogo = internalTeams[home]["logo"];
          let awayAbbr = internalTeams[away]["abbreviation"];
          let homeAbbr = internalTeams[home]["abbreviation"];
          if (wipeIndex == 0) {
            wipeIndex = wipeIndex + 1;
            // If table is different from the list of games in the local storage, wipe the table and render it again
            let tableAwayAbbr = document.getElementsByClassName("gamePreviewsInfo gamePreviewsAbbr gamePreviewsTeamOneAbbr")[0];
            let tableHomeAbbr = document.getElementsByClassName("gamePreviewsInfo gamePreviewsAbbr gamePreviewsTeamTwoAbbr")[0];
            if (tableAwayAbbr.innerHTML.valueOf() != awayAbbr.valueOf() || tableHomeAbbr.innerHTML.valueOf() != homeAbbr.valueOf()) {
              while (gamesTable.firstChild) {
                console.log(gamesTable.firstChild);
                gamesTable.removeChild(gamesTable.firstChild);
              }
            } else if (tableAwayAbbr.innerHTML.valueOf() == awayAbbr.valueOf() && tableHomeAbbr.innerHTML.valueOf() == homeAbbr.valueOf()) {
              break;
            }
          }
          // Create table elements
          let teamOneLogo = document.createElement("td");
          teamOneLogo.className = "gamePreviewsInfo gamePreviewsLogo gamePreviewsTeamOneLogo";
          let teamOneLogoImg = document.createElement("img");
          teamOneLogoImg.class = "gamePreviewsLogoImg gamePreviewsTeamOneLogoImg";
          teamOneLogoImg.style.width = "50px";
          teamOneLogoImg.style.height = "50px";
          teamOneLogoImg.style.display = "block";
          teamOneLogoImg.src = awayLogo;
          teamOneLogoImg.style.objectFit = "contain";
          teamOneLogo.append(teamOneLogoImg);

          let teamOneAbbr = document.createElement("td");
          teamOneAbbr.className = "gamePreviewsInfo gamePreviewsAbbr gamePreviewsTeamOneAbbr";
          teamOneAbbr.innerHTML = awayAbbr;
          let at = document.createElement("td");
          at.className = "gamePreviewsInfo gamePreviewsAt";
          at.innerHTML = "@";


          let teamTwoLogo = document.createElement("td");
          teamTwoLogo.className = "gamePreviewsInfo gamePreviewsLogo gamePreviewsTeamTwoLogo";
          let teamTwoLogoImg = document.createElement("img");
          teamTwoLogoImg.class = "gamePreviewsLogoImg gamePreviewsTeamTwoLogoImg";
          teamTwoLogoImg.src = homeLogo;
          teamTwoLogoImg.style.width = "50px";
          teamTwoLogoImg.style.height = "50px";
          teamTwoLogoImg.style.display = "block";
          teamTwoLogoImg.style.objectFit = "contain";
          teamTwoLogo.append(teamTwoLogoImg);

          let teamTwoAbbr = document.createElement("td");
          teamTwoAbbr.className = "gamePreviewsInfo gamePreviewsAbbr gamePreviewsTeamTwoAbbr";
          teamTwoAbbr.innerHTML = homeAbbr;

          let time = document.createElement("td");
          time.className = "gamePreviewsInfo gamePreviewsTime";
          let startTime = new Date(game["gameDate"]);
          startTime = startTime.toLocaleString('en-US', { hour: 'numeric',minute: 'numeric', hour12: true });
          time.innerHTML = startTime;
          

          let previewRow = document.createElement("tr");
          previewRow.className = "gamePreviews";
          previewRow.append(teamOneLogo,teamOneAbbr,at,teamTwoAbbr,teamTwoLogo,time);
          console.log(previewRow);
          gamesTable.append(previewRow);
          
          // Create event listener for each row which will start the tracking of a game by sending message to service worker
          previewRow.addEventListener('click', function() {
            chrome.runtime.sendMessage({gameId: game["gamePk"]});
          });

        }
      })
    } else {
      while (gamesTable.firstChild) {
        console.log(gamesTable.firstChild);
        gamesTable.removeChild(gamesTable.firstChild);
      }
    }
  });
}

function setScoreboard(game) {
  let team1Abr = document.getElementsByClassName("gameScoreBoardInfo teamScoreboardAbbr teamOneScoreboardAbbr")[0];
  let team2Abr = document.getElementsByClassName("gameScoreBoardInfo teamScoreboardAbbr teamTwoScoreboardAbbr")[0];
  let team1Score = document.getElementsByClassName("gameScoreBoardInfo teamScoreboardScore teamOneScoreboardScore")[0];
  let team2Score = document.getElementsByClassName("gameScoreBoardInfo teamScoreboardScore teamTwoScoreboardScore")[0];
  let team1Logo = document.getElementsByClassName("scoreboardLogoImg teamOneScoreboardLogoImg")[0];
  let team2Logo = document.getElementsByClassName("scoreboardLogoImg teamTwoScoreboardLogoImg")[0];
  let team1SOG = document.getElementsByClassName("gameScoreBoardStatusInfo teamShotsOnGoal teamOneScoreboardShotsOnGoal")[0];
  let team2SOG = document.getElementsByClassName("gameScoreBoardStatusInfo teamShotsOnGoal teamTwoScoreboardShotsOnGoal")[0];
  let team1Strength = document.getElementsByClassName("gameScoreBoardStatusInfo teamStrengthStatus teamOneScoreboardStrength")[0];
  let team2Strength = document.getElementsByClassName("gameScoreBoardStatusInfo teamStrengthStatus teamTwoScoreboardStrength")[0];
  let gameTime = document.getElementsByClassName("gameScoreBoardStatusInfo gameTime")[0];
  let gamePeriod = document.getElementsByClassName("gameScoreBoardStatusInfo gamePeriod")[0];
  team1Abr.innerHTML = game["away"]["abbreviation"];
  team1Abr.style.backgroundColor = game["away"]["color"];
  team2Abr.innerHTML = game["home"]["abbreviation"];
  team2Abr.style.backgroundColor = game["home"]["color"];
  
  team1Score.innerHTML = game["currentState"]["away"]["goals"];
  team2Score.innerHTML = game["currentState"]["home"]["goals"];
  
  team1Logo.src = game["away"]["logo"];
  team1Logo.style.backgroundColor = "white";
  team2Logo.src = game["home"]["logo"];
  team2Logo.style.backgroundColor = "white";

  let gameState = game["currentState"];

  team1SOG.innerHTML = "SOG: " + gameState["away"]["shots"];
  team2SOG.innerHTML = "SOG: " + gameState["home"]["shots"];

  if (gameState["period"].valueOf() == "SO") {
    team1SOG.innerHTML = "SO: " + gameState["away"]["shootoutScore"];
    team2SOG.innerHTML = "SO: " + gameState["home"]["shootoutScore"];
  }
  
  if (gameState["away"]["powerplay"] == true) {
    team1Strength.innerHTML = "<b>PP</b>";
  }
  else if (gameState["away"]["powerplay"] == true && gameState["away"]["goaliePulled"] == true) {
    team1Strength.innerHTML = "<b>PP <br> EN</b>";
  }
  else if (gameState["away"]["powerplay"] == false && gameState["away"]["goaliePulled"] == true) {
    team1Strength.innerHTML = "<b>EN</b>";
  }
  else {
    team1Strength.innerHTML = "";
  }

  if (gameState["home"]["powerplay"] == true) {
    team2Strength.innerHTML = "<b>PP</b>";
  }
  else if (gameState["home"]["powerplay"] == true && gameState["home"]["goaliePulled"] == true) {
    team2Strength.innerHTML = "<b>PP <br> EN</b>";
  }
  else if (gameState["home"]["powerplay"] == false && gameState["home"]["goaliePulled"] == true) {
    team2Strength.innerHTML = "<b>EN</b>";
  }
  else {
    team2Strength.innerHTML = "";
  }

  gameTime.innerHTML = gameState["periodTimeRemaining"];
  gamePeriod.innerHTML = gameState["period"];
  let playoffInfo = document.getElementById("playoffSeriesInfo");

  if (game["playoffSeries"] != null) {
    playoffInfo.innerHTML = "Round: " + game["playoffSeries"]["round"] + " | " + game["playoffSeries"]["gamenum"] + " | " + game["playoffSeries"]["seriesStatus"];
    playoffInfo.style.display = "inline";
  } else {
    playoffInfo.style.display = "none";    
  }


}