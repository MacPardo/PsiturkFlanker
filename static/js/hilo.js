'use strict';

var CARD_MIN = 1;
var CARD_MAX = 10;

var CARDS_DISPLAY_TIME = 1000;

/**
 * @returns {Promise}
 */
function hiloGuess() {
    var leftNum = _.random(CARD_MIN, CARD_MAX);
    var rightNum = undefined;
    
    while (leftNum === rightNum) {
        rightNum = _.random(CARD_MIN, CARD_MAX);
    }

    var listener = DelayedInput();

    $("#hilo-left-card").text(leftNum);
    $("#hilo-right-card").text(rightNum);

    listener.listen();
    return promiseTimeout(CARDS_DISPLAY_TIME).then(function() {
        var result = listener.result();

        if (result.inputHappened && result.keyCode === LEFT_KEY_CODE) { // gessed right was smaller
            return {
                delay: result.delay,
                correct: rightNum < leftNum,
                tried: true
            };
        } else if (result.inputHappened && result.keyCode === RIGHT_KEY_CODE) { // guessed right was bigger
            return {
                delay: result.delay,
                correct: leftNum > leftNum,
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
    return new Promise(function(resolve) {
        resolve();
    });
}