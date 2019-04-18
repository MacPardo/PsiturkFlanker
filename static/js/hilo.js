'use strict';

console.log("LOADED HILO SCRIPT");

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

  INTRO_TEXT: "Look at the center of the screen.<br>"+
    "You'll see two cards, one with a number and another witha a question mark.",
  
  TEXT_BETWEEN_BLOCKS: "You can take a rest now. Press &darr; or &uarr; to continue the task."
};

/** jQuery selectors */
var hiloEls = {
  feedback: "#hilo-feedback",
  visibleCard: "#hilo-left-card",
  hiddenCard: "#hilo-right-card",
  revealCard: "#hilo-middle-card",
  cross: "#hilo-cross"
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
 * @property {Number} Trial
 * @property {Number} Block
 * @property {Number} Session 0 or 1
 */

/**
 * @typedef  {Object} HiloData
 * @property {Number} RT
 * @property {Number} Correct 0 or 1
 * @property {Number} Resp 0 or 1
 * @property {Number} numberCardValue
 * @property {Number} misteryCardValue
 * @property {Number} keyPressed 0 (left) or 1 (right)
 * @property {Number} stimDuration
 * @property {Number} totalPointsBefore
 * @property {Number} totalPointsAfter
 * @property {Number} Trial
 * @property {Number} Block
 * @property {Number} Session 0 or 1
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

  var listener = DelayedInput(true); // passing true means it will listen for up & down

  visibleCard.text(visibleNum);
  hiddenCard.text("?");

  listener.listen();

  var stimDur = boundedRandomFloat(hiloConst.STIM_DUR_MIN, hiloConst.STIM_DUR_MAX);

  return promiseTimeout(stimDur).then(function() {

    visibleCard.hide(0);
    hiddenCard.hide(0);

    revealCard.text("?");
    revealCard.show(0);
    return promiseTimeout(hiloConst.RESPONSE_SCREEN_TIME);

  }).then(function () {
    var result = listener.result();
    console.log("got input now");

    hiddenCard.text(hiddenNum);

    if (result.keyCode === DOWN_KEY_CODE) {
      var keyPressed = 0;
    } else if (result.keyCode === UP_KEY_CODE) {
      var keyPressed = 1;
    } else {
      var keyPressed = NaN;
    }

    console.log("keyCode===", result.keyCode, "keyPressed===", keyPressed);

    var correct = (
      (result.keyCode === DOWN_KEY_CODE && hiddenNum < visibleNum) ||
      (result.keyCode === UP_KEY_CODE && hiddenNum > visibleNum)
    ) ? 1 : 0;
    var pointDiff = correct ? +hiloConst.TRIAL_POINTS : -hiloConst.TRIAL_POINTS;

    var stimDurSeconds = stimDur / 1000;
    stimDurSeconds = parseInt(stimDurSeconds * 1000) / 1000;

    /** @type {HiloData} */
    var data = {
      RT: result.delay / 1000,
      Correct: correct,
      Resp: result.inputHappened ? 1 : 0,
      numberCardValue: visibleNum,
      misteryCardValue: hiddenNum,
      keyPressed: keyPressed,
      stimDuration: stimDurSeconds,
      totalPointsBefore: baseData.totalPoints,
      totalPointsAfter: Math.max(0, baseData.totalPoints + pointDiff),
      Trial: baseData.Trial,
      Block: baseData.Block,
      Session: baseData.Session
    };

    // Object.assign(data, baseData);

    return data;
  }).then(function (data) {

    revealCard.text(hiddenNum);
    return promiseTimeout(hiloConst.MISTERY_CARD_TIME).then(function () {
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
  
  var wrongImg = "<img src='/static/images/error-128.ico' />";
  var correctImg = "<img src='/static/images/ok-128.png' />";

  var feedbackCorrect = "Correct!<br>+100 points.<br>Total = " + data.totalPointsAfter;
  var feedbackWrong = "Wrong!<br>-100 points.<br>Total = " + data.totalPointsAfter;

  return new Promise(function (resolve) {
    $(hiloEls.feedback).show(0);
    $(hiloEls.feedback).html(data.Correct ? correctImg : wrongImg);
    promiseTimeout(hiloConst.FEEDBACK_TIME).then(function () {
      $(hiloEls.feedback).html(
        "<span style=''>" + (data.Correct ? feedbackCorrect : feedbackWrong) + "</span>"
      );
      return promiseTimeout(hiloConst.FEEDBACK_TIME);
    }).then(function() {
      $(hiloEls.feedback).html("");
      hideAll(hiloEls);
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

  console.log("running hiloTrial", baseData);

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
 * @param {Number} startingPoints
 * @returns {Promise<HiloData[]>}
 */
function hiloBlockBasic(numberOfTrials, currentBlock, session, startingPoints) {

  /** @type {HiloData[]} */
  var trialData = [];

  var currentTrial = 0;
  var points = startingPoints;

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
          Block: currentBlock,
          totalPoints: points,
          Trial: currentTrial,
          Session: session
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
 * The same as hiloBlockBasic, but with countdown first
 * @param {Number} numberOfTrials
 * @param {Number} currentBlock
 * @param {Number} session 0 or 1
 * @param {Number} startingPoints
 * @returns {Promise<HiloData[]>}
 */
function hiloBlock(numberOfTrials, currentBlock, session, startingPoints) {
  hideAll(hiloEls);
  $(hiloEls.feedback).show(0);
  return blockCountdown($(hiloEls.feedback)).then(function() {
    return hiloBlockBasic(numberOfTrials, currentBlock, session, startingPoints);
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
  var currentPoints = 2500;

  return new Promise(function (resolve) {
    function execBlock() {
      console.log("running exec block", blockData, currentBlock);
      if (currentBlock >= numberOfBlocks) {
        console.log("I am inside hiloBlocks and I am going to resolve");
        resolve(blockData);
      } else {
        hiloBlock(numberOfTrials, currentBlock, session, currentPoints).then(function (data) {

          currentPoints = data[data.length - 1].totalPointsAfter; // update to points at the end of block

          console.log("I got HERE");

          blockData = blockData.concat(data);
          currentBlock++;

          hideAll(hiloEls);

          // só exibe a mensagem entre blocos se não for o último bloco
          if (currentBlock < numberOfBlocks - 1) {
            $(hiloEls.feedback).html(hiloConst.TEXT_BETWEEN_BLOCKS);
            $(hiloEls.feedback).show(0);
            waitLeftOrRight().then(function() {
              $(hiloEls.feedback).html("");
              $(hiloEls.feedback).hide(0);
              execBlock();
            });
          } else {
            execBlock();
          }
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

  var introText = "Keep your eyes at the center of the screen.<br>"+
    "You will see two cards: a numbered card (1-9) and a mystery card (\"?\").<br>"+
    "Then you will be asked to decide whether the value of the mystery card is "+
    "lower or higher than the numbered card; the mystery card's value will never "+
    "be equal to the numbered card.<br>Press &darr; (down), if you think the mystery card "+
    "is lower than the numbered card, or &uarr; (up), if you think the mystery card "+
    "is higher than the numbered card.<br><br>After "+
    "your response, the real value of the mystery card will be revealed."+
    "Please respond as quickly and accurately as possible.<br><br>"+
    "<span class='mini-card'>9</span> <span class='mini-card'>?</span><br>\
    In this trial, the right answer is to press &darr; (down), i.e., the mystery card certainly is lower than 9.<br><br>\
    <span class='mini-card'>1</span> <span class='mini-card'>?</span><br>\
    In this trial, the right answer is to press &uarr; (up), i.e., the mystery card certainly is higher than 1.<br><br>"+
    "Press &larr; or &rarr; to continue.";
  var introText2 = "<span class='mini-card'>5</span> <span class='mini-card'>?</span><hr><br>\
    <span class='mini-card'>3</span> <span class='mini-card'>?</span><hr><br>\
    <span class='mini-card'>8</span> <span class='mini-card'>?</span><br>\
    In these trials you will have to guess.<br><br>"+
    "Press &larr; or &rarr; to continue.";
  var introText3 = "The points you will either win or lose are only for the purpose of this task. They are virtual and they will not entail any monetary benefit.<br><br>\
    Remember: press &darr; (down), if you think the mystery card is lower than the numbered card,\
     or &uarr; (up), if you think the mystery card is higher than the numbered card.<br><br>"+
    "Press &larr; or &rarr; to continue.";

  var afterIntroText = "You will start with an amount of 2500 points.<br>" + 
    "For each correct answer, you win 100 points. For each wrong anwer, you lose 100 points.<br><br>" +
    "First you will take some practice trials<br>"+
    "When the practice block is over, the real task will begin<br><br>"+ 
    "Press &larr; or &rarr; to begin the task.";

  psiTurk.showPage("exp/hiloStage.html");

  // return hiloBlock(4, 0, 0);
  hideAll(hiloEls);
  $(hiloEls.feedback).html(introText);
  $(hiloEls.feedback).show(0);
  return waitLeftOrRight().then(function() {
    $(hiloEls.feedback).html(introText2);
    return waitLeftOrRight();
  }).then(function() {
    $(hiloEls.feedback).html(introText3);
    return waitLeftOrRight();
  }).then(function() {

    // AFTER INTRO
    $(hiloEls.feedback).html(afterIntroText);
    return waitLeftOrRight();
  }).then(function() {
    $(hiloEls.feedback).addClass("vertical-center");
    $(hiloEls.feedback).html("");
    hideAll(hiloEls);
    // return hiloBlocks(1, 9, 0);
    return hiloBlocks(1, 1, 0);
  }).then(function(data) {
    console.log("I got to the other side of the promise");
    expData = expData.concat(data);
    hideAll(hiloEls);
    $(hiloEls.feedback).show(0);
    // $(hiloEls.feedback).html(hiloConst.TEXT_BETWEEN_BLOCKS);
    $(hiloEls.feedback).html("Now that the training is over, the test will begin<br><br>"+
    "Press &darr; or &uarr; to continue.");
    return waitLeftOrRight();
  }).then(function() {
    $(hiloEls.feedback).html("");
    hideAll(hiloEls);
    // return hiloBlocks(6, 18, 1);
    return hiloBlocks(2, 1, 1);
  }).then(function(data) {

    console.log("finished all blocks");
    expData = expData.concat(data);
    hideAll();
    $(hiloEls.feedback).show(0);
    $(hiloEls.feedback).html(
      "Thank you for participating!<br><br>"+
      "Press &darr; or &uarr; to continue."
    );
    
    return waitLeftOrRight();
  }).then(function() {
    $(hiloEls).html("");
    hideAll(hiloEls);

    console.log("expData is", expData);
    return expData;
  });

  // return hiloBlocks(1, 9, 0).then(function(data) {
  //     hiloData = hiloData.concat(data);
  //     return hiloBlocks(6, 18, 1);
  // }).then(function(data) {
  //     hiloData = hiloData.concat(data);
  //     return hiloData;
  // });

}