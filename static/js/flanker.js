'use strict';


/**
 * @typedef {Object} FlankerBaseData
 * @property {Number} Session 0 or 1
 * @property {Number} Block
 * @property {Number} Trial
 * @property {Number} TargetDirection
 * @property {Number} FlankerDirection
 */

/**
 * @typedef {Object} FlankerData
 * @property {Number} Session 0 or 1
 * @property {Number} Block
 * @property {Number} Trial
 * @property {Number} Condition 0 (coherent) or 1 (incoherent)
 * @property {Number} TargetDirection 0 (left) or 1 (right)
 * @property {Number} FlankerDirection 0 (left) or 1 (right)
 * @property {Number} RT Response Time (delay)
 * @property {Number} Resp 0 (timeout) or 1 (tried)
 * @property {Number} Correct 0 or 1
 */

var flankerConst = {
  arrowDurS: 0.2,
  ITIMinS: 1.4,
  ITIMaxS: 1.6,
  pauseText: "Take a rest.<br>" +
    "When you are ready, press &larr; (left arrow) " +
    "or &rarr; (right arrow) to continue"
}


/**
 * 
 * @param {FlankerBaseData} baseData
 * @returns {Promise<FlankerData>}
 */
function runFlankerTrial(baseData) {
  var listener = DelayedInput();
  var str = dirPairToStr({
    flanker: baseData.FlankerDirection, 
    target: baseData.TargetDirection
  });
  var divHTML = "<div style='font-size: 44px;'>" + str + "</div>";
  $("#stim").html(divHTML);
  
  listener.listen();

  return promiseTimeout(flankerConst.arrowDurS * 1000).then(function() {
    $("#stim").html("");
    return promiseTimeout(boundedRandomFloat(flankerConst.ITIMinS, flankerConst.ITIMaxS) * 1000);
  }).then(function() {
    var result = listener.result();

    /** @type {FlankerData} */
    var data = {
      Session: baseData.Session,
      Block: baseData.Block,
      Trial: baseData.Trial,
      Condition: (baseData.FlankerDirection !== baseData.TargetDirection) ? 1 : 0,
      RT: result.delay / 1000,
      Resp: result.inputHappened ? 0 : 1,
      FlankerDirection: baseData.FlankerDirection,
      TargetDirection: baseData.TargetDirection,
      Correct: (baseData.TargetDirection === 0 && result.keyCode === LEFT_KEY_CODE ||
        baseData.TargetDirection === 1 && result.keyCode === RIGHT_KEY_CODE) ? 1 : 0
    };

    return data;
  });
}

/**
 * 
 * @param {Number} Session 0 or 1
 * @param {Number} CurrentBlock 
 * @param {Number} numberOfTrials
 * @returns {Promise<FlankerData[]>}
 */
var runFlankerBlock = function(Session, CurrentBlock, numberOfTrials) {

  if (numberOfTrials % 2 != 0) {
    console.error("FLANKER: NUMBER OF TRIALS SHOULD BE EVEN (" + numberOfTrials + ")");
  }
  
  var nCoherentTrials = parseInt(numberOfTrials / 2);
  var nIncoherentTrials = parseInt(numberOfTrials / 2);
  
  /** @type {DirectionPair[]} */
  var trialDir = [];

  for (var i = 0; i < nCoherentTrials + nIncoherentTrials; i++) {
    var dir = _.random(0, 1);
    trialDir.push({
      target: dir,
      flanker: i >= nCoherentTrials ? dir : Math.abs(dir - 1)
    });
  }
  trialDir = _.shuffle(trialDir);
  
  var trialData = [];
  
  var currentTrial = 0;

  var correctHits = 0;

  return new Promise(function(resolve) {
    function execTrial() {
      if (currentTrial >= trialDir.length) {
        console.log("finished a block", trialData);
        console.log("correct hits", correctHits);
        resolve(trialData);
        return;
      }

      runFlankerTrial({
        Block: CurrentBlock,
        Session: Session,
        Trial: currentTrial,
        FlankerDirection: trialDir[currentTrial].flanker,
        TargetDirection: trialDir[currentTrial].target
      }).then(function(data) {
        currentTrial++;
        trialData.push(data);

        if (data.Correct) {
          correctHits++;
        }

        execTrial();
      });
    }
    execTrial();
  });
}

