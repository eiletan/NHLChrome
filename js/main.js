document.getElementById("button").addEventListener("click", function () {
  console.log(new Date().toLocaleDateString("en-CA",{timeZone: "America/New_York"}));
});


document.getElementById("buttonAlarm").addEventListener("click", function () {
  var alarmInfo = {
    "periodInMinutes": 1,
  }
  chrome.alarms.create("liveGame", alarmInfo);
  chrome.alarms.get("liveGame", function (alarm) {
    console.log("alarm found");
    console.log(alarm);
  })
  chrome.alarms.getAll(function(as) {
    console.log(as);
  })
});

document.getElementById("buttonClear").addEventListener("click", function () {
  chrome.alarms.clearAll();
  chrome.storage.local.get(["teams"], function(result) {
    let teams = result.teams;
    chrome.notifications.create({
      title: "VAN GOAL",
      message: "GOAL SCORED BY #40, ASSISTED BY #9 and #43",
      type: "basic",
      iconUrl:  teams["Vancouver Canucks"]["logo"],
      silent: true
  });
  let url = chrome.runtime.getURL('audio.html');
  
  url += "?volume=0.5&src=" + teams["Vancouver Canucks"]["goalHorn"] + "&length=15000";

  chrome.windows.create({
      type: 'popup',
      focused: false,
      top: 1,
      left: 1,
      height: 1,
      width: 1,
      url,
  })
  });
  
});

