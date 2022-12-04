// Display game if one is currently being "watched"
window.onload = function () {
  displayUI();
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
      let gameTableDiv = document.getElementById("gamesTableDiv");
      gameTableDiv.style.display = "block";
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



document.getElementById("buttonStopTracking").addEventListener("click", function() {
  let self = document.getElementById("buttonStopTracking");
  stopTrackingGameFromUI();
  self.setAttribute("hidden", "hidden");
});

/**
 * Display current game information on the UI
 */
function displayGame() {
  chrome.storage.local.get(["currentGame"], function (result) {
    let curGame = result.currentGame;
    displayGameHelper(curGame);
  });
}

/**
 * Display scheduled games on the UI
 */
function displayGamesToday() {
  chrome.storage.local.get(["gamesForToday"], function (result) {
    let games = result.gamesForToday;
    let gamesTable = document.getElementsByClassName("gamePreviewsTable")[0];
    if (games && games.length != 0) {
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
          previewRow.dataset.gameId = game["gamePk"];
          previewRow.append(teamOneLogo,teamOneAbbr,at,teamTwoAbbr,teamTwoLogo,time);

          let cells = previewRow.getElementsByTagName("td");
          let defaultColor = "gainsboro";
          for (cell of cells) {
            cell.style.backgroundColor = defaultColor;
          }


          gamesTable.append(previewRow);
          
          // Create event listener for each row which will start the tracking of a game by sending message to service worker
          previewRow.addEventListener('click', function() {
            chrome.runtime.sendMessage({gameId: previewRow.dataset.gameId});
          });


          previewRow.addEventListener('mouseover', function() {
            for (cell of cells) {
              cell.style.backgroundColor = internalTeams[home]["color"];
            }
            
          });

          previewRow.addEventListener('mouseout', function() {
            for (cell of cells) {
              cell.style.backgroundColor = defaultColor;
            }
            
          });
          
        }
      })
    } else {
      while (gamesTable.firstChild) {
        gamesTable.removeChild(gamesTable.firstChild);
        document.getElementById("gamesTableDiv").innerHTML = "No Games Scheduled For Today";
      }
    }
  });
}

/**
 * Helper function for DisplayGame(), actually sets the game to the custom scoreboard
 * @param {*} game JSON representation of the game 
 */
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
  team2Logo.src = game["home"]["logo"];

  let gameState = game["currentState"];

  if (!gameState) {
    team1SOG.innerHTML = "SOG: 0";
    team2SOG.innerHTML = "SOG: 0";
  } else {
    team1SOG.innerHTML = "SOG: " + (gameState?.["away"]?.["shots"] ? gameState?.["away"]?.["shots"] : 0);
    team2SOG.innerHTML = "SOG: " + (gameState?.["home"]?.["shots"] ? gameState?.["home"]?.["shots"] : 0);

    if (gameState["period"] != undefined && gameState["period"].valueOf() == "SO") {
      team1SOG.innerHTML = "SO: " + gameState["away"]["shootoutGoalsScored"] + "/" + gameState["away"]["shootoutAttempts"];
      team2SOG.innerHTML = "SO: " + gameState["home"]["shootoutGoalsScored"] + "/" + gameState["home"]["shootoutAttempts"];
    }
  
    if (gameState["away"]["powerplay"] != undefined && gameState["away"]["powerplay"] == true) {
      team1Strength.innerHTML = "<b>PP</b>";
    }
    if (gameState["away"]["powerplay"] != undefined && gameState["away"]["powerplay"] == true && gameState["away"]["goaliePulled"] == true) {
      team1Strength.innerHTML = "<b>PP <br> EN</b>";
    }
    if (gameState["away"]["powerplay"] != undefined && gameState["away"]["powerplay"] == false && gameState["away"]["goaliePulled"] == true) {
      team1Strength.innerHTML = "<b>EN</b>";
    }
    if (gameState["away"]["powerplay"] == false && gameState["away"]["goaliePulled"] == false) {
      team1Strength.innerHTML = "";
    }

    if (gameState["home"]["powerplay"] != undefined && gameState["home"]["powerplay"] == true) {
      team2Strength.innerHTML = "<b>PP</b>";
    }
    if (gameState["home"]["powerplay"] != undefined && gameState["home"]["powerplay"] == true && gameState["home"]["goaliePulled"] == true) {
      team2Strength.innerHTML = "<b>PP <br> EN</b>";
    }
    if (gameState["home"]["powerplay"] != undefined && gameState["home"]["powerplay"] == false && gameState["home"]["goaliePulled"] == true) {
      team2Strength.innerHTML = "<b>EN</b>";
    }
    if (gameState["home"]["powerplay"] == false && gameState["home"]["goaliePulled"] == false){
      team2Strength.innerHTML = "";
    }

    if (gameState["periodTimeRemaining"] != undefined || gameState["periodTimeRemaining"] != null) {
      gameTime.innerHTML = gameState["periodTimeRemaining"];
    } else {
      gameTime.innerHTML = "SCHEDULED";
    }
  
    if (gameState["period"] != undefined || gameState["period"] != null) {
      gamePeriod.innerHTML = gameState["period"];
    } else {
      gamePeriod.innerHTML = "1st";
    }

  }

  
  let playoffInfo = document.getElementById("playoffSeriesInfo");

  if (game["playoffSeries"] != null) {
    playoffInfo.innerHTML = game["playoffSeries"]["round"] + " | " + game["playoffSeries"]["gamenum"] + " | " + game["playoffSeries"]["seriesStatus"];
    playoffInfo.style.display = "inline";
  } else {
    playoffInfo.style.display = "none";    
  }


}