/**
 * 
 * @param {Number} numberOfBlocks 
 * @param {Number} numberOfTrials 
 * @param {Number} Session 0 or 1
 * @returns {Promise} 
 */
function runFlankerBlocks(numberOfBlocks, numberOfTrials, Session) {
  var currentBlock = 0;
  var blockData = [];

  return new Promise(function(resolve) {
    function execBlock() {
      console.log("running exec blocks. currentBlock =", currentBlock, "numberOfBlocks =", numberOfBlocks);
      if (currentBlock >= numberOfBlocks) {
        resolve(blockData);
      } else {
        runFlankerBlock(Session, currentBlock, numberOfTrials).then(function(data) {
          console.log("A flanker block should have just finished");
          console.log("numberOfTrials", numberOfTrials);

          currentBlock++;
          blockData = blockData.concat(data);
  
          if (currentBlock < numberOfBlocks - 1) {
            // if it's not the last block, display feedback message

            $("#query").html(flankerConst.pauseText);
            waitLeftOrRight().then(function() {
              $("#query").html("");
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

function flankerFeedback(data) {

}

var FlankerExperiment = function() {

  var instructionText = "Keep your eyes at the center of the screen. You will see a set of arrows."+
    "<br>Pay attention to the central arrow, ignoring the others.<br><br>" +
    "Using your right hand, press &larr; "+
    "(left) everytime the central arrow points to LEFT and <br>"+
    "&rarr; (right) when it points to RIGHT.<br><br>"+
    "Please respond as quickly and accurately as possible.<br><br>" +
    "Press &larr; or &rarr; to start.";
  var pauseText =  
    "Take a rest.<br>" +
    "When you are ready, press &larr; (left arrow)<br>" +
    "or &rarr; (right arrow) to continue";
  var longPauseText =   
    "Take a rest.<br><br>"+
    "Press &larr; (left arrow)<br>"+
    "Or &rarr; (right arrow) to continue";
  var practiceEndText = "You have finished the practice block. Press any key to start the task.";
  var endText = "Thank you for participating in this research!<br><br>";
  var lowAccText = "Try to answer more correctly.";
  var highAccText = "Try to answer more quickly.";
  var midAccText = "You are going very well!";

  var endText = "Thank you for participating in this research!<br><br>"+
    "Please don't close the window until data is saved<br>"+
    "Saving...";
  var savedText = "Thank you for participating in this research!<br><br>"+
  "";
  
  psiTurk.showPage('flankerStage.html');

  // psiTurk.recordUnstructuredData('ExperimentStartTime', (new Date()).toUTCString());
  var experimentStartTime = (new Date()).toUTCString();
  var experimentData = [];

  // First run a practice session
  $("#query").html(instructionText);
  return waitLeftOrRight().then(function() {
    $("#query").html(
      "First you will take some practice trials<br>"+
      "When the practice block is over, the real task will begin<br><br>"+
      "Press &larr; or &rarr; to continue."
    );
    return waitLeftOrRight();
  }).then(function() {
    $("#query").html("");
    return runFlankerBlock(0, 0, 4)
  }).then(function(data) {
    experimentData = experimentData.concat(data);
    $("#query").html("Now that the training is over, the test will begin<br><br>"+
      "Press &larr; or &rarr; to continue.");
    return waitLeftOrRight();
  }).then(function() {
    $("#query").html("");
    return runFlankerBlocks(4, 4, 1);
  }).then(function(data) {
    experimentData = experimentData.concat(data);

    return experimentData;
  });
};
