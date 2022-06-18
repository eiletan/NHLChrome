var nhlbase = "https://statsapi.web.nhl.com/api/v1";

/**
 * Makes a GET request to the NHL API
 * @param {String} uri uri for the NHL API ex. "/teams"
 * @returns {Promise} Promise that resolves with the API response in JSON format
 */
function GetFromNHLApi(uri) {
  let retprom = new Promise((resolve,reject) => {
    fetch(nhlbase + uri).then(response => response.json()).then(data => {
      resolve(data); return;
    }).catch((err) => {
      reject(err);
    });
  });
  return retprom;
}