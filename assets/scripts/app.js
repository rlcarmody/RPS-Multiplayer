import { config as config } from './config.js';
firebase.initializeApp(config);
const db = firebase.database();
const player = {
    name: '',
    id: '',
    wins: 0,
    ties: 0,
    losses: 0
};
const opponent = {
    name: '',
    id: ''
}
let round = 0;
let dbRoundPush;

$('#start').on('click', function () {
    player.name = $('#name').val();
    player.connection = db.ref('/Rooms').push(player);
    player.connection.onDisconnect().remove();
    player.id = player.connection.key;
    db.ref('/Rooms').limitToFirst(2).once('value', function (snap) {
        let currentPlayers = [];
        snap.forEach(e => { currentPlayers.push(e.key) });
        if (currentPlayers.length === 2 && currentPlayers.includes(player.id)) {
            startGame();
        } else {
            queue();
        }
    })
})

const startGame = _ => {
    db.ref('/Rooms').limitToFirst(2).on('value', snap => {
        if (opponent.name != '') {
            alert(`${opponent.name} quit. Please wait to be connected to another player`);
            reset();
        }
        if (snap.numChildren() < 2) {
            db.ref('/Game/Rounds').off();
            //db.ref('/Chat').off();
            db.ref('/Rooms').off();
            return queue();
        }
        reset();
        let currentPlayers = Object.keys(snap.val());
        currentPlayers.splice(currentPlayers.indexOf(player.id), 1);
        opponent.id = currentPlayers[0];
        opponent.name = snap.val()[opponent.id].name;
        $('#gamestatus').text(`You are facing off against ${opponent.name}`);
        db.ref('/Game/Rounds').limitToLast(1).on('value', evaluate);
        roundStart();
    })
}
$('#gamebuttons').on('click', 'button', function () {
    $('#gamebuttons').empty();
    let choice = $(this).attr('data-value');
    dbRoundPush = db.ref('/Game/Rounds/' + round + '/' + player.id)
    dbRoundPush.set(choice);
    dbRoundPush.onDisconnect().remove();
})

const evaluate = snap => {
    const messagePlayer = id => {
        player.id === id ? $('#roundinfo').text('Waiting on opponent. ') : $('#roundinfo').text('Your opponent is waiting for you');
    }
     const compare = (playerChoice, opponentChoice) => {
        $('#roundinfo').html('<p>You chose: ' + playerChoice + '</p><p>Your opponent chose: ' + opponentChoice + '</p>');
        if (playerChoice === opponentChoice) {
            $('#roundinfo').append('You tied');
            player.ties++
            $('#ties').text(player.ties);
        } else if ((playerChoice === 'rock' && opponentChoice === 'scisccors') || 
                (playerChoice === 'scissors' && opponentChoice === 'paper') || 
                (playerChoice === 'paper' && opponentChoice === 'rock')) {
            player.wins++;
            $('#roundinfo').append('You win!');
            $('#wins').text(player.wins);
        } else {
            player.losses++;
            $('#roundinfo').append('You lose!');
            $('#wins').text(player.losses);
        }
        roundStart();
     }
   
    try {
        let json = snap.toJSON();
        let arrOfKeys = Object.keys(json[round])
        arrOfKeys.length === 2 ? compare(json[round][player.id],json[round][opponent.id]) : messagePlayer(arrOfKeys[0]);
    } catch {
        console.warn("It's okay, there's just no data at this location yet"); //The listener event fires the function once before any values are added and results in a TypeError
    }
}
const roundStart = _ => {
    round++;
    $('#round').text(round);
    $('#gamebuttons').html('<button data-value="rock" type="button">Rock</button><button data-value="paper" type="button">Paper</button><button data-value="scissors" type="button">Scissors</button>')
    $('#roundinfo').append('Round number ' + round + ' has begun.  Make your choice')
}
const reset = _ => {
    db.ref('/Game').remove();
    round = 0;
    opponent.id = '';
    opponent.name = '';
}

const queue = _ => {
    db.ref('/Rooms').on('value', snap => {
        let currentPlayers = [];
        snap.forEach(e => { currentPlayers.push(e.key) });
        let position = currentPlayers.indexOf(player.id) - 1;
        if (position < 0 && currentPlayers.length < 2) {
            $('#gamestatus').text('You are the only player so far. Please wait for an opponent.')
        } else if (position > 0) {
            $('#gamestatus').text(`You are number ${position} in the queue.`)
        } else {
            db.ref('/Rooms').off();
            startGame();
        }
    })
}
$('#quit').on('click', function () {
    $('#gamebuttons').empty();
    $('#gamestatus').text('You quit')
    db.ref('/Rooms').off();
    db.ref('/Game/Rounds').off();
    
    //db.ref('/Chat').off();
    player.connection.remove();
    player.id = '';
    player.connection = '';
    reset();
});
