'use strict';

var hiloConst = {
  CARD_MIN: 1,
  CARD_MAX: 9,

  FIX_CROSS_DURATION: 500,

  CARDS_GUESS_TIME: 2000,
  CARDS_REVEAL_TIME: 1000,

  STIM_DUR_MIN: 1500,
  STIM_DUR_MAX: 2500,

  RESPONSE_SCREEN_TIME: 2000,

  MISTERY_CARD_TIME: 1500,

  ITI_MIN: 3000,
  ITI_MAX: 5000,

  FEEDBACK_TIME: 1500,

  PAUSE_DURATION: 60000,

  COUNTDOWN_DUR: 1000,

  PRACTICE_BLOCKS: 1,
  PRACTICE_TRIALS: 9,
  TEST_BLOCKS: 6,
  TEST_TRIALS: 18,

  TRIAL_POINTS: 100,

  FEEDBACK_CORRECT: "You got it right! +100 points",
  FEEDBACK_WRONG: "You missed it! -100 points",
};

/** jQuery selectors */
var hiloEls = {
  feedback: "#hilo-feedback",
  visibleCard: "#hilo-left-card",
  hiddenCard: "#hilo-right-card",
  revealCard: "#hilo-middle-card"
};

function hideAll(els) {
  for (var el in els) {
    $(els[el]).hide(0);
  }
}


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

  return promiseTimeout(hiloConst.FIX_CROSS_DURATION).then(function () {
    $("#hilo-cross").hide(0);
  });
}

/**
 * @typedef  {Object} HiloBaseData
 * @property {Number} totalPoints
 * @property {Number} trial
 * @property {Number} block
 * @property {Number} session 0 or 1
 */

/**
 * @typedef  {Object} HiloData
 * @property {Number} delay
 * @property {Number} correct 0 or 1
 * @property {Number} tried 0 or 1
 * @property {Number} visibleNumber
 * @property {Number} hiddenNumber
 * @property {Number} keyPressed 0 (left) or 1 (right)
 * @property {Number} stimDuration
 * @property {Number} pointDiff
 * @property {Number} totalPointsBefore
 * @property {Number} totalPointsAfter
 * @property {Number} trial
 * @property {Number} block
 */

/**
 * @param {HiloBaseData} baseData
 * @returns {Promise<HiloData>}
 */
function hiloGuess(baseData) {

  if (!baseData) {
    baseData = {};
  }

  var visibleCard = $("#hilo-left-card");
  var hiddenCard = $("#hilo-right-card");
  var revealCard = $("#hilo-middle-card");

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

  return promiseTimeout(stimDur).then(function () {
    var result = listener.result();

    hiddenCard.text(hiddenNum);

    if (result.keyCode === LEFT_KEY_CODE) {
      var keyPressed = 0;
    } else if (result.keyCode === RIGHT_KEY_CODE) {
      var keyPressed = 1;
    } else {
      var keyPressed = NaN;
    }

    var correct = (
      (result.keyCode === LEFT_KEY_CODE && hiddenNum < visibleNum) ||
      (result.keyCode === RIGHT_KEY_CODE && hiddenNum > visibleNum)
    ) ? 1 : 0;
    var pointDiff = correct ? +hiloConst.TRIAL_POINTS : -hiloConst.TRIAL_POINTS;


    /** @type {HiloData} */
    var data = {
      delay: result.delay / 1000,
      correct: correct,
      tried: result.inputHappened ? 1 : 0,
      visibleNumber: visibleNum,
      hiddenNumber: hiddenNum,
      keyPressed: keyPressed,
      stimDuration: stimDur / 1000,
      pointDiff: pointDiff,
      totalPointsBefore: baseData.totalPoints,
      totalPointsAfter: baseData.totalPoints + pointDiff,
      trial: baseData.trial,
      block: baseData.block,
      session: baseData.session
    };

    // Object.assign(data, baseData);

    return data;
  }).then(function (data) {

    visibleCard.hide(0);
    hiddenCard.hide(0);

    revealCard.text("?");
    revealCard.show(0);

    return promiseTimeout(hiloConst.RESPONSE_SCREEN_TIME).then(function () {
      revealCard.text(hiddenNum);
      return promiseTimeout(hiloConst.MISTERY_CARD_TIME);
    }).then(function () {
      revealCard.hide(0);
      return data;
    });
  });
}

