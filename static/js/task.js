'use strict';
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
  "exp/demographic.html",
  "exp/YBOCS.html",
  "exp/phqGad.html",
  "exp/hiloStage.html",
  "exp/review.html",
  "exp/saving.html",
  "exp/IUS-12.html"
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



var RunForm = function(formPage, formName) {
  psiTurk.showPage(formPage);
  $("html,body").animate({scrollTop: 0}, 0);

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
  psiTurk.showPage("exp/saving.html");
  console.log("global is", GLOBAL_DATA);

  psiTurk.recordTrialData(GLOBAL_DATA);
  psiTurk.saveData({
    success: function() {
      psiTurk.completeHIT();
    }
  });
}

// Task object to keep track of the current phase
var currentview;

/**
 * @returns {Promise}
 */
function showDataReview() {
  psiTurk.showPage("exp/review.html");

  $("#review-tables").html("")
  for (var data in GLOBAL_DATA) {
    $("#review-tables").html(
      $("#review-tables").html() +
      "<h3>" + data + "</h3>" +
      objArray2Table(GLOBAL_DATA[data]));
  }

  var button = $("#review button");
  console.log("button is", button);

  return new Promise(function(resolve) {
    $("#review button").click(function() {
      console.log("button clicked");
      resolve();
    });
  })
}

/*******************
 * Run Task
 ******************/
$(window).load(function() {

  return FlankerExperiment().then(function(data) {
    GLOBAL_DATA["flanker"] = data;
    return showDataReview();
  });

  RunForm("exp/OCI-R.html", "ocir").then(function() {
    return RunForm("exp/phqGad.html", "phqgad");
  }).then(function() {
    return RunForm("exp/demographic.html", "demographic");
  }).then(function() {
    return RunForm("exp/YBOCS.html", "ybocs");
  }).then(function() {
    return RunForm("exp/IUS-12.html", "ius12");
  }).then(function(){
    return FlankerExperiment();
  }).then(function(data) {
    GLOBAL_DATA["flanker"] = data;
    return HiLoExperiment();
  }).then(function(data) {
    GLOBAL_DATA["hilo"] = data;
    return showDataReview();
  }).then(function() {
    EndExperiment();
  });
  // HiLoExperiment();
});
