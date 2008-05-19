var MooTools = {
version: '1.11'
};
function $defined(obj){
return (obj != undefined);
};
function $type(obj){
if (!$defined(obj)) return false;
if (obj.htmlElement) return 'element';
var type = typeof obj;
if (type == 'object' && obj.nodeName){
switch(obj.nodeType){
case 1: return 'element';
case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
}
}
if (type == 'object' || type == 'function'){
switch(obj.constructor){
case Array: return 'array';
case RegExp: return 'regexp';
case Class: return 'class';
}
if (typeof obj.length == 'number'){
if (obj.item) return 'collection';
if (obj.callee) return 'arguments';
}
}
return type;
};
function $merge(){
var mix = {};
for (var i = 0; i < arguments.length; i++){
for (var property in arguments[i]){
var ap = arguments[i][property];
var mp = mix[property];
if (mp && $type(ap) == 'object' && $type(mp) == 'object') mix[property] = $merge(mp, ap);
else mix[property] = ap;
}
}
return mix;
};
var $extend = function(){
var args = arguments;
if (!args[1]) args = [this, args[0]];
for (var property in args[1]) args[0][property] = args[1][property];
return args[0];
};
var $native = function(){
for (var i = 0, l = arguments.length; i < l; i++){
arguments[i].extend = function(props){
for (var prop in props){
if (!this.prototype[prop]) this.prototype[prop] = props[prop];
if (!this[prop]) this[prop] = $native.generic(prop);
}
};
}
};
$native.generic = function(prop){
return function(bind){
return this.prototype[prop].apply(bind, Array.prototype.slice.call(arguments, 1));
};
};
$native(Function, Array, String, Number);
function $chk(obj){
return !!(obj || obj === 0);
};
function $pick(obj, picked){
return $defined(obj) ? obj : picked;
};
function $random(min, max){
return Math.floor(Math.random() * (max - min + 1) + min);
};
var Abstract = function(obj){
obj = obj || {};
obj.extend = $extend;
return obj;
};
var Window = new Abstract(window);
var Document = new Abstract(document);
document.head = document.getElementsByTagName('head')[0];
window.xpath = !!(document.evaluate);
if (window.ActiveXObject) window.ie = window[window.XMLHttpRequest ? 'ie7' : 'ie6'] = true;
else if (document.childNodes && !document.all && !navigator.taintEnabled) window.webkit = window[window.xpath ? 'webkit420' : 'webkit419'] = true;
else if (document.getBoxObjectFor != null) window.gecko = true;
window.khtml = window.webkit;
Object.extend = $extend;
if (typeof HTMLElement == 'undefined'){
var HTMLElement = function(){};
if (window.webkit) document.createElement("iframe"); //fixes safari
HTMLElement.prototype = (window.webkit) ? window["[[DOMElement.prototype]]"] : {};
}
HTMLElement.prototype.htmlElement = function(){};
if (window.ie6) try {document.execCommand("BackgroundImageCache", false, true);} catch(e){};
var Class = function(properties){
var klass = function(){
return (arguments[0] !== null && this.initialize && $type(this.initialize) == 'function') ? this.initialize.apply(this, arguments) : this;
};
$extend(klass, this);
klass.prototype = properties;
klass.constructor = Class;
return klass;
};
Class.empty = function(){};
Class.prototype = {
extend: function(properties){
var proto = new this(null);
for (var property in properties){
var pp = proto[property];
proto[property] = Class.Merge(pp, properties[property]);
}
return new Class(proto);
},
implement: function(){
for (var i = 0, l = arguments.length; i < l; i++) $extend(this.prototype, arguments[i]);
}
};
Class.Merge = function(previous, current){
if (previous && previous != current){
var type = $type(current);
if (type != $type(previous)) return current;
switch(type){
case 'function':
var merged = function(){
this.parent = arguments.callee.parent;
return current.apply(this, arguments);
};
merged.parent = previous;
return merged;
case 'object': return $merge(previous, current);
}
}
return current;
};
var Events = new Class({

/*
Property: addEvent
adds an event to the stack of events of the Class instance.

Arguments:
type - string; the event name (e.g. 'onComplete')
fn - function to execute
*/

addEvent: function(type, fn){
if (fn != Class.empty){
this.$events = this.$events || {};
this.$events[type] = this.$events[type] || [];
this.$events[type].include(fn);
}
return this;
},

/*
Property: fireEvent
fires all events of the specified type in the Class instance.

Arguments:
type - string; the event name (e.g. 'onComplete')
args - array or single object; arguments to pass to the function; if more than one argument, must be an array
delay - (integer) delay (in ms) to wait to execute the event

Example:
(start code)
var Widget = new Class({
initialize: function(arg1, arg2){
...
this.fireEvent("onInitialize", [arg1, arg2], 50);
}
});
Widget.implement(new Events);
(end)
*/

fireEvent: function(type, args, delay){
if (this.$events && this.$events[type]){
this.$events[type].each(function(fn){
fn.create({'bind': this, 'delay': delay, 'arguments': args})();
}, this);
}
return this;
},

/*
Property: removeEvent
removes an event from the stack of events of the Class instance.

Arguments:
type - string; the event name (e.g. 'onComplete')
fn - function that was added
*/

removeEvent: function(type, fn){
if (this.$events && this.$events[type]) this.$events[type].remove(fn);
return this;
}

});
var Options = new Class({

/*
Property: setOptions
sets this.options

Arguments:
defaults - object; the default set of options
options - object; the user entered options. can be empty too.

Note:
if your Class has <Events> implemented, every option beginning with on, followed by a capital letter (onComplete) becomes an Class instance event.
*/

setOptions: function(){
this.options = $merge.apply(null, [this.options].extend(arguments));
if (this.addEvent){
for (var option in this.options){
if ($type(this.options[option] == 'function') && (/^on[A-Z]/).test(option)) this.addEvent(option, this.options[option]);
}
}
return this;
}

});
Array.extend({

/*
Property: forEach
Iterates through an array; This method is only available for browsers without native *forEach* support.
For more info see <http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:forEach>

*forEach* executes the provided function (callback) once for each element present in the array. callback is invoked only for indexes of the array which have assigned values; it is not invoked for indexes which have been deleted or which have never been assigned values.

Arguments:
fn - function to execute with each item in the array; passed the item and the index of that item in the array
bind - the object to bind "this" to (see <Function.bind>)

Example:
>['apple','banana','lemon'].each(function(item, index){
>	alert(index + " = " + item); //alerts "0 = apple" etc.
>}, bindObj); //optional second arg for binding, not used here
*/

forEach: function(fn, bind){
for (var i = 0, j = this.length; i < j; i++) fn.call(bind, this[i], i, this);
},

/*
Property: filter
This method is provided only for browsers without native *filter* support.
For more info see <http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:filter>

*filter* calls a provided callback function once for each element in an array, and constructs a new array of all the values for which callback returns a true value. callback is invoked only for indexes of the array which have assigned values; it is not invoked for indexes which have been deleted or which have never been assigned values. Array elements which do not pass the callback test are simply skipped, and are not included in the new array.

Arguments:
fn - function to execute with each item in the array; passed the item and the index of that item in the array
bind - the object to bind "this" to (see <Function.bind>)

Example:
>var biggerThanTwenty = [10,3,25,100].filter(function(item, index){
> return item > 20;
>});
>//biggerThanTwenty = [25,100]
*/

filter: function(fn, bind){
var results = [];
for (var i = 0, j = this.length; i < j; i++){
if (fn.call(bind, this[i], i, this)) results.push(this[i]);
}
return results;
},

/*
Property: map
This method is provided only for browsers without native *map* support.
For more info see <http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:map>

*map* calls a provided callback function once for each element in an array, in order, and constructs a new array from the results. callback is invoked only for indexes of the array which have assigned values; it is not invoked for indexes which have been deleted or which have never been assigned values.

Arguments:
fn - function to execute with each item in the array; passed the item and the index of that item in the array
bind - the object to bind "this" to (see <Function.bind>)

Example:
>var timesTwo = [1,2,3].map(function(item, index){
> return item*2;
>});
>//timesTwo = [2,4,6];
*/

map: function(fn, bind){
var results = [];
for (var i = 0, j = this.length; i < j; i++) results[i] = fn.call(bind, this[i], i, this);
return results;
},

/*
Property: every
This method is provided only for browsers without native *every* support.
For more info see <http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:every>

*every* executes the provided callback function once for each element present in the array until it finds one where callback returns a false value. If such an element is found, the every method immediately returns false. Otherwise, if callback returned a true value for all elements, every will return true. callback is invoked only for indexes of the array which have assigned values; it is not invoked for indexes which have been deleted or which have never been assigned values.

Arguments:
fn - function to execute with each item in the array; passed the item and the index of that item in the array
bind - the object to bind "this" to (see <Function.bind>)

Example:
>var areAllBigEnough = [10,4,25,100].every(function(item, index){
> return item > 20;
>});
>//areAllBigEnough = false
*/

every: function(fn, bind){
for (var i = 0, j = this.length; i < j; i++){
if (!fn.call(bind, this[i], i, this)) return false;
}
return true;
},

/*
Property: some
This method is provided only for browsers without native *some* support.
For more info see <http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:some>

*some* executes the callback function once for each element present in the array until it finds one where callback returns a true value. If such an element is found, some immediately returns true. Otherwise, some returns false. callback is invoked only for indexes of the array which have assigned values; it is not invoked for indexes which have been deleted or which have never been assigned values.

Arguments:
fn - function to execute with each item in the array; passed the item and the index of that item in the array
bind - the object to bind "this" to (see <Function.bind>)

Example:
>var isAnyBigEnough = [10,4,25,100].some(function(item, index){
> return item > 20;
>});
>//isAnyBigEnough = true
*/

some: function(fn, bind){
for (var i = 0, j = this.length; i < j; i++){
if (fn.call(bind, this[i], i, this)) return true;
}
return false;
},

/*
Property: indexOf
This method is provided only for browsers without native *indexOf* support.
For more info see <http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:indexOf>

*indexOf* compares a search element to elements of the Array using strict equality (the same method used by the ===, or triple-equals, operator).

Arguments:
item - any type of object; element to locate in the array
from - integer; optional; the index of the array at which to begin the search (defaults to 0)

Example:
>['apple','lemon','banana'].indexOf('lemon'); //returns 1
>['apple','lemon'].indexOf('banana'); //returns -1
*/

indexOf: function(item, from){
var len = this.length;
for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
if (this[i] === item) return i;
}
return -1;
},

/*
Property: each
Same as <Array.forEach>.

Arguments:
fn - function to execute with each item in the array; passed the item and the index of that item in the array
bind - optional, the object that the "this" of the function will refer to.

Example:
>var Animals = ['Cat', 'Dog', 'Coala'];
>Animals.each(function(animal){
>	document.write(animal)
>});
*/

/*
Property: copy
returns a copy of the array.

Returns:
a new array which is a copy of the current one.

Arguments:
start - integer; optional; the index where to start the copy, default is 0. If negative, it is taken as the offset from the end of the array.
length - integer; optional; the number of elements to copy. By default, copies all elements from start to the end of the array.

Example:
>var letters = ["a","b","c"];
>var copy = letters.copy();		// ["a","b","c"] (new instance)
*/

copy: function(start, length){
start = start || 0;
if (start < 0) start = this.length + start;
length = length || (this.length - start);
var newArray = [];
for (var i = 0; i < length; i++) newArray[i] = this[start++];
return newArray;
},

/*
Property: remove
Removes all occurrences of an item from the array.

Arguments:
item - the item to remove

Returns:
the Array with all occurrences of the item removed.

Example:
>["1","2","3","2"].remove("2") // ["1","3"];
*/

remove: function(item){
var i = 0;
var len = this.length;
while (i < len){
if (this[i] === item){
this.splice(i, 1);
len--;
} else {
i++;
}
}
return this;
},

/*
Property: contains
Tests an array for the presence of an item.

Arguments:
item - the item to search for in the array.
from - integer; optional; the index at which to begin the search, default is 0. If negative, it is taken as the offset from the end of the array.

Returns:
true - the item was found
false - it wasn't

Example:
>["a","b","c"].contains("a"); // true
>["a","b","c"].contains("d"); // false
*/

contains: function(item, from){
return this.indexOf(item, from) != -1;
},

/*
Property: associate
Creates an object with key-value pairs based on the array of keywords passed in
and the current content of the array.

Arguments:
keys - the array of keywords.

Example:
(start code)
var Animals = ['Cat', 'Dog', 'Coala', 'Lizard'];
var Speech = ['Miao', 'Bau', 'Fruuu', 'Mute'];
var Speeches = Animals.associate(Speech);
//Speeches['Miao'] is now Cat.
//Speeches['Bau'] is now Dog.
//...
(end)
*/

associate: function(keys){
var obj = {}, length = Math.min(this.length, keys.length);
for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
return obj;
},

/*
Property: extend
Extends an array with another one.

Arguments:
array - the array to extend ours with

Example:
>var Animals = ['Cat', 'Dog', 'Coala'];
>Animals.extend(['Lizard']);
>//Animals is now: ['Cat', 'Dog', 'Coala', 'Lizard'];
*/

extend: function(array){
for (var i = 0, j = array.length; i < j; i++) this.push(array[i]);
return this;
},

/*
Property: merge
merges an array in another array, without duplicates. (case- and type-sensitive)

Arguments:
array - the array to merge from.

Example:
>['Cat','Dog'].merge(['Dog','Coala']); //returns ['Cat','Dog','Coala']
*/

merge: function(array){
for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
return this;
},

/*
Property: include
includes the passed in element in the array, only if its not already present. (case- and type-sensitive)

Arguments:
item - item to add to the array (if not present)

Example:
>['Cat','Dog'].include('Dog'); //returns ['Cat','Dog']
>['Cat','Dog'].include('Coala'); //returns ['Cat','Dog','Coala']
*/

include: function(item){
if (!this.contains(item)) this.push(item);
return this;
},

/*
Property: getRandom
returns a random item in the Array
*/

getRandom: function(){
return this[$random(0, this.length - 1)] || null;
},

/*
Property: getLast
returns the last item in the Array
*/

getLast: function(){
return this[this.length - 1] || null;
}

});
Array.prototype.each = Array.prototype.forEach;
Array.each = Array.forEach;
function $A(array){
return Array.copy(array);
};
function $each(iterable, fn, bind){
if (iterable && typeof iterable.length == 'number' && $type(iterable) != 'object'){
Array.forEach(iterable, fn, bind);
} else {
for (var name in iterable) fn.call(bind || iterable, iterable[name], name);
}
};
Array.prototype.test = Array.prototype.contains;
String.extend({

/*
Property: test
Tests a string with a regular expression.

Arguments:
regex - a string or regular expression object, the regular expression you want to match the string with
params - optional, if first parameter is a string, any parameters you want to pass to the regex ('g' has no effect)

Returns:
true if a match for the regular expression is found in the string, false if not.
See <http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:RegExp:test>

Example:
>"I like cookies".test("cookie"); // returns true
>"I like cookies".test("COOKIE", "i") // ignore case, returns true
>"I like cookies".test("cake"); // returns false
*/

test: function(regex, params){
return (($type(regex) == 'string') ? new RegExp(regex, params) : regex).test(this);
},

/*
Property: toInt
parses a string to an integer.

Returns:
either an int or "NaN" if the string is not a number.

Example:
>var value = "10px".toInt(); // value is 10
*/

toInt: function(){
return parseInt(this, 10);
},

/*
Property: toFloat
parses a string to an float.

Returns:
either a float or "NaN" if the string is not a number.

Example:
>var value = "10.848".toFloat(); // value is 10.848
*/

toFloat: function(){
return parseFloat(this);
},

/*
Property: camelCase
Converts a hiphenated string to a camelcase string.

Example:
>"I-like-cookies".camelCase(); //"ILikeCookies"

Returns:
the camel cased string
*/

camelCase: function(){
return this.replace(/-\D/g, function(match){
return match.charAt(1).toUpperCase();
});
},

/*
Property: hyphenate
Converts a camelCased string to a hyphen-ated string.

Example:
>"ILikeCookies".hyphenate(); //"I-like-cookies"
*/

hyphenate: function(){
return this.replace(/\w[A-Z]/g, function(match){
return (match.charAt(0) + '-' + match.charAt(1).toLowerCase());
});
},

/*
Property: capitalize
Converts the first letter in each word of a string to Uppercase.

Example:
>"i like cookies".capitalize(); //"I Like Cookies"

Returns:
the capitalized string
*/

capitalize: function(){
return this.replace(/\b[a-z]/g, function(match){
return match.toUpperCase();
});
},

/*
Property: trim
Trims the leading and trailing spaces off a string.

Example:
>"    i like cookies     ".trim() //"i like cookies"

Returns:
the trimmed string
*/

trim: function(){
return this.replace(/^\s+|\s+$/g, '');
},

/*
Property: clean
trims (<String.trim>) a string AND removes all the double spaces in a string.

Returns:
the cleaned string

Example:
>" i      like     cookies      \n\n".clean() //"i like cookies"
*/

clean: function(){
return this.replace(/\s{2,}/g, ' ').trim();
},
rgbToHex: function(array){
var rgb = this.match(/\d{1,3}/g);
return (rgb) ? rgb.rgbToHex(array) : false;
},
hexToRgb: function(array){
var hex = this.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
return (hex) ? hex.slice(1).hexToRgb(array) : false;
},
contains: function(string, s){
return (s) ? (s + this + s).indexOf(s + string + s) > -1 : this.indexOf(string) > -1;
},
escapeRegExp: function(){
return this.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
}
});
Array.extend({

/*
Property: rgbToHex
see <String.rgbToHex>, but as an array method.
*/

rgbToHex: function(array){
if (this.length < 3) return false;
if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
var hex = [];
for (var i = 0; i < 3; i++){
var bit = (this[i] - 0).toString(16);
hex.push((bit.length == 1) ? '0' + bit : bit);
}
return array ? hex : '#' + hex.join('');
},

/*
Property: hexToRgb
same as <String.hexToRgb>, but as an array method.
*/

hexToRgb: function(array){
if (this.length != 3) return false;
var rgb = [];
for (var i = 0; i < 3; i++){
rgb.push(parseInt((this[i].length == 1) ? this[i] + this[i] : this[i], 16));
}
return array ? rgb : 'rgb(' + rgb.join(',') + ')';
}

});
Function.extend({

/*
Property: create
Main function to create closures.

Returns:
a function.

Arguments:
options - An Options object.

Options:
bind - The object that the "this" of the function will refer to. Default is the current function.
event - If set to true, the function will act as an event listener and receive an event as first argument.
If set to a class name, the function will receive a new instance of this class (with the event passed as argument's constructor) as first argument.
Default is false.
arguments - A single argument or array of arguments that will be passed to the function when called.

If both the event and arguments options are set, the event is passed as first argument and the arguments array will follow.

Default is no custom arguments, the function will receive the standard arguments when called.

delay - Numeric value: if set, the returned function will delay the actual execution by this amount of milliseconds and return a timer handle when called.
Default is no delay.
periodical - Numeric value: if set, the returned function will periodically perform the actual execution with this specified interval and return a timer handle when called.
Default is no periodical execution.
attempt - If set to true, the returned function will try to execute and return either the results or false on error. Default is false.
*/

create: function(options){
var fn = this;
options = $merge({
'bind': fn,
'event': false,
'arguments': null,
'delay': false,
'periodical': false,
'attempt': false
}, options);
if ($chk(options.arguments) && $type(options.arguments) != 'array') options.arguments = [options.arguments];
return function(event){
var args;
if (options.event){
event = event || window.event;
args = [(options.event === true) ? event : new options.event(event)];
if (options.arguments) args.extend(options.arguments);
}
else args = options.arguments || arguments;
var returns = function(){
return fn.apply($pick(options.bind, fn), args);
};
if (options.delay) return setTimeout(returns, options.delay);
if (options.periodical) return setInterval(returns, options.periodical);
if (options.attempt) try {return returns();} catch(err){return false;};
return returns();
};
},

/*
Property: pass
Shortcut to create closures with arguments and bind.

Returns:
a function.

Arguments:
args - the arguments passed. must be an array if arguments > 1
bind - optional, the object that the "this" of the function will refer to.

Example:
>myFunction.pass([arg1, arg2], myElement);
*/

pass: function(args, bind){
return this.create({'arguments': args, 'bind': bind});
},

/*
Property: attempt
Tries to execute the function, returns either the result of the function or false on error.

Arguments:
args - the arguments passed. must be an array if arguments > 1
bind - optional, the object that the "this" of the function will refer to.

Example:
>myFunction.attempt([arg1, arg2], myElement);
*/

attempt: function(args, bind){
return this.create({'arguments': args, 'bind': bind, 'attempt': true})();
},

/*
Property: bind
method to easily create closures with "this" altered.

Arguments:
bind - optional, the object that the "this" of the function will refer to.
args - optional, the arguments passed. must be an array if arguments > 1

Returns:
a function.

Example:
>function myFunction(){
>	this.setStyle('color', 'red');
>	// note that 'this' here refers to myFunction, not an element
>	// we'll need to bind this function to the element we want to alter
>};
>var myBoundFunction = myFunction.bind(myElement);
>myBoundFunction(); // this will make the element myElement red.
*/

bind: function(bind, args){
return this.create({'bind': bind, 'arguments': args});
},

/*
Property: bindAsEventListener
cross browser method to pass event firer

Arguments:
bind - optional, the object that the "this" of the function will refer to.
args - optional, the arguments passed. must be an array if arguments > 1

Returns:
a function with the parameter bind as its "this" and as a pre-passed argument event or window.event, depending on the browser.

Example:
>function myFunction(event){
>	alert(event.clientx) //returns the coordinates of the mouse..
>};
>myElement.onclick = myFunction.bindAsEventListener(myElement);
*/

bindAsEventListener: function(bind, args){
return this.create({'bind': bind, 'event': true, 'arguments': args});
},

/*
Property: delay
Delays the execution of a function by a specified duration.

Arguments:
delay - the duration to wait in milliseconds.
bind - optional, the object that the "this" of the function will refer to.
args - optional, the arguments passed. must be an array if arguments > 1

Example:
>myFunction.delay(50, myElement) //wait 50 milliseconds, then call myFunction and bind myElement to it
>(function(){alert('one second later...')}).delay(1000); //wait a second and alert
*/

delay: function(delay, bind, args){
return this.create({'delay': delay, 'bind': bind, 'arguments': args})();
},

/*
Property: periodical
Executes a function in the specified intervals of time

Arguments:
interval - the duration of the intervals between executions.
bind - optional, the object that the "this" of the function will refer to.
args - optional, the arguments passed. must be an array if arguments > 1
*/

periodical: function(interval, bind, args){
return this.create({'periodical': interval, 'bind': bind, 'arguments': args})();
}

});
Number.extend({

/*
Property: toInt
Returns this number; useful because toInt must work on both Strings and Numbers.
*/

toInt: function(){
return parseInt(this);
},

/*
Property: toFloat
Returns this number as a float; useful because toFloat must work on both Strings and Numbers.
*/

toFloat: function(){
return parseFloat(this);
},

/*
Property: limit
Limits the number.

Arguments:
min - number, minimum value
max - number, maximum value

Returns:
the number in the given limits.

Example:
>(12).limit(2, 6.5)  // returns 6.5
>(-4).limit(2, 6.5)  // returns 2
>(4.3).limit(2, 6.5) // returns 4.3
*/

limit: function(min, max){
return Math.min(max, Math.max(min, this));
},

/*
Property: round
Returns the number rounded to specified precision.

Arguments:
precision - integer, number of digits after the decimal point. Can also be negative or zero (default).

Example:
>12.45.round() // returns 12
>12.45.round(1) // returns 12.5
>12.45.round(-1) // returns 10

Returns:
The rounded number.
*/

round: function(precision){
precision = Math.pow(10, precision || 0);
return Math.round(this * precision) / precision;
},

/*
Property: times
Executes a passed in function the specified number of times

Arguments:
function - the function to be executed on each iteration of the loop

Example:
>(4).times(alert);
*/

times: function(fn){
for (var i = 0; i < this; i++) fn(i);
}

});
var Element = new Class({

/*
Property: initialize
Creates a new element of the type passed in.

Arguments:
el - string; the tag name for the element you wish to create. you can also pass in an element reference, in which case it will be extended.
props - object; the properties you want to add to your element.
Accepts the same keys as <Element.setProperties>, but also allows events and styles

Props:
the key styles will be used as setStyles, the key events will be used as addEvents. any other key is used as setProperty.

Example:
(start code)
new Element('a', {
'styles': {
'display': 'block',
'border': '1px solid black'
},
'events': {
'click': function(){
//aaa
},
'mousedown': function(){
//aaa
}
},
'class': 'myClassSuperClass',
'href': 'http://mad4milk.net'
});

(end)
*/

initialize: function(el, props){
if ($type(el) == 'string'){
if (window.ie && props && (props.name || props.type)){
var name = (props.name) ? ' name="' + props.name + '"' : '';
var type = (props.type) ? ' type="' + props.type + '"' : '';
delete props.name;
delete props.type;
el = '<' + el + name + type + '>';
}
el = document.createElement(el);
}
el = $(el);
return (!props || !el) ? el : el.set(props);
}

});
var Elements = new Class({

initialize: function(elements){
return (elements) ? $extend(elements, this) : this;
}

});
Elements.extend = function(props){
for (var prop in props){
this.prototype[prop] = props[prop];
this[prop] = $native.generic(prop);
}
};
function $(el){
if (!el) return null;
if (el.htmlElement) return Garbage.collect(el);
if ([window, document].contains(el)) return el;
var type = $type(el);
if (type == 'string'){
el = document.getElementById(el);
type = (el) ? 'element' : false;
}
if (type != 'element') return null;
if (el.htmlElement) return Garbage.collect(el);
if (['object', 'embed'].contains(el.tagName.toLowerCase())) return el;
$extend(el, Element.prototype);
el.htmlElement = function(){};
return Garbage.collect(el);
};
document.getElementsBySelector = document.getElementsByTagName;
function $$(){
var elements = [];
for (var i = 0, j = arguments.length; i < j; i++){
var selector = arguments[i];
switch($type(selector)){
case 'element': elements.push(selector);
case 'boolean': break;
case false: break;
case 'string': selector = document.getElementsBySelector(selector, true);
default: elements.extend(selector);
}
}
return $$.unique(elements);
};
$$.unique = function(array){
var elements = [];
for (var i = 0, l = array.length; i < l; i++){
if (array[i].$included) continue;
var element = $(array[i]);
if (element && !element.$included){
element.$included = true;
elements.push(element);
}
}
for (var n = 0, d = elements.length; n < d; n++) elements[n].$included = null;
return new Elements(elements);
};
Elements.Multi = function(property){
return function(){
var args = arguments;
var items = [];
var elements = true;
for (var i = 0, j = this.length, returns; i < j; i++){
returns = this[i][property].apply(this[i], args);
if ($type(returns) != 'element') elements = false;
items.push(returns);
};
return (elements) ? $$.unique(items) : items;
};
};
Element.extend = function(properties){
for (var property in properties){
HTMLElement.prototype[property] = properties[property];
Element.prototype[property] = properties[property];
Element[property] = $native.generic(property);
var elementsProperty = (Array.prototype[property]) ? property + 'Elements' : property;
Elements.prototype[elementsProperty] = Elements.Multi(property);
}
};
Element.extend({

/*
Property: set
you can set events, styles and properties with this shortcut. same as calling new Element.
*/

set: function(props){
for (var prop in props){
var val = props[prop];
switch(prop){
case 'styles': this.setStyles(val); break;
case 'events': if (this.addEvents) this.addEvents(val); break;
case 'properties': this.setProperties(val); break;
default: this.setProperty(prop, val);
}
}
return this;
},

inject: function(el, where){
el = $(el);
switch(where){
case 'before': el.parentNode.insertBefore(this, el); break;
case 'after':
var next = el.getNext();
if (!next) el.parentNode.appendChild(this);
else el.parentNode.insertBefore(this, next);
break;
case 'top':
var first = el.firstChild;
if (first){
el.insertBefore(this, first);
break;
}
default: el.appendChild(this);
}
return this;
},

/*
Property: injectBefore
Inserts the Element before the passed element.

Arguments:
el - an element reference or the id of the element to be injected in.

Example:
>html:
><div id="myElement"></div>
><div id="mySecondElement"></div>
>js:
>$('mySecondElement').injectBefore('myElement');
>resulting html:
><div id="mySecondElement"></div>
><div id="myElement"></div>
*/

injectBefore: function(el){
return this.inject(el, 'before');
},

/*
Property: injectAfter
Same as <Element.injectBefore>, but inserts the element after.
*/

injectAfter: function(el){
return this.inject(el, 'after');
},

/*
Property: injectInside
Same as <Element.injectBefore>, but inserts the element inside.
*/

injectInside: function(el){
return this.inject(el, 'bottom');
},

/*
Property: injectTop
Same as <Element.injectInside>, but inserts the element inside, at the top.
*/

injectTop: function(el){
return this.inject(el, 'top');
},

/*
Property: adopt
Inserts the passed elements inside the Element.

Arguments:
accepts elements references, element ids as string, selectors ($$('stuff')) / array of elements, array of ids as strings and collections.
*/

adopt: function(){
var elements = [];
$each(arguments, function(argument){
elements = elements.concat(argument);
});
$$(elements).inject(this);
return this;
},

/*
Property: remove
Removes the Element from the DOM.

Example:
>$('myElement').remove() //bye bye
*/

remove: function(){
return this.parentNode.removeChild(this);
},

/*
Property: clone
Clones the Element and returns the cloned one.

Arguments:
contents - boolean, when true the Element is cloned with childNodes, default true

Returns:
the cloned element

Example:
>var clone = $('myElement').clone().injectAfter('myElement');
>//clones the Element and append the clone after the Element.
*/

clone: function(contents){
var el = $(this.cloneNode(contents !== false));
if (!el.$events) return el;
el.$events = {};
for (var type in this.$events) el.$events[type] = {
'keys': $A(this.$events[type].keys),
'values': $A(this.$events[type].values)
};
return el.removeEvents();
},

/*
Property: replaceWith
Replaces the Element with an element passed.

Arguments:
el - a string representing the element to be injected in (myElementId, or div), or an element reference.
If you pass div or another tag, the element will be created.

Returns:
the passed in element

Example:
>$('myOldElement').replaceWith($('myNewElement')); //$('myOldElement') is gone, and $('myNewElement') is in its place.
*/

replaceWith: function(el){
el = $(el);
this.parentNode.replaceChild(el, this);
return el;
},

/*
Property: appendText
Appends text node to a DOM element.

Arguments:
text - the text to append.

Example:
><div id="myElement">hey</div>
>$('myElement').appendText(' howdy'); //myElement innerHTML is now "hey howdy"
*/

appendText: function(text){
this.appendChild(document.createTextNode(text));
return this;
},

/*
Property: hasClass
Tests the Element to see if it has the passed in className.

Returns:
true - the Element has the class
false - it doesn't

Arguments:
className - string; the class name to test.

Example:
><div id="myElement" class="testClass"></div>
>$('myElement').hasClass('testClass'); //returns true
*/

hasClass: function(className){
return this.className.contains(className, ' ');
},

/*
Property: addClass
Adds the passed in class to the Element, if the element doesnt already have it.

Arguments:
className - string; the class name to add

Example:
><div id="myElement" class="testClass"></div>
>$('myElement').addClass('newClass'); //<div id="myElement" class="testClass newClass"></div>
*/

addClass: function(className){
if (!this.hasClass(className)) this.className = (this.className + ' ' + className).clean();
return this;
},

/*
Property: removeClass
Works like <Element.addClass>, but removes the class from the element.
*/

removeClass: function(className){
this.className = this.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1').clean();
return this;
},

/*
Property: toggleClass
Adds or removes the passed in class name to the element, depending on if it's present or not.

Arguments:
className - the class to add or remove

Example:
><div id="myElement" class="myClass"></div>
>$('myElement').toggleClass('myClass');
><div id="myElement" class=""></div>
>$('myElement').toggleClass('myClass');
><div id="myElement" class="myClass"></div>
*/

toggleClass: function(className){
return this.hasClass(className) ? this.removeClass(className) : this.addClass(className);
},

/*
Property: setStyle
Sets a css property to the Element.

Arguments:
property - the property to set
value - the value to which to set it; for numeric values that require "px" you can pass an integer

Example:
>$('myElement').setStyle('width', '300px'); //the width is now 300px
>$('myElement').setStyle('width', 300); //the width is now 300px
*/

setStyle: function(property, value){
switch(property){
case 'opacity': return this.setOpacity(parseFloat(value));
case 'float': property = (window.ie) ? 'styleFloat' : 'cssFloat';
}
property = property.camelCase();
switch($type(value)){
case 'number': if (!['zIndex', 'zoom'].contains(property)) value += 'px'; break;
case 'array': value = 'rgb(' + value.join(',') + ')';
}
this.style[property] = value;
return this;
},

/*
Property: setStyles
Applies a collection of styles to the Element.

Arguments:
source - an object or string containing all the styles to apply. When its a string it overrides old style.

Examples:
>$('myElement').setStyles({
>	border: '1px solid #000',
>	width: 300,
>	height: 400
>});

OR

>$('myElement').setStyles('border: 1px solid #000; width: 300px; height: 400px;');
*/

setStyles: function(source){
switch($type(source)){
case 'object': Element.setMany(this, 'setStyle', source); break;
case 'string': this.style.cssText = source;
}
return this;
},

/*
Property: setOpacity
Sets the opacity of the Element, and sets also visibility == "hidden" if opacity == 0, and visibility = "visible" if opacity > 0.

Arguments:
opacity - float; Accepts values from 0 to 1.

Example:
>$('myElement').setOpacity(0.5) //make it 50% transparent
*/

setOpacity: function(opacity){
if (opacity == 0){
if (this.style.visibility != "hidden") this.style.visibility = "hidden";
} else {
if (this.style.visibility != "visible") this.style.visibility = "visible";
}
if (!this.currentStyle || !this.currentStyle.hasLayout) this.style.zoom = 1;
if (window.ie) this.style.filter = (opacity == 1) ? '' : "alpha(opacity=" + opacity * 100 + ")";
this.style.opacity = this.$tmp.opacity = opacity;
return this;
},

/*
Property: getStyle
Returns the style of the Element given the property passed in.

Arguments:
property - the css style property you want to retrieve

Example:
>$('myElement').getStyle('width'); //returns "400px"
>//but you can also use
>$('myElement').getStyle('width').toInt(); //returns 400

Returns:
the style as a string
*/

getStyle: function(property){
property = property.camelCase();
var result = this.style[property];
if (!$chk(result)){
if (property == 'opacity') return this.$tmp.opacity;
result = [];
for (var style in Element.Styles){
if (property == style){
Element.Styles[style].each(function(s){
var style = this.getStyle(s);
result.push(parseInt(style) ? style : '0px');
}, this);
if (property == 'border'){
var every = result.every(function(bit){
return (bit == result[0]);
});
return (every) ? result[0] : false;
}
return result.join(' ');
}
}
if (property.contains('border')){
if (Element.Styles.border.contains(property)){
return ['Width', 'Style', 'Color'].map(function(p){
return this.getStyle(property + p);
}, this).join(' ');
} else if (Element.borderShort.contains(property)){
return ['Top', 'Right', 'Bottom', 'Left'].map(function(p){
return this.getStyle('border' + p + property.replace('border', ''));
}, this).join(' ');
}
}
if (document.defaultView) result = document.defaultView.getComputedStyle(this, null).getPropertyValue(property.hyphenate());
else if (this.currentStyle) result = this.currentStyle[property];
}
if (window.ie) result = Element.fixStyle(property, result, this);
if (result && property.test(/color/i) && result.contains('rgb')){
return result.split('rgb').splice(1,4).map(function(color){
return color.rgbToHex();
}).join(' ');
}
return result;
},

/*
Property: getStyles
Returns an object of styles of the Element for each argument passed in.
Arguments:
properties - strings; any number of style properties
Example:
>$('myElement').getStyles('width','height','padding');
>//returns an object like:
>{width: "10px", height: "10px", padding: "10px 0px 10px 0px"}
*/

getStyles: function(){
return Element.getMany(this, 'getStyle', arguments);
},

walk: function(brother, start){
brother += 'Sibling';
var el = (start) ? this[start] : this[brother];
while (el && $type(el) != 'element') el = el[brother];
return $(el);
},

/*
Property: getPrevious
Returns the previousSibling of the Element, excluding text nodes.

Example:
>$('myElement').getPrevious(); //get the previous DOM element from myElement

Returns:
the sibling element or undefined if none found.
*/

getPrevious: function(){
return this.walk('previous');
},

/*
Property: getNext
Works as Element.getPrevious, but tries to find the nextSibling.
*/

getNext: function(){
return this.walk('next');
},

/*
Property: getFirst
Works as <Element.getPrevious>, but tries to find the firstChild.
*/

getFirst: function(){
return this.walk('next', 'firstChild');
},

/*
Property: getLast
Works as <Element.getPrevious>, but tries to find the lastChild.
*/

getLast: function(){
return this.walk('previous', 'lastChild');
},

/*
Property: getParent
returns the $(element.parentNode)
*/

getParent: function(){
return $(this.parentNode);
},

/*
Property: getChildren
returns all the $(element.childNodes), excluding text nodes. Returns as <Elements>.
*/

getChildren: function(){
return $$(this.childNodes);
},

/*
Property: hasChild
returns true if the passed in element is a child of the $(element).
*/

hasChild: function(el){
return !!$A(this.getElementsByTagName('*')).contains(el);
},

/*
Property: getProperty
Gets the an attribute of the Element.

Arguments:
property - string; the attribute to retrieve

Example:
>$('myImage').getProperty('src') // returns whatever.gif

Returns:
the value, or an empty string
*/

getProperty: function(property){
var index = Element.Properties[property];
if (index) return this[index];
var flag = Element.PropertiesIFlag[property] || 0;
if (!window.ie || flag) return this.getAttribute(property, flag);
var node = this.attributes[property];
return (node) ? node.nodeValue : null;
},

/*
Property: removeProperty
Removes an attribute from the Element

Arguments:
property - string; the attribute to remove
*/

removeProperty: function(property){
var index = Element.Properties[property];
if (index) this[index] = '';
else this.removeAttribute(property);
return this;
},

/*
Property: getProperties
same as <Element.getStyles>, but for properties
*/

getProperties: function(){
return Element.getMany(this, 'getProperty', arguments);
},

/*
Property: setProperty
Sets an attribute for the Element.

Arguments:
property - string; the property to assign the value passed in
value - the value to assign to the property passed in

Example:
>$('myImage').setProperty('src', 'whatever.gif'); //myImage now points to whatever.gif for its source
*/

setProperty: function(property, value){
var index = Element.Properties[property];
if (index) this[index] = value;
else this.setAttribute(property, value);
return this;
},

/*
Property: setProperties
Sets numerous attributes for the Element.

Arguments:
source - an object with key/value pairs.

Example:
(start code)
$('myElement').setProperties({
src: 'whatever.gif',
alt: 'whatever dude'
});
<img src="whatever.gif" alt="whatever dude">
(end)
*/

setProperties: function(source){
return Element.setMany(this, 'setProperty', source);
},

/*
Property: setHTML
Sets the innerHTML of the Element.

Arguments:
html - string; the new innerHTML for the element.

Example:
>$('myElement').setHTML(newHTML) //the innerHTML of myElement is now = newHTML
*/

setHTML: function(){
this.innerHTML = $A(arguments).join('');
return this;
},

/*
Property: setText
Sets the inner text of the Element.

Arguments:
text - string; the new text content for the element.

Example:
>$('myElement').setText('some text') //the text of myElement is now = 'some text'
*/

setText: function(text){
var tag = this.getTag();
if (['style', 'script'].contains(tag)){
if (window.ie){
if (tag == 'style') this.styleSheet.cssText = text;
else if (tag ==  'script') this.setProperty('text', text);
return this;
} else {
this.removeChild(this.firstChild);
return this.appendText(text);
}
}
this[$defined(this.innerText) ? 'innerText' : 'textContent'] = text;
return this;
},

/*
Property: getText
Gets the inner text of the Element.
*/

getText: function(){
var tag = this.getTag();
if (['style', 'script'].contains(tag)){
if (window.ie){
if (tag == 'style') return this.styleSheet.cssText;
else if (tag ==  'script') return this.getProperty('text');
} else {
return this.innerHTML;
}
}
return ($pick(this.innerText, this.textContent));
},

/*
Property: getTag
Returns the tagName of the element in lower case.

Example:
>$('myImage').getTag() // returns 'img'

Returns:
The tag name in lower case
*/

getTag: function(){
return this.tagName.toLowerCase();
},

/*
Property: empty
Empties an element of all its children.

Example:
>$('myDiv').empty() // empties the Div and returns it

Returns:
The element.
*/

empty: function(){
Garbage.trash(this.getElementsByTagName('*'));
return this.setHTML('');
}

});
Element.fixStyle = function(property, result, element){
if ($chk(parseInt(result))) return result;
if (['height', 'width'].contains(property)){
var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'];
var size = 0;
values.each(function(value){
size += element.getStyle('border-' + value + '-width').toInt() + element.getStyle('padding-' + value).toInt();
});
return element['offset' + property.capitalize()] - size + 'px';
} else if (property.test(/border(.+)Width|margin|padding/)){
return '0px';
}
return result;
};
Element.Styles = {'border': [], 'padding': [], 'margin': []};
['Top', 'Right', 'Bottom', 'Left'].each(function(direction){
for (var style in Element.Styles) Element.Styles[style].push(style + direction);
});
Element.borderShort = ['borderWidth', 'borderStyle', 'borderColor'];
Element.getMany = function(el, method, keys){
var result = {};
$each(keys, function(key){
result[key] = el[method](key);
});
return result;
};
Element.setMany = function(el, method, pairs){
for (var key in pairs) el[method](key, pairs[key]);
return el;
};
Element.Properties = new Abstract({
'class': 'className', 'for': 'htmlFor', 'colspan': 'colSpan', 'rowspan': 'rowSpan',
'accesskey': 'accessKey', 'tabindex': 'tabIndex', 'maxlength': 'maxLength',
'readonly': 'readOnly', 'frameborder': 'frameBorder', 'value': 'value',
'disabled': 'disabled', 'checked': 'checked', 'multiple': 'multiple', 'selected': 'selected'
});
Element.PropertiesIFlag = {
'href': 2, 'src': 2
};
Element.Methods = {
Listeners: {
addListener: function(type, fn){
if (this.addEventListener) this.addEventListener(type, fn, false);
else this.attachEvent('on' + type, fn);
return this;
},

removeListener: function(type, fn){
if (this.removeEventListener) this.removeEventListener(type, fn, false);
else this.detachEvent('on' + type, fn);
return this;
}
}
};
window.extend(Element.Methods.Listeners);
document.extend(Element.Methods.Listeners);
Element.extend(Element.Methods.Listeners);
var Garbage = {

elements: [],

collect: function(el){
if (!el.$tmp){
Garbage.elements.push(el);
el.$tmp = {'opacity': 1};
}
return el;
},

trash: function(elements){
for (var i = 0, j = elements.length, el; i < j; i++){
if (!(el = elements[i]) || !el.$tmp) continue;
if (el.$events) el.fireEvent('trash').removeEvents();
for (var p in el.$tmp) el.$tmp[p] = null;
for (var d in Element.prototype) el[d] = null;
Garbage.elements[Garbage.elements.indexOf(el)] = null;
el.htmlElement = el.$tmp = el = null;
}
Garbage.elements.remove(null);
},

empty: function(){
Garbage.collect(window);
Garbage.collect(document);
Garbage.trash(Garbage.elements);
}

};
window.addListener('beforeunload', function(){
window.addListener('unload', Garbage.empty);
if (window.ie) window.addListener('unload', CollectGarbage);
});
var Event = new Class({

initialize: function(event){
if (event && event.$extended) return event;
this.$extended = true;
event = event || window.event;
this.event = event;
this.type = event.type;
this.target = event.target || event.srcElement;
if (this.target.nodeType == 3) this.target = this.target.parentNode;
this.shift = event.shiftKey;
this.control = event.ctrlKey;
this.alt = event.altKey;
this.meta = event.metaKey;
if (['DOMMouseScroll', 'mousewheel'].contains(this.type)){
this.wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
} else if (this.type.contains('key')){
this.code = event.which || event.keyCode;
for (var name in Event.keys){
if (Event.keys[name] == this.code){
this.key = name;
break;
}
}
if (this.type == 'keydown'){
var fKey = this.code - 111;
if (fKey > 0 && fKey < 13) this.key = 'f' + fKey;
}
this.key = this.key || String.fromCharCode(this.code).toLowerCase();
} else if (this.type.test(/(click|mouse|menu)/)){
this.page = {
'x': event.pageX || event.clientX + document.documentElement.scrollLeft,
'y': event.pageY || event.clientY + document.documentElement.scrollTop
};
this.client = {
'x': event.pageX ? event.pageX - window.pageXOffset : event.clientX,
'y': event.pageY ? event.pageY - window.pageYOffset : event.clientY
};
this.rightClick = (event.which == 3) || (event.button == 2);
switch(this.type){
case 'mouseover': this.relatedTarget = event.relatedTarget || event.fromElement; break;
case 'mouseout': this.relatedTarget = event.relatedTarget || event.toElement;
}
this.fixRelatedTarget();
}
return this;
},

/*
Property: stop
cross browser method to stop an event
*/

stop: function(){
return this.stopPropagation().preventDefault();
},

/*
Property: stopPropagation
cross browser method to stop the propagation of an event
*/

stopPropagation: function(){
if (this.event.stopPropagation) this.event.stopPropagation();
else this.event.cancelBubble = true;
return this;
},

/*
Property: preventDefault
cross browser method to prevent the default action of the event
*/

preventDefault: function(){
if (this.event.preventDefault) this.event.preventDefault();
else this.event.returnValue = false;
return this;
}

});
Event.fix = {

relatedTarget: function(){
if (this.relatedTarget && this.relatedTarget.nodeType == 3) this.relatedTarget = this.relatedTarget.parentNode;
},

relatedTargetGecko: function(){
try {Event.fix.relatedTarget.call(this);} catch(e){this.relatedTarget = this.target;}
}

};
Event.prototype.fixRelatedTarget = (window.gecko) ? Event.fix.relatedTargetGecko : Event.fix.relatedTarget;
Event.keys = new Abstract({
'enter': 13,
'up': 38,
'down': 40,
'left': 37,
'right': 39,
'esc': 27,
'space': 32,
'backspace': 8,
'tab': 9,
'delete': 46
});
Element.Methods.Events = {

/*
Property: addEvent
Attaches an event listener to a DOM element.

Arguments:
type - the event to monitor ('click', 'load', etc) without the prefix 'on'.
fn - the function to execute

Example:
>$('myElement').addEvent('click', function(){alert('clicked!')});
*/

addEvent: function(type, fn){
this.$events = this.$events || {};
this.$events[type] = this.$events[type] || {'keys': [], 'values': []};
if (this.$events[type].keys.contains(fn)) return this;
this.$events[type].keys.push(fn);
var realType = type;
var custom = Element.Events[type];
if (custom){
if (custom.add) custom.add.call(this, fn);
if (custom.map) fn = custom.map;
if (custom.type) realType = custom.type;
}
if (!this.addEventListener) fn = fn.create({'bind': this, 'event': true});
this.$events[type].values.push(fn);
return (Element.NativeEvents.contains(realType)) ? this.addListener(realType, fn) : this;
},

/*
Property: removeEvent
Works as Element.addEvent, but instead removes the previously added event listener.
*/

removeEvent: function(type, fn){
if (!this.$events || !this.$events[type]) return this;
var pos = this.$events[type].keys.indexOf(fn);
if (pos == -1) return this;
var key = this.$events[type].keys.splice(pos,1)[0];
var value = this.$events[type].values.splice(pos,1)[0];
var custom = Element.Events[type];
if (custom){
if (custom.remove) custom.remove.call(this, fn);
if (custom.type) type = custom.type;
}
return (Element.NativeEvents.contains(type)) ? this.removeListener(type, value) : this;
},

/*
Property: addEvents
As <addEvent>, but accepts an object and add multiple events at once.
*/

addEvents: function(source){
return Element.setMany(this, 'addEvent', source);
},

/*
Property: removeEvents
removes all events of a certain type from an element. if no argument is passed in, removes all events.

Arguments:
type - string; the event name (e.g. 'click')
*/

removeEvents: function(type){
if (!this.$events) return this;
if (!type){
for (var evType in this.$events) this.removeEvents(evType);
this.$events = null;
} else if (this.$events[type]){
this.$events[type].keys.each(function(fn){
this.removeEvent(type, fn);
}, this);
this.$events[type] = null;
}
return this;
},

/*
Property: fireEvent
executes all events of the specified type present in the element.

Arguments:
type - string; the event name (e.g. 'click')
args - array or single object; arguments to pass to the function; if more than one argument, must be an array
delay - (integer) delay (in ms) to wait to execute the event
*/

fireEvent: function(type, args, delay){
if (this.$events && this.$events[type]){
this.$events[type].keys.each(function(fn){
fn.create({'bind': this, 'delay': delay, 'arguments': args})();
}, this);
}
return this;
},

/*
Property: cloneEvents
Clones all events from an element to this element.

Arguments:
from - element, copy all events from this element
type - optional, copies only events of this type
*/

cloneEvents: function(from, type){
if (!from.$events) return this;
if (!type){
for (var evType in from.$events) this.cloneEvents(from, evType);
} else if (from.$events[type]){
from.$events[type].keys.each(function(fn){
this.addEvent(type, fn);
}, this);
}
return this;
}

};
window.extend(Element.Methods.Events);
document.extend(Element.Methods.Events);
Element.extend(Element.Methods.Events);
Element.Events = new Abstract({

/*
Event: mouseenter
In addition to the standard javascript events (load, mouseover, mouseout, click, etc.) <Event.js> contains two custom events
this event fires when the mouse enters the area of the dom element; will not be fired again if the mouse crosses over children of the element (unlike mouseover)


Example:
>$(myElement).addEvent('mouseenter', myFunction);
*/

'mouseenter': {
type: 'mouseover',
map: function(event){
event = new Event(event);
if (event.relatedTarget != this && !this.hasChild(event.relatedTarget)) this.fireEvent('mouseenter', event);
}
},

/*
Event: mouseleave
this event fires when the mouse exits the area of the dom element; will not be fired again if the mouse crosses over children of the element (unlike mouseout)


Example:
>$(myElement).addEvent('mouseleave', myFunction);
*/

'mouseleave': {
type: 'mouseout',
map: function(event){
event = new Event(event);
if (event.relatedTarget != this && !this.hasChild(event.relatedTarget)) this.fireEvent('mouseleave', event);
}
},

'mousewheel': {
type: (window.gecko) ? 'DOMMouseScroll' : 'mousewheel'
}

});
Element.NativeEvents = [
'click', 'dblclick', 'mouseup', 'mousedown', //mouse buttons
'mousewheel', 'DOMMouseScroll', //mouse wheel
'mouseover', 'mouseout', 'mousemove', //mouse movement
'keydown', 'keypress', 'keyup', //keys
'load', 'unload', 'beforeunload', 'resize', 'move', //window
'focus', 'blur', 'change', 'submit', 'reset', 'select', //forms elements
'error', 'abort', 'contextmenu', 'scroll' //misc
];
Function.extend({

/*
Property: bindWithEvent
automatically passes MooTools Event Class.

Arguments:
bind - optional, the object that the "this" of the function will refer to.
args - optional, an argument to pass to the function; if more than one argument, it must be an array of arguments.

Returns:
a function with the parameter bind as its "this" and as a pre-passed argument event or window.event, depending on the browser.

Example:
>function myFunction(event){
>	alert(event.client.x) //returns the coordinates of the mouse..
>};
>myElement.addEvent('click', myFunction.bindWithEvent(myElement));
*/

bindWithEvent: function(bind, args){
return this.create({'bind': bind, 'arguments': args, 'event': Event});
}

});
Elements.extend({

/*
Property: filterByTag
Filters the collection by a specified tag name.
Returns a new Elements collection, while the original remains untouched.
*/

filterByTag: function(tag){
return new Elements(this.filter(function(el){
return (Element.getTag(el) == tag);
}));
},

/*
Property: filterByClass
Filters the collection by a specified class name.
Returns a new Elements collection, while the original remains untouched.
*/

filterByClass: function(className, nocash){
var elements = this.filter(function(el){
return (el.className && el.className.contains(className, ' '));
});
return (nocash) ? elements : new Elements(elements);
},

/*
Property: filterById
Filters the collection by a specified ID.
Returns a new Elements collection, while the original remains untouched.
*/

filterById: function(id, nocash){
var elements = this.filter(function(el){
return (el.id == id);
});
return (nocash) ? elements : new Elements(elements);
},

/*
Property: filterByAttribute
Filters the collection by a specified attribute.
Returns a new Elements collection, while the original remains untouched.

Arguments:
name - the attribute name.
operator - optional, the attribute operator.
value - optional, the attribute value, only valid if the operator is specified.
*/

filterByAttribute: function(name, operator, value, nocash){
var elements = this.filter(function(el){
var current = Element.getProperty(el, name);
if (!current) return false;
if (!operator) return true;
switch(operator){
case '=': return (current == value);
case '*=': return (current.contains(value));
case '^=': return (current.substr(0, value.length) == value);
case '$=': return (current.substr(current.length - value.length) == value);
case '!=': return (current != value);
case '~=': return current.contains(value, ' ');
}
return false;
});
return (nocash) ? elements : new Elements(elements);
}

});
function $E(selector, filter){
return ($(filter) || document).getElement(selector);
};
function $ES(selector, filter){
return ($(filter) || document).getElementsBySelector(selector);
};
$$.shared = {

'regexp': /^(\w*|\*)(?:#([\w-]+)|\.([\w-]+))?(?:\[(\w+)(?:([!*^$]?=)["']?([^"'\]]*)["']?)?])?$/,

'xpath': {

getParam: function(items, context, param, i){
var temp = [context.namespaceURI ? 'xhtml:' : '', param[1]];
if (param[2]) temp.push('[@id="', param[2], '"]');
if (param[3]) temp.push('[contains(concat(" ", @class, " "), " ', param[3], ' ")]');
if (param[4]){
if (param[5] && param[6]){
switch(param[5]){
case '*=': temp.push('[contains(@', param[4], ', "', param[6], '")]'); break;
case '^=': temp.push('[starts-with(@', param[4], ', "', param[6], '")]'); break;
case '$=': temp.push('[substring(@', param[4], ', string-length(@', param[4], ') - ', param[6].length, ' + 1) = "', param[6], '"]'); break;
case '=': temp.push('[@', param[4], '="', param[6], '"]'); break;
case '!=': temp.push('[@', param[4], '!="', param[6], '"]');
}
} else {
temp.push('[@', param[4], ']');
}
}
items.push(temp.join(''));
return items;
},

getItems: function(items, context, nocash){
var elements = [];
var xpath = document.evaluate('.//' + items.join('//'), context, $$.shared.resolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
for (var i = 0, j = xpath.snapshotLength; i < j; i++) elements.push(xpath.snapshotItem(i));
return (nocash) ? elements : new Elements(elements.map($));
}

},

'normal': {

getParam: function(items, context, param, i){
if (i == 0){
if (param[2]){
var el = context.getElementById(param[2]);
if (!el || ((param[1] != '*') && (Element.getTag(el) != param[1]))) return false;
items = [el];
} else {
items = $A(context.getElementsByTagName(param[1]));
}
} else {
items = $$.shared.getElementsByTagName(items, param[1]);
if (param[2]) items = Elements.filterById(items, param[2], true);
}
if (param[3]) items = Elements.filterByClass(items, param[3], true);
if (param[4]) items = Elements.filterByAttribute(items, param[4], param[5], param[6], true);
return items;
},

getItems: function(items, context, nocash){
return (nocash) ? items : $$.unique(items);
}

},

resolver: function(prefix){
return (prefix == 'xhtml') ? 'http://www.w3.org/1999/xhtml' : false;
},

getElementsByTagName: function(context, tagName){
var found = [];
for (var i = 0, j = context.length; i < j; i++) found.extend(context[i].getElementsByTagName(tagName));
return found;
}

};
$$.shared.method = (window.xpath) ? 'xpath' : 'normal';
Element.Methods.Dom = {

/*
Property: getElements
Gets all the elements within an element that match the given (single) selector.
Returns as <Elements>.

Arguments:
selector - string; the css selector to match

Examples:
>$('myElement').getElements('a'); // get all anchors within myElement
>$('myElement').getElements('input[name=dialog]') //get all input tags with name 'dialog'
>$('myElement').getElements('input[name$=log]') //get all input tags with names ending with 'log'

Notes:
Supports these operators in attribute selectors:

- = : is equal to
- ^= : starts-with
- $= : ends-with
- != : is not equal to

Xpath is used automatically for compliant browsers.
*/

getElements: function(selector, nocash){
var items = [];
selector = selector.trim().split(' ');
for (var i = 0, j = selector.length; i < j; i++){
var sel = selector[i];
var param = sel.match($$.shared.regexp);
if (!param) break;
param[1] = param[1] || '*';
var temp = $$.shared[$$.shared.method].getParam(items, this, param, i);
if (!temp) break;
items = temp;
}
return $$.shared[$$.shared.method].getItems(items, this, nocash);
},

/*
Property: getElement
Same as <Element.getElements>, but returns only the first. Alternate syntax for <$E>, where filter is the Element.
Returns as <Element>.

Arguments:
selector - string; css selector
*/

getElement: function(selector){
return $(this.getElements(selector, true)[0] || false);
},

/*
Property: getElementsBySelector
Same as <Element.getElements>, but allows for comma separated selectors, as in css. Alternate syntax for <$$>, where filter is the Element.
Returns as <Elements>.

Arguments:
selector - string; css selector
*/

getElementsBySelector: function(selector, nocash){
var elements = [];
selector = selector.split(',');
for (var i = 0, j = selector.length; i < j; i++) elements = elements.concat(this.getElements(selector[i], true));
return (nocash) ? elements : $$.unique(elements);
}

};
Element.extend({

/*
Property: getElementById
Targets an element with the specified id found inside the Element. Does not overwrite document.getElementById.

Arguments:
id - string; the id of the element to find.
*/

getElementById: function(id){
var el = document.getElementById(id);
if (!el) return false;
for (var parent = el.parentNode; parent != this; parent = parent.parentNode){
if (!parent) return false;
}
return el;
}/*compatibility*/,

getElementsByClassName: function(className){ 
return this.getElements('.' + className); 
}

/*end compatibility*/

});
document.extend(Element.Methods.Dom);
Element.extend(Element.Methods.Dom);
Element.extend({

/*
Property: getValue
Returns the value of the Element, if its tag is textarea, select or input. getValue called on a multiple select will return an array.
*/

getValue: function(){
switch(this.getTag()){
case 'select':
var values = [];
$each(this.options, function(option){
if (option.selected) values.push($pick(option.value, option.text));
});
return (this.multiple) ? values : values[0];
case 'input': if (!(this.checked && ['checkbox', 'radio'].contains(this.type)) && !['hidden', 'text', 'password'].contains(this.type)) break;
case 'textarea': return this.value;
}
return false;
},

getFormElements: function(){
return $$(this.getElementsByTagName('input'), this.getElementsByTagName('select'), this.getElementsByTagName('textarea'));
},

/*
Property: toQueryString
Reads the children inputs of the Element and generates a query string, based on their values. Used internally in <Ajax>

Example:
(start code)
<form id="myForm" action="submit.php">
<input name="email" value="bob@bob.com">
<input name="zipCode" value="90210">
</form>

<script>
$('myForm').toQueryString()
</script>
(end)

Returns:
email=bob@bob.com&zipCode=90210
*/

toQueryString: function(){
var queryString = [];
this.getFormElements().each(function(el){
var name = el.name;
var value = el.getValue();
if (value === false || !name || el.disabled) return;
var qs = function(val){
queryString.push(name + '=' + encodeURIComponent(val));
};
if ($type(value) == 'array') value.each(qs);
else qs(value);
});
return queryString.join('&');
}

});
Element.extend({

/*
Property: scrollTo
Scrolls the element to the specified coordinated (if the element has an overflow)

Arguments:
x - the x coordinate
y - the y coordinate

Example:
>$('myElement').scrollTo(0, 100)
*/

scrollTo: function(x, y){
this.scrollLeft = x;
this.scrollTop = y;
},

/*
Property: getSize
Return an Object representing the size/scroll values of the element.

Example:
(start code)
$('myElement').getSize();
(end)

Returns:
(start code)
{
'scroll': {'x': 100, 'y': 100},
'size': {'x': 200, 'y': 400},
'scrollSize': {'x': 300, 'y': 500}
}
(end)
*/

getSize: function(){
return {
'scroll': {'x': this.scrollLeft, 'y': this.scrollTop},
'size': {'x': this.offsetWidth, 'y': this.offsetHeight},
'scrollSize': {'x': this.scrollWidth, 'y': this.scrollHeight}
};
},

/*
Property: getPosition
Returns the real offsets of the element.

Arguments:
overflown - optional, an array of nested scrolling containers for scroll offset calculation, use this if your element is inside any element containing scrollbars

Example:
>$('element').getPosition();

Returns:
>{x: 100, y:500};
*/

getPosition: function(overflown){
overflown = overflown || [];
var el = this, left = 0, top = 0;
do {
left += el.offsetLeft || 0;
top += el.offsetTop || 0;
el = el.offsetParent;
} while (el);
overflown.each(function(element){
left -= element.scrollLeft || 0;
top -= element.scrollTop || 0;
});
return {'x': left, 'y': top};
},

/*
Property: getTop
Returns the distance from the top of the window to the Element.

Arguments:
overflown - optional, an array of nested scrolling containers, see Element::getPosition
*/

getTop: function(overflown){
return this.getPosition(overflown).y;
},

/*
Property: getLeft
Returns the distance from the left of the window to the Element.

Arguments:
overflown - optional, an array of nested scrolling containers, see Element::getPosition
*/

getLeft: function(overflown){
return this.getPosition(overflown).x;
},

/*
Property: getCoordinates
Returns an object with width, height, left, right, top, and bottom, representing the values of the Element

Arguments:
overflown - optional, an array of nested scrolling containers, see Element::getPosition

Example:
(start code)
var myValues = $('myElement').getCoordinates();
(end)

Returns:
(start code)
{
width: 200,
height: 300,
left: 100,
top: 50,
right: 300,
bottom: 350
}
(end)
*/

getCoordinates: function(overflown){
var position = this.getPosition(overflown);
var obj = {
'width': this.offsetWidth,
'height': this.offsetHeight,
'left': position.x,
'top': position.y
};
obj.right = obj.left + obj.width;
obj.bottom = obj.top + obj.height;
return obj;
}

});
Element.Events.domready = {

add: function(fn){
if (window.loaded){
fn.call(this);
return;
}
var domReady = function(){
if (window.loaded) return;
window.loaded = true;
this.fireEvent('domready');
}.bind(this);
if (document.readyState && window.webkit){
window.timer = function(){
if (['loaded','complete'].contains(document.readyState)) domReady();
}.periodical(50);
} else if (document.readyState && window.ie){
if (!$('ie_ready')){
var src = (window.location.protocol == 'https:') ? '://0' : 'javascript:void(0)';
document.write('<script id="ie_ready" defer src="' + src + '"><\/script>');
$('ie_ready').onreadystatechange = function(){
if (this.readyState == 'complete') domReady();
};
}
} else {
window.addListener("load", domReady);
document.addListener("DOMContentLoaded", domReady);
}
}

};
window.onDomReady = function(fn){ 
return this.addEvent('domready', fn); 
};
window.extend({

/*
Property: getWidth
Returns an integer representing the width of the browser window (without the scrollbar).
*/

getWidth: function(){
if (this.webkit419) return this.innerWidth;
if (this.opera) return document.body.clientWidth;
return document.documentElement.clientWidth;
},

/*
Property: getHeight
Returns an integer representing the height of the browser window (without the scrollbar).
*/

getHeight: function(){
if (this.webkit419) return this.innerHeight;
if (this.opera) return document.body.clientHeight;
return document.documentElement.clientHeight;
},

/*
Property: getScrollWidth
Returns an integer representing the scrollWidth of the window.
This value is equal to or bigger than <getWidth>.

See Also:
<http://developer.mozilla.org/en/docs/DOM:element.scrollWidth>
*/

getScrollWidth: function(){
if (this.ie) return Math.max(document.documentElement.offsetWidth, document.documentElement.scrollWidth);
if (this.webkit) return document.body.scrollWidth;
return document.documentElement.scrollWidth;
},

/*
Property: getScrollHeight
Returns an integer representing the scrollHeight of the window.
This value is equal to or bigger than <getHeight>.

See Also:
<http://developer.mozilla.org/en/docs/DOM:element.scrollHeight>
*/

getScrollHeight: function(){
if (this.ie) return Math.max(document.documentElement.offsetHeight, document.documentElement.scrollHeight);
if (this.webkit) return document.body.scrollHeight;
return document.documentElement.scrollHeight;
},

/*
Property: getScrollLeft
Returns an integer representing the scrollLeft of the window (the number of pixels the window has scrolled from the left).

See Also:
<http://developer.mozilla.org/en/docs/DOM:element.scrollLeft>
*/

getScrollLeft: function(){
return this.pageXOffset || document.documentElement.scrollLeft;
},

/*
Property: getScrollTop
Returns an integer representing the scrollTop of the window (the number of pixels the window has scrolled from the top).

See Also:
<http://developer.mozilla.org/en/docs/DOM:element.scrollTop>
*/

getScrollTop: function(){
return this.pageYOffset || document.documentElement.scrollTop;
},

/*
Property: getSize
Same as <Element.getSize>
*/

getSize: function(){
return {
'size': {'x': this.getWidth(), 'y': this.getHeight()},
'scrollSize': {'x': this.getScrollWidth(), 'y': this.getScrollHeight()},
'scroll': {'x': this.getScrollLeft(), 'y': this.getScrollTop()}
};
},

//ignore
getPosition: function(){return {'x': 0, 'y': 0};}

});
var Json = {

/*
Property: toString
Converts an object to a string, to be passed in server-side scripts as a parameter. Although its not normal usage for this class, this method can also be used to convert functions and arrays to strings.

Arguments:
obj - the object to convert to string

Returns:
A json string

Example:
(start code)
Json.toString({apple: 'red', lemon: 'yellow'}); '{"apple":"red","lemon":"yellow"}'
(end)
*/

toString: function(obj){
switch($type(obj)){
case 'string':
return '"' + obj.replace(/(["\\])/g, '\\$1') + '"';
case 'array':
return '[' + obj.map(Json.toString).join(',') + ']';
case 'object':
var string = [];
for (var property in obj) string.push(Json.toString(property) + ':' + Json.toString(obj[property]));
return '{' + string.join(',') + '}';
case 'number':
if (isFinite(obj)) break;
case false:
return 'null';
}
return String(obj);
},

/*
Property: evaluate
converts a json string to an javascript Object.

Arguments:
str - the string to evaluate. if its not a string, it returns false.
secure - optionally, performs syntax check on json string. Defaults to false.

Credits:
Json test regexp is by Douglas Crockford <http://crockford.org>.

Example:
>var myObject = Json.evaluate('{"apple":"red","lemon":"yellow"}');
>//myObject will become {apple: 'red', lemon: 'yellow'}
*/

evaluate: function(str, secure){
return (($type(str) != 'string') || (secure && !str.test(/^("(\\.|[^"\\\n\r])*?"|[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t])+?$/))) ? null : eval('(' + str + ')');
}

};
var Hash = new Class({
length: 0,
initialize: function(object){

this.obj = object || {};

this.setLength();

},
get: function(key){

return (this.hasKey(key)) ? this.obj[key] : null;

},
hasKey: function(key){

return (key in this.obj);

},
set: function(key, value){

if (!this.hasKey(key)) this.length++;

this.obj[key] = value;

return this;

},
setLength: function(){

this.length = 0;

for (var p in this.obj) this.length++;

return this;

},
remove: function(key){

if (this.hasKey(key)){

delete this.obj[key];

this.length--;

}

return this;

},
each: function(fn, bind){

$each(this.obj, fn, bind);

},
extend: function(obj){

$extend(this.obj, obj);

return this.setLength();

},
merge: function(){

this.obj = $merge.apply(null, [this.obj].extend(arguments));

return this.setLength();

},
empty: function(){

this.obj = {};

this.length = 0;

return this;

},
keys: function(){

var keys = [];

for (var property in this.obj) keys.push(property);

return keys;

},
values: function(){

var values = [];

for (var property in this.obj) values.push(this.obj[property]);

return values;

}
});
function $H(obj){

return new Hash(obj);

};