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
});