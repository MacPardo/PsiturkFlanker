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

var FlankerExperiment = function(isPractice) {

  var instructionText = "Fixe o olhar no centro da tela. Você verá um grupo de setas."+
    "<br>Preste atenção na seta do centro e ignore as outras.<br><br>" +
    "Usando a sua mão direita, pressione &larr; "+
    "(esquerda) sempre que a seta central apontar para a ESQUERDA e <br>"+
    "&rarr; (direita) quando apontar para a DIREITA.<br><br>"+
    "Responda o mais rápido e corretamente possível.<br><br>" +
    "Pressione &larr; ou &rarr; para iniciar.";
  var pauseText =  
    "Descanse um pouco.<br>" +
    "Quando estiver pronto, pressione &larr; (seta para a esquerda)<br>" +
    "Ou &rarr; (seta para a direita) para continuar";
  var longPauseText =   
    "O experientador vai abrir uma porta da cabine agora. Descanse durante esse tempo.<br><br>"+
    "Pressione &larr; (seta para a esquerda)<br>"+
    "Ou &rarr; (seta para a direita) para continuar";
  var practiceEndText =   
    "Você terminou a prática. Pressione qualquer tecla para encerrar."+
    "Em seguida, aguarde até que o experimentador abra a porta da cabine.";
  var endText = "Obrigado pela sua participação!<br><br>"+
    "Por favor, não feche a janela até que as informações do teste sejam salvas.<br>"+
    "Salvando...";
  var savedText = "Obrigado pela sua participação!<br><br>"+
    "Dados salvos! A janela já pode ser fechada";
  var lowAccText = "Tente ser mais correto nas suas respostas.";
  var highAccText = "Tente responder mais rápido.";
  var midAccText = "Você está indo muito bem!";

  psiTurk.showPage('flankerStage.html');

  // psiTurk.recordUnstructuredData('ExperimentStartTime', (new Date()).toUTCString());
  var experimentStartTime = (new Date()).toUTCString();
  var experimentData = [];

  // First run a practice session
  $("#query").html(instructionText);
  function startFlanker(event) {
    console.log("start flanker!!!!!!", event);
    if (event.keyCode === LEFT_KEY_CODE || event.keyCode === RIGHT_KEY_CODE) {
      window.removeEventListener("keydown", startFlanker);
      
      $("#query").html(
        "Primeiro você irá treinar um pouco<br>"+
        "Após o treino o teste irá iniciar realmente"
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

        psiTurk.recordTrialData(experimentData);
        psiTurk.saveData({
          success: function() {
            $("#query").html(savedText);
            // psiTurk.computeBonus("compute_bonus", function() {
            //   psiTurk.completeHIT(); // when finished saving compute bonus, the quit
            // });

            console.log("going to send request with uniqueId", uniqueId);
            $.ajax("/compute_bonus", {
              type: "GET",
              data: {
                uniqueId: uniqueId
              },
              success: function(res) {
                console.log("REQ to compute_bonus SUCCESS", res);
              },
              error: function(res) {
                console.log("REQ to compute_bonus FAIL", res);
              }
            });
          }
        });
      });
    }
  }
  
  window.addEventListener('keydown', startFlanker);
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
