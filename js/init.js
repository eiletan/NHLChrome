/**
 * Initializes team directory as a JSON object in local storage by combining data from
 * a local json file and the NHL API
 */
 function initTeams() {
    const url = chrome.runtime.getURL("data/teams/teams.json");
    fetch(url)
      .then((response) => response.json())
      .then((json) => initTeamsHelper(json)).catch((err) => {
        throw err;
      });
  }
  
  function initTeamsHelper(localTeamsJson) {
    GetFromNHLApi("/teams").then((teams) => {
        let apiteams = teams["teams"];
        let internalTeamsJson = {};
        for (team of localTeamsJson) {
          if (team["name"].valueOf() != "NHL") {
            let obj = {};
            obj["name"] = team["name"];
            obj["logo"] = team["logo"];
            obj["color"] = team["color"];
            obj["goalHorn"] = team["goalHorn"];
            obj["hornLength"] = team["hornLength"];
            internalTeamsJson[obj["name"]] = obj;
          } else if (team["name"].valueOf() == "NHL") {
            chrome.storage.local.set({"NHLObj": team});
          }
        }
        let keys = Object.keys(internalTeamsJson);
        for (apiteam of apiteams) {
          if (apiteam["active"] === true) {
            if (keys.includes(apiteam["name"])) {
              internalTeamsJson[apiteam["name"]]["id"] = apiteam["id"];
              internalTeamsJson[apiteam["name"]]["abbreviation"] = apiteam["abbreviation"];
              internalTeamsJson[apiteam["name"]]["shortName"] = apiteam["shortName"];
              internalTeamsJson[apiteam["name"]]["teamName"] = apiteam["teamName"];
            } else {
              internalTeamsJson[apiteam["name"]]["id"] = apiteam["id"];
              internalTeamsJson[apiteam["name"]]["abbreviation"] = apiteam["abbreviation"];
              internalTeamsJson[apiteam["name"]]["shortName"] = apiteam["shortName"];
              internalTeamsJson[apiteam["name"]]["teamName"] = apiteam["teamName"];
              internalTeamsJson[apiteam["name"]]["logo"] = localTeamsJson["NHL"]["logo"];
              internalTeamsJson[apiteam["name"]]["color"] = localTeamsJson["NHL"]["color"];
              internalTeamsJson[apiteam["name"]]["goalHorn"] = localTeamsJson["NHL"]["goalHorn"];
            }
          }
        }
        // Save to local storage
        chrome.storage.local.set({"teams": internalTeamsJson}, function() {
          console.log("Teams have been saved to local storage: " + internalTeamsJson);
        });
      }).catch((err) => {
        console.log(err);
        throw "Team initialization failed. Please try again";
      });
  }


  /**
   * Fetches list of games for the given date and stores it in chrome local storage
   * @param {String} date 
   */
  function initScheduledGames(date) {
    findGames(date).then((games) => {
      console.log(games);
      chrome.storage.local.set({"gamesForToday": games});
      chrome.storage.local.set({"gameListDate" : date})
      chrome.runtime.sendMessage({gamesForToday: games});
    }).catch((err) => {
      console.log(err);
    });
  }