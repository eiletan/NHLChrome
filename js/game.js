/**
 * Find all NHL games occuring on the passed in date
 * @param {String} date Date of the game - Must be in format "YYYY-MM-DD"
 * @returns {Promise} Promise that resolves with the list of games for the date as an array 
 */
function findGames(date) {
    let gamesList = null;
    let retprom = new Promise((resolve,reject) => {
        GetFromNHLApi("/schedule?date=" + date).then((games) => {
            gamesList = games["dates"][0]["games"];
            console.log(gamesList);
            resolve(gamesList);
            return;
        }).catch((err) => {
            reject("Games for " + date + " could not be found. Please try again");
            return;
        });
    });
    return retprom;
}

/**
 * Find the NHL game involving the passed in team on the given date
 * @param {String} team Name of the team 
 * @param {String} date Date of the game - Must be in format "YYYY-MM-DD"
 * @returns the NHL game as a JSON object, else an exception is thrown
 */
function findGameForTeam(team, date) {
    let retprom = new Promise((resolve,reject) => {
        try {
            findGames(date).then((retgames) => {
                let found = false;
                for (game of retgames) {
                    let awayTeam = game["teams"]["away"]["team"]["name"]
                    let homeTeam = game["teams"]["home"]["team"]["name"]
                    if (matchTeamName(awayTeam, team) || matchTeamName(homeTeam, team)) {
                        found = true;
                        console.log(game);
                        resolve(game);
                    }
                }
                if (found == false) {
                    reject("Game for " + team + " could not be found. Please try again.");
                }
            }).catch((err) => {
                reject(err);
            });
        } catch (err) {
            throw err;
        }
    });
    return retprom;
}

/**
 * Compares two team names. Ignores accents and case, and is capable of comparing shortened versions of team names. Ex. "Vancouver Canucks" and "Canucks" would be equivalent.
 * @param {String} teamNameA First team name to be compared
 * @param {String} teamNameB Second team name to be compared
 * @returns True if the teams are the same, false otherwise
 */
function matchTeamName(teamNameA, teamNameB) {
    try {
        teamNameA = decodeURIComponent(escape(teamNameA));
        teamNameB = decodeURIComponent(escape(teamNameB));
        teamNameA = teamNameA.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        teamNameB = teamNameB.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        teamNameA = teamNameA.toLowerCase();
        teamNameB = teamNameB.toLowerCase();
    } catch {
        teamNameA = teamNameA.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        teamNameB = teamNameB.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        teamNameA = teamNameA.toLowerCase();
        teamNameB = teamNameB.toLowerCase();
    }

    if (teamNameA.valueOf() == teamNameB.valueOf()) {
        return true;
    } else {
        teamADelimited = teamNameA.split(" ");
        for (word of teamADelimited) {
            if (word.valueOf() == teamNameB.valueOf()) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Creates an internal record of a NHL game and saves it to local storage.
 * @param {String} gameid Internal ID of a NHL game 
 * @returns a Promise that resolves when the internal record of the game is created and saved to local storage
 */
function createGame(gameid) {
    let retprom = new Promise((resolve,reject) => {
      GetFromNHLApi("/game/" + gameid + "/feed/live/diffPatch?startTimecode=").then((response) => {
          let gameData = response["gameData"];
          let homeTeam = gameData["teams"]["home"]["name"];
          let awayTeam = gameData["teams"]["away"]["name"];
          let gameObj = {};
          gameObj["home"] = homeTeam;
          gameObj["away"] = awayTeam;
          gameObj["id"] = gameid;
          gameObj["allGoals"] = [];
          gameObj["currentState"] = {};
          // Save to local storage
          chrome.storage.local.set({ currentGame: gameObj  }, function () {
            console.log("Game have been saved to local storage: " + gameObj);
            console.log(gameObj);
            resolve(gameObj);
            return;
          });
        }).catch((err) => {
            reject("Game could not be created due to: " + err);
            return;
        });
    });
    return retprom;
  }

  function getAllGoalsScored(gameid, gameson) {
      let retprom = new Promise((resolve,reject) => {
          GetFromNHLApi("/game/" + gameid + "/feed/live/diffPatch?startTimecode=").then((game) => {
              gameData = game["liveData"]["plays"]["allPlays"];
              goals = [];
              firstGoalFound = false;
              for(let i = gameData.length - 1; i >= 0; i--) {
                  let gameEvent = gameData[i];
                  let gameEventType = gameEvent["result"]["eventTypeId"];
                  if (gameEventType.valueOf() === "GOAL") {
                      if (firstGoalFound == false && gameson["allGoals"].length > 0) {
                          if (gameson["allGoals"][0]["about"]["eventId"] == gameEvent["about"]["eventId"]) {
                              resolve(gameson["allGoals"]);
                              return;
                          } else {
                              firstGoalFound = true;
                              goals.push(gameEvent);
                          }
                      } else {
                          goals.push(gameEvent);
                      }
                  }
              }
              resolve(goals);
              return;
          }).catch((err) => {
              reject("Error retrieving game data: " + err);
              return;
          });
      })
      return retprom;
  }
  