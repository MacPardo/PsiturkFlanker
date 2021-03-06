'use strict';

function AssertException(message) { this.message = message; }
AssertException.prototype.toString = function () {
	return 'AssertException: ' + this.message;
};

function assert(exp, message) {
	if (!exp) {
		throw new AssertException(message);
	}
}

// Mean of booleans (true==1; false==0)
function boolpercent(arr) {
	var count = 0;
	for (var i=0; i<arr.length; i++) {
		if (arr[i]) { count++; } 
	}
	return 100* count / arr.length;
}

/**
 * 
 * @param {Number} low 
 * @param {Number} high 
 */
function boundedRandomFloat(low, high) {
	return low + Math.random() * high;
}

/**
 * 
 * @param {Number} low 
 * @param {Number} high 
 */
function boundedRandomInt(low, high) {
  return parseInt(boundedRandomFloat(low, high));
}


var LEFT_KEY_CODE  = 37;
var RIGHT_KEY_CODE = 39;

var UP_KEY_CODE = 38;
var DOWN_KEY_CODE = 40;

function DelayedInput(vertical) {
  var self = {};

  console.log("created DelayedInput", vertical);
  
	var waitingForKeyPress = false;
	var lastKeyCode = NaN;
  var startTime = NaN;
  var inputDelay = NaN;
  var inputHappened = false;

	window.addEventListener('keydown', function(event) {
		if (
      waitingForKeyPress && 
      (
        !vertical && (event.keyCode === LEFT_KEY_CODE || event.keyCode === RIGHT_KEY_CODE) ||
        vertical && (event.keyCode === DOWN_KEY_CODE || event.keyCode === UP_KEY_CODE)
      )
    ) {
      console.log("captured event!", event.keyCode);
      waitingForKeyPress = false;
      inputHappened = true;
			lastKeyCode = event.keyCode;
      inputDelay = Math.floor(Date.now()) - startTime;
		}
	});
  
  self.listen = function() {
    waitingForKeyPress = true;
    inputHappened = false;
    lastKeyCode = NaN;
    inputDelay = NaN;
    startTime = Math.floor(Date.now());
  }

  self.result = function() {
    return ({
      keyCode: lastKeyCode,
      delay: inputDelay,
      inputHappened: inputHappened
    });
  }

  return self;
}

/**
 * @typedef {Object} DirectionPair
 * @property {Number} target 0 (left) or 1 (right)
 * @property {Number} flanker 0 (left) or 1 (right)
 */

/**
 * 
 * @param {DirectionPair} dir
 * @returns {String} 
 */
function dirPairToStr(dir) {
  var mainChar      = dir.target === 0 ? '<' : '>';
  var secondaryChar = dir.flanker === 0 ? '<' : '>';

  return secondaryChar +
    secondaryChar +
    mainChar + 
    secondaryChar + 
    secondaryChar;
}

/**
 * 
 * @param {Number} delay
 * @returns {Promise} 
 */
function promiseTimeout(delay) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, delay);
  });
}

/**
 * Resolves when either left or right arrow key is pressed
 * @returns {Promise}
 */
function promiseWaitKeys() {
  return new Promise(function(resolve) {
    function fn(event) {
      if (event.keyCode === LEFT_KEY_CODE || event.keyCode === RIGHT_KEY_CODE) {
        window.removeEventListener("keydown", fn);
        resolve();
      }
    }
    window.addEventListener("keydown", fn);
  });
}

/**
 * 
 * @param {(()=>Promise<any>)[]} list
 * @returns {Promise<any>} 
 */
function execPromiseList(list) {
  if (list.length === 0) {
    return new Promise(function(resolve) {
      resolve();
    });
  } else {
    var promiseFun = list.shift(); // also removes first element of list

    console.log("I am going to run ", promiseFun);

    var result = promiseFun();

    console.log("result is", result);

    return result.then(function() {
       return execPromiseList(list);
    });
  }
}

/**
 * @returns {Promise}
 */
function waitLeftOrRight() {
  return new Promise(function(resolve) {
    function fn(event) {
      if (event.keyCode === LEFT_KEY_CODE || event.keyCode === RIGHT_KEY_CODE) {
        window.removeEventListener("keydown", fn);
        resolve();
      }
    }
    window.addEventListener("keydown", fn);
  });
}


/**
 * @returns {Promise}
 */
function waitUpOrDown() {
  return new Promise(function(resolve) {
    function fn(event) {
      if (event.keyCode === UP_KEY_CODE || event.keyCode === DOWN_KEY_CODE) {
        window.removeEventListener("keydown", fn);
        resolve();
      }
    }
    window.addEventListener("keydown", fn);
  });
}

var ACCURACY_LOW    = 0.75;
var ACCURACY_MEDIUM = 0.90;

var SESSION_PRACTICE = "Practice";
var SESSION_TEST     = "Test";

/**
 * @param {HTMLElement} target
 * @returns {Promise}
 */
function blockCountdown(target) {
  var msg = "The task will begin in… ";
  var time = 1000;

  $(target).html(msg + "3");
  
  return promiseTimeout(time).then(function() {
    $(target).html(msg + "2");
    return promiseTimeout(time);
  }).then(function() {
    $(target).html(msg + "1");
    return promiseTimeout(time);
  }).then(function() {
    $(target).html("");
  });
}