
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

function boundedRandomFloat(low, high) {
	return low + Math.random() * high;
}


var LEFT_KEY_CODE  = 37;
var RIGHT_KEY_CODE = 39;

function DelayedInput() {
  var self = {};
  
	var waitingForKeyPress = false;
	var lastKeyCode = NaN;
  var startTime = NaN;
  var inputDelay = NaN;
  var inputHappened = false;

	window.addEventListener('keydown', function(event) {
		if (
      waitingForKeyPress && 
      (event.keyCode === LEFT_KEY_CODE || event.keyCode === RIGHT_KEY_CODE)
    ) {
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
    lastKeyTime = NaN;
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