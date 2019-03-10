# Multi-Player Rock Paper Scissors Game

## Instructions

* Choose a user name. Your name will display to your opponents and cannot be changed.

* When you're ready to play, click start to enter the queue.

* Only two players (globally) can play at a time in this version

* The game continues until a player quits or disconnects and the remaining player is automatically connected with the next player in the queue 

## Technical details

The game is powered by storing the player info and connectivity status in Firebase. A series of event listeners trigger round advancement and UI updates.  All data is wiped from the previous session once a player quits or disconnects.