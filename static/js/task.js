/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object

var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition; // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance; // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

console.log("condition", condition);
console.log("counterbalance", counterbalance);

// All pages to be loaded
var pages = [
  "instructions/instruct-1.html",
  "instructions/instruct-2.html",
  "instructions/instruct-3.html",
  "instructions/instruct-ready.html",
  "flankerInstructions/instruct-1.html",
  "stage.html",
  "flankerStage.html",
  "postquestionnaire.html"
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

console.log("TESTING ALTERATIONS");

/********************
 * HTML manipulation
 *
 * All HTML files in the templates directory are requested
 * from the server when the PsiTurk object is created above. We
 * need code to get those pages from the PsiTurk object and
 * insert them into the document.
 *
 ********************/

/**
 * 
 * @param {Number} nTrials 
 * @param {Object} additionalData
 * @param {Function} callback
 */
var runFlankerBlock = function(nTrials, additionalData, callback) {
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

  function execTrial() {
    if (trialDir.length > 0) {

      var dir = trialDir.shift();
      var str = dirPairToStr(dir);
      var divHTML = "<div style='font-size: 44px;'>" + str + "</div>";

      $("#stim").html(divHTML);
      waitingForKeyPress = true;
      listener.listen();

      setTimeout(function() {
        $("#stim").html("");
        
        setTimeout(function() {
          var input = listener.result();
          console.log("input result:", input);

          var coherent = dir.target === dir.flanker;
          
          console.log('dir:', dir);
          if (
            input.keyCode === LEFT_KEY_CODE  && dir.target === 0 ||
            input.keyCode === RIGHT_KEY_CODE && dir.target === 1
          ) {
            console.log('ACERTOU');
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
        }, boundedRandomFloat(ITIMinS, ITIMaxS) * 1000);
      }, arrowDurS * 1000);
    } else {
      console.log('TRIAL DATA IS', trialData);
      callback(trialData);
    }
  }

  execTrial();
}  

var FlankerExperiment = function(isPractice) {

  var instructionText = "Fixe o olhar no centro da tela. Você verá um grupo de setas."+
    "\nPreste atenção na seta do centro e ignore as outras. \n\n" +
    "Usando a sua mão direita, pressione &larr; "+
    "(esquerda) sempre que a seta central apontar para a ESQUERDA e \n"+
    "&rarr; (direita) quando apontar para a DIREITA.\n\n"+
    "Responda o mais rápido e corretamente possível.\n\n" +
    "Pressione &larr; ou &rarr; para iniciar.";
  var pauseText =  
    "Descanse um pouco.\n" +
    "Quando estiver pronto, pressione &larr; (seta para a esquerda)\n" +
    "Ou &rarr; (seta para a direita) para continuar";
  var longPauseText =   
    "O experientador vai abrir uma porta da cabine agora. Descanse durante esse tempo.\n\n"+
    "Pressione &larr; (seta para a esquerda)\n"+
    "Ou &rarr; (seta para a direita) para continuar";
  var practiceEndText =   
    "Você terminou a prática. Pressione qualquer tecla para encerrar."+
    "Em seguida, aguarde até que o experimentador abra a porta da cabine.";
  var endText = "Obrigado pela sua participação!\n\nPressione qualquer tecla para encerrar.";  
  var lowAccText = "Tente ser mais correto nas suas respostas.";
  var highAccText = "Tente responder mais rápido.";
  var midAccText = "Você está indo muito bem!";

  // var arrowDurS = 0.2;       // time target arrow is onscreen (in seconds)

  console.log("LODASH IS", _);
  psiTurk.showPage('flankerStage.html');


  // First run a practice session
  runFlankerBlock(20, {Session: 0, Block: 0}, function(data1) {
    console.log("ran first block!!!");
    runFlankerBlock(2, {Session: 1, Block: 0}, function(data2) {
      console.log("ran second block!!!");
      runFlankerBlock(2, {Session: 1, Block: 1}, function(data3) {
        
      });
    });
  });

};

/********************
 * STROOP TEST       *
 ********************/
var StroopExperiment = function() {
  var wordon, // time word is presented
    listening = false;

  // Stimuli for a basic Stroop experiment
  var stims = [
    ["SHIP", "red", "unrelated"],
    ["MONKEY", "green", "unrelated"],
    ["ZAMBONI", "blue", "unrelated"],
    ["RED", "red", "congruent"],
    ["GREEN", "green", "congruent"],
    ["BLUE", "blue", "congruent"],
    ["GREEN", "red", "incongruent"],
    ["BLUE", "green", "incongruent"],
    ["RED", "blue", "incongruent"]
  ];

  stims = _.shuffle(stims);

  var next = function() {
    if (stims.length === 0) {
      finish();
    } else {
      stim = stims.shift();
      show_word(stim[0], stim[1]);
      wordon = new Date().getTime();
      listening = true;
      d3.select("#query").html(
        '<p id="prompt">Type "R" for Red, "B" for blue, "G" for green.</p>'
      );
    }
  };

  var response_handler = function(e) {
    if (!listening) return;

    var keyCode = e.keyCode,
      response;

    switch (keyCode) {
      case 82:
        // "R"
        response = "red";
        break;
      case 71:
        // "G"
        response = "green";
        break;
      case 66:
        // "B"
        response = "blue";
        break;
      default:
        response = "";
        break;
    }
    if (response.length > 0) {
      listening = false;
      var hit = response == stim[1];
      var rt = new Date().getTime() - wordon;

      psiTurk.recordTrialData({
        phase: "TEST",
        word: stim[0],
        color: stim[1],
        relation: stim[2],
        response: response,
        hit: hit,
        rt: rt
      });
      remove_word();
      next();
    }
  };

  var finish = function() {
    $("body").unbind("keydown", response_handler); // Unbind keys
    currentview = new Questionnaire();
  };

  var show_word = function(text, color) {
    d3.select("#stim")
      .append("div")
      .attr("id", "word")
      .style("color", color)
      .style("text-align", "center")
      .style("font-size", "150px")
      .style("font-weight", "400")
      .style("margin", "20px")
      .text(text);
  };

  var remove_word = function() {
    d3.select("#word").remove();
  };

  // Load the stage.html snippet into the body of the page
  psiTurk.showPage("stage.html");

  // Register the response handler that is defined above to handle any
  // key down events.
  $("body")
    .focus()
    .keydown(response_handler);

  // Start the test
  next();
};

/****************
 * Questionnaire *
 ****************/

var Questionnaire = function() {
  var error_message =
    "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

  record_responses = function() {
    psiTurk.recordTrialData({ phase: "postquestionnaire", status: "submit" });

    $("textarea").each(function(i, val) {
      psiTurk.recordUnstructuredData(this.id, this.value);
    });
    $("select").each(function(i, val) {
      psiTurk.recordUnstructuredData(this.id, this.value);
    });
  };

  prompt_resubmit = function() {
    document.body.innerHTML = error_message;
    $("#resubmit").click(resubmit);
  };

  resubmit = function() {
    document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
    reprompt = setTimeout(prompt_resubmit, 10000);

    psiTurk.saveData({
      success: function() {
        clearInterval(reprompt);
        psiTurk.computeBonus("compute_bonus", function() {
          psiTurk.completeHIT(); // when finished saving compute bonus, the quit
        });
      },
      error: prompt_resubmit
    });
  };

  // Load the questionnaire snippet
  psiTurk.showPage("postquestionnaire.html");
  psiTurk.recordTrialData({ phase: "postquestionnaire", status: "begin" });

  $("#next").click(function() {
    record_responses();
    psiTurk.saveData({
      success: function() {
        psiTurk.computeBonus("compute_bonus", function() {
          psiTurk.completeHIT(); // when finished saving compute bonus, the quit
        });
      },
      error: prompt_resubmit
    });
  });
};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load(function() {
  psiTurk.doInstructions(
    flankerInstructionPages, // a list of pages you want to display in sequence
    function() {
      // currentview = new StroopExperiment();
      currentview = new FlankerExperiment();
    } // what you want to do when you are done with instructions
  );
});
