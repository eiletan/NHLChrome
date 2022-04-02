var nhlbase = "https://statsapi.web.nhl.com/api/v1";

// This set of functions deal with the API

function getAllTeams(uri) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        console.log(xhttp.response);
      }
    };
    xhttp.open("GET", nhlbase + uri, true);
    xhttp.send();
  
}