/**
 * Helper function for displayGame()
 * @param {*} curGame JSON representation of the game
 */
function displayGameHelper(curGame) {
  if (curGame != null && curGame != undefined) {
    setScoreboard(curGame);
    let buttonStop = document.getElementById("buttonStopTracking");
    buttonStop.removeAttribute("hidden");
  } else {
    chrome.storage.local.get(["NHLObj"], function (results) {
      let nhlObj = results.NHLObj;
      let fakeGame = {};
      fakeGame["away"] = {};
      fakeGame["home"] = {};
      fakeGame["currentState"] = {};
      fakeGame["currentState"]["away"] = {};
      fakeGame["currentState"]["home"] = {};
      fakeGame["away"]["abbreviation"] = nhlObj["name"];
      fakeGame["home"]["abbreviation"] = nhlObj["name"];
      fakeGame["away"]["color"] = nhlObj["color"];
      fakeGame["home"]["color"] = nhlObj["color"];
      fakeGame["currentState"]["away"]["goals"] = 0;
      fakeGame["currentState"]["home"]["goals"] = 0;
      fakeGame["currentState"]["away"]["shots"] = 0;
      fakeGame["currentState"]["home"]["shots"] = 0;
      fakeGame["currentState"]["periodTimeRemaining"] = "20:00";
      fakeGame["currentState"]["period"] = "1st";
      fakeGame["away"]["logo"] = nhlObj["logo"];
      fakeGame["home"]["logo"] = nhlObj["logo"];
      setScoreboard(fakeGame);
    });
  }
}


/**
 * Initialize UI display
 */
function displayUI() {
  chrome.storage.local.get(["currentGame","gameListDate"], function (result) {
    let curGame = result.currentGame;
    displayGameHelper(curGame);
    let gameTableDiv = document.getElementById("gamesTableDiv");
    if (curGame != undefined || curGame != null) {
      gameTableDiv.style.display = "none";
    } else {
      if (result.gameListDate != null || result.gameListDate != undefined) {
        let gameListUpdateDate = new Date(result.gameListDate);
        let date = new Date().toLocaleDateString("en-CA",{timeZone: "America/Los_Angeles"});
        let dateActual = new Date(date)
        if (dateActual.getTime() != gameListUpdateDate.getTime()) {
          chrome.runtime.sendMessage({updateGameList: true});
        } else {
          gameTableDiv.style.display = "block";
          displayGamesToday();
        }
      } else {
        chrome.runtime.sendMessage({updateGameList: true});
      }
    }
  });

}

/**
 * Stops the tracking of the current game and makes list of scheduled games visible again
 */
function stopTrackingGameFromUI() {
  chrome.alarms.clear("liveGame");
  chrome.storage.local.set({"currentGame": null}, function() {
    displayUI();
  });
  try {
    chrome.storage.local.get(["soundWindowId"], function(results) {
      chrome.windows.remove(results.soundWindowId);
    });
  } catch(err) {
    console.log(err);
  }

}