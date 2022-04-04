

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
 * Returns a list of games for the given date
 * @param {String} date Date of the game - Must be in format "YYYY-MM-DD"
 */
function findGames(date) {
    let gamesList = null;
    GetFromNHLApi.then((games) => {
        gamesList = games["dates"][0]["games"];
        console.log(gamesList);
        return gamesList;
    }).catch((err) => {
        throw "Games for " +date+ " could not be found. Please try again";
    });
}

function findGameForTeam(team,date) {
    let games = null;
    try {
        games = findGames(date);
        for (game of games) {
            let awayTeam = games["teams"]["away"]["team"]["name"]
            let homeTeam = games["teams"]["home"]["team"]["name"]
            if (awayTeam === team || homeTeam === team) {
                let gameId = game["gamePk"];
                return gameId;
            }
        }
        throw "Game for " + team + " could not be found. Please try again."
    } catch(err) {
        throw err;
    }
}