/*
Exibir feedback & pontuação após cada jogada
lembrar de salvar a pontuação
+100 p/ acerto
-100 p/ erro
*/

/**
 * 
 * @param {HiloData} data
 * @returns {Promise<HiloData>}
 */
function hiloFeedback(data) {
  return new Promise(function (resolve) {
    $(hiloEls.feedback).show(0);
    $(hiloEls.feedback).text(data.correct ? hiloConst.FEEDBACK_CORRECT : hiloConst.FEEDBACK_WRONG);
    promiseTimeout(hiloConst.FEEDBACK_TIME).then(function () {
      $(hiloEls.feedback).hide(0);
      $(hiloEls.feedback).html("");
      resolve(data);
    });
  });
}

/**
 * 
 * @param   {HiloBaseData} baseData
 * @returns {HiloData}
 */
function hiloTrial(baseData) {
  return displayCross().then(function () {
    return hiloGuess(baseData);
  }).then(function (data) {
    return hiloFeedback(data);
  });
}

/**
 * 
 * @param {Number} numberOfTrials
 * @param {Number} currentBlock
 * @param {Number} session 0 or 1
 * @returns {Promise<HiloData[]>}
 */
function hiloBlock(numberOfTrials, currentBlock, session) {

  /** @type {HiloData[]} */
  var trialData = [];

  var currentTrial = 0;
  var points = 0;

  console.log("I am going to run a block", numberOfTrials, currentBlock, session);

  return new Promise(function (resolve) {
    function execTrial() {
      if (currentTrial >= numberOfTrials) {
        console.log("End of block " + currentBlock + " session " + session);
        console.log(trialData);
        resolve(trialData);
      } else {

        /** @type {HiloBaseData} */
        var baseData = {
          block: currentBlock,
          totalPoints: points,
          trial: currentTrial,
          session: session
        };

        hiloTrial(baseData).then(function (data) {
          trialData.push(data);
          currentTrial++;
          points = data.totalPointsAfter;
          execTrial();
        });
      }
    }
    execTrial();
  });
}

/**
 * 
 * @param {Number} numberOfBlocks 
 * @param {Number} numberOfTrials 
 * @param {Number} session 
 * @returns {Promise<HiloData[]>}
 */
function hiloBlocks(numberOfBlocks, numberOfTrials, session) {

  /** @type {HiloData[]} */
  var blockData = [];

  var currentBlock = 0;

  return new Promise(function (resolve) {
    function execBlock() {
      console.log("running exec block", blockData, currentBlock);
      if (currentBlock >= numberOfBlocks) {
        resolve(blockData);
      } else {
        hiloBlock(numberOfTrials, currentBlock, session).then(function (data) {
          blockData = blockData.concat(data);
          currentBlock++;
          execBlock();
        });
      }
    }
    execBlock();
  });
}

/*
if expInfo2['Session'] == '0': #practice
    nBlocks = 1
    nTrials =  9
elif expInfo2['Session'] == '1': #test
    nBlocks = 6
    nTrials =  18
*/

/**
 * @returns {Promise}
 */
function HiLoExperiment() {

  /** @type {HiloData[]} */
  var expData = [];

  psiTurk.showPage("exp/hiloStage.html");

  // return hiloBlock(4, 0, 0);
  return hiloBlocks(1, 2, 0);

  // return hiloBlocks(1, 9, 0).then(function(data) {
  //     hiloData = hiloData.concat(data);
  //     return hiloBlocks(6, 18, 1);
  // }).then(function(data) {
  //     hiloData = hiloData.concat(data);
  //     return hiloData;
  // });

}