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
 * @returns a Promise that resolves with the NHL game as a JSON object, else an exception is thrown
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
 * @param {String} gameid API internal ID of a NHL Game 
 * @returns a Promise that resolves with an JSON object when the internal record of the game is created and saved to local storage
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
          chrome.storage.local.set({ "currentGame": gameObj, "currentGameId": gameid}, function () {
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

  /**
   * Gets a live update for the game specified by gameid and returns all goals scored in the game at the present moment as an array
   * @param {String} gameid API internal ID of a NHL Game
   * @returns a Promise that resolves with an array that contains all goals scored currently from last to first.
   */
  function getAllGoalsScored(gameid) {
      let retprom = new Promise((resolve,reject) => {
          GetFromNHLApi("/game/" + gameid + "/feed/live/diffPatch?startTimecode=").then((game) => {
              gameData = game["liveData"]["plays"]["allPlays"];
              goals = [];
              firstGoalFound = false;
              let gameson;
                  chrome.storage.local.get(["currentGame"], function(result) {  
                    gameson = result.currentGame;
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
                  });
          }).catch((err) => {
              reject("Error retrieving game data: " + err);
              return;
          });
      })
      return retprom;
  }
  
  /**
   * Gets a live update for the game specified by gameid and returns the state of the game as an JSON object
   * @param {String} gameid API internal ID of a NHL Game
   * @returns a Promise that resolves with the state of the game as an JSON object
   */
  function getGameState(gameid) {
      let retprom = new Promise((resolve,reject) => {
          GetFromNHLApi("/game/" + gameid + "/feed/live/diffPatch?startTimecode=").then((game) => {
              let current = game["liveData"]["linescore"];
              let homeTeamAPI = current["teams"]["home"];
              let awayTeamAPI = current["teams"]["away"];
              let homeTeam = {};
              let awayTeam = {};
              homeTeam["goals"] = homeTeamAPI["goals"];
              homeTeam["shots"] = homeTeamAPI["shotsOnGoal"];
              homeTeam["powerplay"] = homeTeamAPI["powerPlay"];
              homeTeam["goaliePulled"] = homeTeamAPI["goaliePulled"];
              awayTeam["goals"] = awayTeamAPI["goals"];
              awayTeam["shots"] = awayTeamAPI["shotsOnGoal"];
              awayTeam["powerplay"] = awayTeamAPI["powerPlay"];
              awayTeam["goaliePulled"] = awayTeamAPI["goaliePulled"];
              let gameState = {};
              gameState["period"] = current["currentPeriodOrdinal"];
              gameState["periodTimeRemaining"] = current["currentPeriodTimeRemaining"];
              homeTeam["shootoutScore"] = null;
              awayTeam["shootoutScore"] = null;
              if (gameState["period"] === "SO") {
                  let homeShootoutScore = current["shootoutInfo"]["home"]["scores"] + "/" +  current["shootoutInfo"]["home"]["attempts"];
                  let awayShootoutScore = current["shootoutInfo"]["away"]["scores"] + "/" +  current["shootoutInfo"]["away"]["attempts"];
                  homeTeam["shootoutScore"] = homeShootoutScore;
                  awayTeam["shootoutScore"] = awayShootoutScore;
              }
              gameState["home"] = homeTeam;
              gameState["away"] = awayTeam;
              resolve(gameState);
              return;
          }).catch((err) => {
              reject(err);
              return;
          })
      });
      return retprom;
  }

  /**
   * Updates the game state locally
   * @returns a Promise that resolves with the updated game object
   */
  function updateGameStatus() {
    let retprom = new Promise((resolve,reject) => {
        try {
            chrome.storage.local.get(["currentGame"], function(result) {
                let game = result.currentGame;
                let gameId = game["id"];
                getAllGoalsScored(gameId).then((goals) => {
                    game["allGoals"] = goals;
                    return getGameState(gameId);
                }).then((gameState) => {
                    game["currentState"] = gameState;
                    chrome.storage.local.set({ "currentGame": game}, function () {
                        console.log("Game has been updated");
                        console.log(game);
                        resolve(game);
                        return;
                      });
                }).catch((err) => {
                    reject("Game could not be updated due to: " + err);
                    return;
                })
            });
        } catch (err) {
            throw "Game could not be updated due to: " + err;
            
        }
    });
    return retprom;
  }