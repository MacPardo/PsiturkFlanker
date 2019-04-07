'use strict';

var CARD_MIN = 1;
var CARD_MAX = 10;

var CARDS_DISPLAY_TIME = 2000;

/**
 * @returns {Promise}
 */
function hiloGuess() {

    if (_.random(0, 1)) {
        var visibleCard = $("#hilo-left-card");
        var hiddenCard  = $("#hilo-right-card");
    } else {
        var hiddenCard  = $("#hilo-left-card");
        var visibleCard = $("#hilo-right-card");
    }

    var visibleNum = _.random(CARD_MIN, CARD_MAX);
    var hiddenNum = visibleNum;
    
    while (visibleNum === hiddenNum) {
        hiddenNum = _.random(CARD_MIN, CARD_MAX);
    }

    var listener = DelayedInput();

    visibleCard.text(visibleNum);
    hiddenCard.text("?");

    listener.listen();
    return promiseTimeout(CARDS_DISPLAY_TIME).then(function() {
        var result = listener.result();

        hiddenCard.text(hiddenNum);

        if (result.inputHappened && result.keyCode === LEFT_KEY_CODE) { // gessed right was smaller
            return {
                delay: result.delay,
                correct: hiddenNum < visibleNum,
                tried: true
            };
        } else if (result.inputHappened && result.keyCode === RIGHT_KEY_CODE) { // guessed right was bigger
            return {
                delay: result.delay,
                correct: visibleNum > visibleNum,
                tried: true
            };
        } else { // didn't even try
            return {
                delay: NaN,
                correct: false,
                tried: false
            }
        }
    });
}


/**
 * @returns {Promise<any>}
 */
function HiLoExperiment() {
    psiTurk.showPage("exp/hiloStage.html");

    return hiloGuess().then(function(result) {
        console.log("result is", result);
        return promiseTimeout(1000);
    }).then(function() {
        return hiloGuess();
    }).then(function(result) {
        console.log("second result is", result);
    });
}