/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object

var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

console.log("My unique id is", uniqueId);

console.log('GLOBAL INFORMATION::::');
console.log('uniqueId', uniqueId);
console.log('adServerLoc', adServerLoc);
console.log('mode', mode);

var GLOBAL_DATA = {};


var mycondition = condition; // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance; // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
  "instructions/instruct-1.html",
  "instructions/instruct-2.html",
  "instructions/instruct-3.html",
  "instructions/instruct-ready.html",
  "flankerInstructions/instruct-1.html",
  "stage.html",
  "flankerStage.html",
  "postquestionnaire.html",
  "exp/OCI-R.html",
  "exp/demographicQuestionnaire.html",
  "exp/YBOCS.html",
  "exp/phqGad.html",
  "exp/hiloStage.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [
  // add as a list as many pages as you like
  "instructions/instruct-1.html",
  "instructions/instruct-2.html",
  "instructions/instruct-3.html",
  "instructions/instruct-ready.html"
];

var flankerInstructionPages = [
  "flankerInstructions/instruct-1.html"
];

/********************
 * HTML manipulation
 *
 * All HTML files in the templates directory are requested
 * from the server when the PsiTurk object is created above. We
 * need code to get those pages from the PsiTurk object and
 * insert them into the document.
 *
 ********************/

/**********************
 * BEGIN FLANKER CODE *
 **********************/
 
/**
 * 
 * @param {Number} nTrials 
 * @param {Object} additionalData
 */
var runFlankerBlock = function(nTrials, additionalData) {
  var arrowDurS = 0.2;
  var ITIMinS = 1.4;
  var ITIMaxS = 1.6;
  
  var nCoherentTrials = parseInt(nTrials / 2);
  var nIncoherentTrials = parseInt(nTrials / 2);
  
  
  var trialDir = [];
  for (var i = 0; i < nCoherentTrials + nIncoherentTrials; i++) {
    var dir = _.random(0, 1);
    trialDir.push({
      target: dir,
      flanker: i >= nCoherentTrials ? dir : Math.abs(dir - 1)
    });
  }
  trialDir = _.shuffle(trialDir);
  
  var listener = DelayedInput(); // utils.js
  var trialData = [];

  var correctHits = 0;

  return new Promise(function(resolve, reject) {
    function execTrial() {
      if (trialDir.length > 0) {
  
        var dir = trialDir.shift();
        var str = dirPairToStr(dir);
        var divHTML = "<div style='font-size: 44px;'>" + str + "</div>";
  
        $("#stim").html(divHTML);
        waitingForKeyPress = true;
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

  });
}

var FlankerExperiment = function() {

  var instructionText = "Keep your sight in the center of the screen. You will see a set of arrows."+
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

  var endText = "Obrigado pela sua participação!<br><br>"+
    "Por favor, não feche a janela até que as informações do teste sejam salvas.<br>"+
    "Salvando...";
  var savedText = "Obrigado pela sua participação!<br><br>"+
  "Dados salvos! A janela já pode ser fechada";
  
  psiTurk.showPage('flankerStage.html');

  // psiTurk.recordUnstructuredData('ExperimentStartTime', (new Date()).toUTCString());
  var experimentStartTime = (new Date()).toUTCString();
  var experimentData = [];

  // First run a practice session
  $("#query").html(instructionText);

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

};
/********************
 * END FLANKER CODE *
 ********************/

/**
 * BEGIN OCI-R form code
 */
var OciRQuestionnaire = function() {
  psiTurk.showPage("exp/OCI-R.html");
}
/**
 * END OCI-R form code
 */

var DemographicQuestionnaire = function() {
  console.log("I am going to load the dom questionnaire page");
  psiTurk.showPage("exp/demographicQuestionnaire.html");
}

var RunForm = function(formPage, formName) {
  psiTurk.showPage(formPage);

  var form = $("#" + formName).find("form");

  return new Promise(resolve => {
    $(form).submit(function(event) {
      event.preventDefault();
      GLOBAL_DATA[formName] = $(form).serializeArray();
      resolve();
    });
  });
}

var EndExperiment = function() {
  return new Promise(function(resolve) {
    psiTurk.recordTrialData(GLOBAL_DATA);
    psiTurk.saveData({
      success: function() {
        resolve();
      }
    })
  });
}

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load(function() {
  execPromiseList([
    RunForm.bind(this, "exp/phqGad.html", "phqgad"),
    RunForm.bind(this, "exp/YBOCS.html", "ybocs"),
    RunForm.bind(this, "exp/demographicQuestionnaire.html", "dem"),
    FlankerExperiment,
    HiLoExperiment,
    EndExperiment
  ]);
});
