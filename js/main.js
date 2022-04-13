var nhlbase = "https://statsapi.web.nhl.com/api/v1";

/**
 * Makes a GET request to the NHL API
 * @param {String} uri uri for the NHL API ex. "/teams"
 * @returns {Promise} Promise that resolves with the API response in JSON format
 */
function GetFromNHLApi(uri) {
  let xhttp = new XMLHttpRequest();
  xhttp.responseType = "json";
  let promise = new Promise((resolve, reject) => {
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        resolve(xhttp.response);
      } else if (this.readyState == 4 && this.status != 200) {
        reject(xhttp.response);
      }
    };
    xhttp.open("GET", nhlbase + uri, true);
    xhttp.send();
  });
  return promise;
}

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
          internalTeamsJson[obj["name"]] = obj;
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

document.getElementById("button").addEventListener("click", function () {
  // GetFromNHLApi("/teams")
  //   .then((teams) => {
  //     console.log(teams["teams"]);
  //     return GetFromNHLApi("/schedule?date=2022-04-03");
  //   })
  //   .then((games) => {
  //     console.log(games);
  //   })
  //   .catch((err) => {
  //     console.log("error");
  //     console.log(err);
  //   });
  findGameForTeam("Vancouver Canucks", "2022-04-10")
    .then((gameId) => {
      console.log(gameId);
    })
    .catch((err) => {
      console.log("error");
      console.log(err);
    });

  initTeams();
  createGame("2021021175").then((gameObj) => {
    return getAllGoalsScored("2021021175",gameObj);
  }).then((goals) => {
    console.log(goals);
  }).catch((err) => {
    console.log(err);
  });
});
