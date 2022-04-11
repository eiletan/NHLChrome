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
 * Find the NHL game involving the passed in team on the given date
 * @param {String} team Name of the team 
 * @param {String} date Date of the game - Must be in format "YYYY-MM-DD"
 * @returns the NHL game as a JSON object, else an exception is thrown
 */
function findGameForTeam(team, date) {
    let retprom = new Promise((resolve) => {
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
