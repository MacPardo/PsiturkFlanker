'use strict';

var hiloConst = {
    CARD_MIN: 1,
    CARD_MAX: 9,

    FIX_CROSS_DURATION: 500,

    CARDS_GUESS_TIME : 2000,
    CARDS_REVEAL_TIME: 1000,

    STIM_DUR_MIN: 1500,
    STIM_DUR_MAX: 2500,

    RESPONSE_SCREEN_TIME: 2000,

    MISTERY_CARD_TIME: 1500,

    ITI_MIN: 3000,
    ITI_MAX: 5000,

    PAUSE_DURATION: 60000,

    COUNTDOWN_DUR: 1000,

    PRACTICE_BLOCKS: 1,
    PRACTICE_TRIALS: 9,
    TEST_BLOCKS: 6,
    TEST_TRIALS: 18
};

/*
if expInfo2['Session'] == '0': #practice
    nBlocks = 1
    nTrials =  9
elif expInfo2['Session'] == '1': #test
    nBlocks = 6
    nTrials =  18



FixCrossDurationS = 0.5
FixCrossDuration = int(round(FixCrossDurationS/frameLength))

stimDurMinS = 1.5
stimDurMin = int(round(stimDurMinS/frameLength))
stimDurMaxS = 2.5
stimDurMax = int(round(stimDurMaxS/frameLength))

responseScreenTimeS = 2.0
responseScreenTime = int(round(responseScreenTimeS/frameLength))

misteryCardTimeS = 1.5
misteryCardTime = int(round(misteryCardTimeS/frameLength))

feedbackTimeS = 1.5
feedbackTime = int(round(feedbackTimeS/frameLength))

ITIMinS = 3.0
ITIMin = int(round(ITIMinS/frameLength))
ITIMaxS = 5.0
ITIMax = int(round(ITIMaxS/frameLength))

pauseDurationS = 60.0
pauseDuration = int(round(pauseDurationS/frameLength))

countdownDurS = 1.0
countdownDur = int(round(countdownDurS/frameLength))




Primeiro só apresentar o estímulo por stimDur
Depois mostrar um ponto de interrogação na tela por responseScreenTime

Mostrar a resposta correta por misteryCardTime

Mostrar frase de feedback por feedbackTime





KEYWORDS:
Psychology
OCD
Uncertainty
Obsessive Compulsive
Performance Monitoring

TITLE
*/

/**
 * 
 * mostrar quais eram os números
 * qual seta foi pressionada
 * se é sessão de treino
 * 
 * Não usar true ou false, nem strings. Só 0 e 1
 * 
 * Sempre colocar o número do trial
 * 
 * Salvar o tempo de apresentação/espera
 * 
 * 
 * Exibir feedback & pontuação após cada jogada
 * lembrar de salvar a pontuação
 * +100 p/ acerto
 * -100 p/ erro
 */

/**
 * @returns {Promise}
 */
function displayCross() {
    $("#hilo-left-card").hide(0);
    $("#hilo-right-card").hide(0);
    $("#hilo-middle-card").hide(0);
    $("#hilo-cross").show(0);

    return promiseTimeout(hiloConst.FIX_CROSS_DURATION).then(function() {
        $("#hilo-cross").hide(0);
    });
}

/**
 * @param {Object} baseData
 * @returns {Promise}
 */
function hiloGuess(baseData) {

    if (!baseData) {
        baseData = {};
    }

    var visibleCard = $("#hilo-left-card");
    var hiddenCard  = $("#hilo-right-card");
    var revealCard  = $("#hilo-middle-card");

    visibleCard.show(0);
    hiddenCard.show(0);
    revealCard.hide(0);

    // generate numbers
    var visibleNum = _.random(hiloConst.CARD_MIN, hiloConst.CARD_MAX);
    var hiddenNum = visibleNum;
    while (visibleNum === hiddenNum) {
        hiddenNum = _.random(hiloConst.CARD_MIN, hiloConst.CARD_MAX);
    }

    var listener = DelayedInput();

    visibleCard.text(visibleNum);
    hiddenCard.text("?");

    listener.listen();

    var stimDur = boundedRandomFloat(hiloConst.STIM_DUR_MIN, hiloConst.STIM_DUR_MAX);
    
    return promiseTimeout(stimDur).then(function() {
        var result = listener.result();

        hiddenCard.text(hiddenNum);

        if (result.keyCode === LEFT_KEY_CODE) {
            var keyPressed = 0;
        } else if (result.keyCode === RIGHT_KEY_CODE) {
            var keyPressed = 1;
        } else {
            var keyPressed = NaN;
        }

        var data = {
            delay: result.delay,
            correct: (
                (result.keyCode === LEFT_KEY_CODE  && hiddenNum < visibleNum) || 
                (result.keyCode === RIGHT_KEY_CODE && hiddenNum > visibleNum)
            ) ? 1 : 0,
            tried:         result.inputHappened ? 1 : 0,
            visibleNumber: visibleNum,
            hiddenNumber:  hiddenNum,
            keyPressed:    keyPressed,
            stimDuration:  stimDur
        };

        // Object.assign(data, baseData);

        return data;
    }).then(function(data) {

        visibleCard.hide(0);
        hiddenCard.hide(0);

        revealCard.text("?");
        revealCard.show(0);
        
        return promiseTimeout(hiloConst.RESPONSE_SCREEN_TIME).then(function() {
            revealCard.text(hiddenNum);
            return promiseTimeout(hiloConst.MISTERY_CARD_TIME);
        }).then(function() {
            return data;
        });
    });
}

/**
 * 
 * @param {Object} baseData
 * @returns {Promise}
 */
function hiloTrial(baseData) {
    return displayCross()
        .then(hiloGuess.bind(this, baseData));
}

/**
 * 
 * @param {Number} numberOfTrials 
 * @param {Object} baseData
 * @param {Number} currentTrial
 * @returns {Promise<Object[]>}
 */
function hiloBlock(numberOfTrials, baseData) {

    var trialData = [];
    var currentTrial = 0;

    return new Promise(function(resolve) {
        function execTrial() {
            if (currentTrial >= numberOfTrials) {
                resolve(trialData);
            } else {
                hiloTrial(baseData).then(function(data) {
                    trialData.push(data);
                    currentTrial++;
                    execTrial();
                });
            }
        }
        execTrial();
    });
}

/**
 * @returns {Promise}
 */
function HiLoExperiment() {
    psiTurk.showPage("exp/hiloStage.html");

    return hiloBlock(2, {}).then(function(data) {
        console.log("HiLo data is", data);
    });
}