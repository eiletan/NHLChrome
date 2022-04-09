/**
 * Makes a GET request to the NHL API
 * @param {String} uri uri for the NHL API ex. "/teams" 
 * @returns {Promise} Promise that resolves with the API response in JSON format
 */
function GetFromNHLApi(uri) {
    let nhlbase = chrome.runtime.getManifest().host_permissions[0] + "api/v1";
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
 * Find all NHL games occuring on the passed in date
 * @param {String} date Date of the game - Must be in format "YYYY-MM-DD"
 * @returns {Promise} Promise that resolves with the list of games for the date as an array 
 */
function findGames(date) {
    let gamesList = null;
    let retprom = new Promise((resolve) => {
        GetFromNHLApi("/schedule?date=" + date).then((games) => {
            gamesList = games["dates"][0]["games"];
            console.log(gamesList);
            resolve(gamesList);
        }).catch((err) => {
            throw "Games for " + date + " could not be found. Please try again";
        });
    });
    return retprom;
}

/**
 * Find the id of a NHL game involving the passed in team on the given date
 * @param {String} team Name of the team 
 * @param {String} date Date of the game - Must be in format "YYYY-MM-DD"
 * @returns id of the NHL game, else an exception is thrown
 */
function findGameForTeam(team, date) {
    let retprom = new Promise((resolve) => {
        try {
            findGames(date).then((retgames) => {
                let gameId = null;
                for (game of retgames) {
                    let awayTeam = game["teams"]["away"]["team"]["name"]
                    let homeTeam = game["teams"]["home"]["team"]["name"]
                    if (matchTeamName(awayTeam, team) || matchTeamName(homeTeam, team)) {
                        gameId = game["gamePk"];
                        resolve(gameId);
                    }
                }
                if (gameId === null) {
                    throw "Game for " + team + " could not be found. Please try again."
                }
            }).catch((err) => {
                throw err;
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
    teamNameA = decodeURIComponent(escape(teamNameA));
    teamNameB = decodeURIComponent(escape(teamNameB));
    teamNameA = teamNameA.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    teamNameB = teamNameB.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    teamNameA = teamNameA.toLowerCase();
    teamNameB = teamNameB.toLowerCase();
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


document.getElementById("button").addEventListener('click', function () {

    GetFromNHLApi("/teams").then((teams) => {
        console.log(teams["teams"]);
        return GetFromNHLApi("/schedule?date=2022-04-03");
    }).then((games)=> {
        console.log(games);
    }).catch((err) => {
        console.log("error");
        console.log(err);
    })
    findGameForTeam("Vancouver Canucks", "2022-04-08").then((gameId) => {
        console.log(gameId);
    }).catch((err) => {
        console.log("error")
        console.log(err);
    })

});