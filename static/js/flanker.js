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

  /*
  return new Promise(function(resolve, reject) {
    function execTrial() {
      if (trialDir.length > 0) {
  
        var dir = trialDir.shift();
        var str = dirPairToStr(dir);
        var divHTML = "<div style='font-size: 44px;'>" + str + "</div>";
  
        $("#stim").html(divHTML);
        listener.listen();
  
        promiseTimeout(arrowDurS * 1000).then(function() {
          $("#stim").html("");
          return promiseTimeout(boundedRandomFloat(ITIMinS, ITIMaxS) * 1000);
        }).then(function() {
          var input = listener.result();
          console.log("input result:", input);
  
          var coherent = dir.target === dir.flanker;
          
          console.log('dir:', dir);
          if (
            input.keyCode === LEFT_KEY_CODE  && dir.target === 0 ||
            input.keyCode === RIGHT_KEY_CODE && dir.target === 1
          ) {
            console.log('ACERTOU');
            correctHits++;
          } else {
            console.log('ERROU');
          }
  
          trialData.push({
            ...additionalData, // TODO make this ES5 compatible
            Condition: String(coherent),
            TargetDirection: String(dir.target),
            FlankerDirection: String(dir.flanker),
            RT: String(input.delay / 1000),
            Correct: (
              input.keyCode === LEFT_KEY_CODE  && dir.target === 0 ||
              input.keyCode === RIGHT_KEY_CODE && dir.target === 1
            )
          });
          execTrial();
        });
      } else {
        console.log('TRIAL DATA IS', trialData);
        resolve({...trialData, accuracy: correctHits/nTrials});
      }
    }
  
    execTrial();

  });*/
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

  console.log("testandoooooooo");
  // return runFlankerBlock(0, 0, 4);
  return runFlankerBlock(0, 0, 10);

  /*
  return new Promise(function(resolve) {
    function startFlanker(event) {
      console.log("start flanker!!!!!!", event);
      if (event.keyCode === LEFT_KEY_CODE || event.keyCode === RIGHT_KEY_CODE) {
        window.removeEventListener("keydown", startFlanker);
        
        $("#query").html(
          "First you will take some practice trials<br>"+
          "When the practice block is over, the real task will begin"
        );
        promiseTimeout(2000).then(function() {
          $("#query").html("");
          return promiseTimeout(1000);
        }).then(function() {
          return runFlankerBlock(2, {
            Session: 0, 
            Block: 0, 
            Date: (new Date()).toUTCString()
          });
        }).then(function() {
          $("#query").html("Agora o teste irá começar de verdade");
          return promiseTimeout(2000);
        }).then(function(data1) {
          $("#query").html("");
          experimentData.push(data1);
          console.log("rodou primerio bloco", data1);
          return runFlankerBlock(2, {
            Session: 0, 
            Block: 1, 
            Date: (new Date()).toUTCString()
          });
        }).then(function(data2) {
          console.log("rodou o segundo bloco", data2);
          experimentData.push(data2);
          if (data2.accuracy <= ACCURACY_LOW) {
            $("#query").html(lowAccText);
          } else if (data2.accuracy <= ACCURACY_MEDIUM) {
            $("#query").html(midAccText);
          } else {
            $("#query").html(highAccText);
          }
          return promiseTimeout(2000);
        }).then(function() {
          $("#query").html("");
          return runFlankerBlock(2, {Session: 1, Block: 0, Date: (new Date()).toUTCString()});
        }).then(function(data3) {
          experimentData.push(data3);
          $("#query").html(endText);
          
          console.log("rodou o terceiro bloco", data3);
          
          console.log("psiTurk task data:", psiTurk.taskdata);
  
          GLOBAL_DATA['flanker'] = experimentData;
          resolve();
          // psiTurk.recordTrialData(experimentData);
          // psiTurk.saveData({
          //   success: function() {
          //     $("#query").html(savedText);
  
          //     console.log("going to send request with uniqueId", uniqueId);
          //     psiTurk.completeHIT();
          //     resolve();
          //   }
          // });
        });
      }
    }
    
    window.addEventListener('keydown', startFlanker);

  });
  */

};
/********************
 * END FLANKER CODE *
 ********************/