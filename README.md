# NHLChrome
NHLChrome is a chrome extension created to allow NHL fans to track NHL games in real time, complete with desktop and audio notifications, and live scoreboards.

## How do I install it?
1. Clone this repo
2. In chrome, go to chrome://extensions and turn on developer mode
3. Click "Load Unpacked", and select the repo
4. You should now be able to see the extension in your chrome browser

## How does it work?
Upon opening the extension, there will be a list of NHL games scheduled for the current day. This list resets everyday.<br> 
![Home Page](https://github.com/eiletan/NHLChrome/blob/main/homepage.PNG "Home Page")<br>
Clicking on a game will then open a scoreboard page for that game and a popup window. This popup window is used to play the goal horn audio, but can be closed. If closed, the extension will automatically open it again if a goal or win is detected. This page has a scoreboard indicating goals for each team, shots for each team, playing strength of each team, and time and period. Playoff series information, when applicable, is displayed on top of the scoreboard. The playoff round, game number, and current playoff series status is shown.<br>
![Game Page]([https://github.com/eiletan/NHLChrome/blob/main/gamepage.PNG "Game Page")<br>
![Popup audio window](https://github.com/eiletan/NHLChrome/blob/main/popupwindow.PNG "Popup audio window")<br>
When on the game page, the extension will automatically track the game, fetching game updates every minute. Whenever a goal is scored, a desktop notification is displayed with the scoring team's logo, score, goal scorer and assisters, time of the goal and playing strength. Additionally, the scoring team's goal horn is played for 15 seconds. When the game ends, another desktop notification is displayed with the winning team's logo, and the final score. Like in the case of a goal, the winning team's full goal horn is played. Users can return to the home page at any time.


## Notes
Team logos and team goal horns do not belong to me.
