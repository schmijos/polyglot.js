//     (c) 2012 Airbnb, Inc.
//
//     polyglot.js may be freely distributed under the terms of the BSD
//     license. For all licensing information, details, and documention:
//     http://airbnb.github.com/polyglot.js
//
//
// Polyglot.js is an I18n helper library written in JavaScript, made to
// work both in the browser and in Node. It provides a simple solution for
// interpolation and pluralization, based off of Airbnb's
// experience adding I18n functionality to its Backbone.js and Node apps.
//
// Polylglot is agnostic to your translation backend. It doesn't perform any
// translation; it simply gives you a way to manage translated phrases from
// your client- or server-side JavaScript application.
//

//

!function(root) {
  'use strict';

  var phrases = {};

// ## Public Methods

// ### Polyglot.extend(phrases)
//
// Use `extend` to tell Polyglot how to translate a given key.
//
//     Polyglot.extend({
//       "hello": "Hello",
//       "hello_name": "Hello, %{name}"
//     });
//
// The key can be any string.  Feel free to call `extend` multiple times;
// it will override any phrases with the same key, but leave existing phrases
// untouched.

  function extend(morePhrases) {
    for (var key in morePhrases) {
      if (morePhrases.hasOwnProperty(key)) {
        phrases[key] = morePhrases[key];
      }
    }
  }

// ### Polyglot.clear()
//
// Clears all phrases. Useful for special cases, such as freeing
// up memory if you have lots of phrases but no longer need to
// perform any translation. Also used internally by `replace`.

  function clear() {
    phrases = {};
  }

// ### Polyglot.replace(phrases)
//
// Completely replace the existing phrases with a new set of phrases.
// Normally, just use `extend` to add more phrases, but under certain
// circumstances, you may want to make sure no old phrases are lying around.

  function replace(newPhrases) {
    clear();
    extend(newPhrases);
  }

// ### Polyglot.t(key, interpolationOptions)
//
// The most-used method. Provide a key, and `t` will return the
// phrase.
//
//     Polyglot.t("hello");
//     => "Hello"
//
// The phrase value is provided first by a call to `Polyglot.extend()` or
// `Polyglot.replace()`.
//
// Pass in an object as the second argument to perform interpolation.
//
//     Polyglot.t("hello_name", {name: "Spike"});
//     => "Hello, Spike"
//
// If you like, you can provide a default value in case the phrase is missing.
// Use the special option key "_" to specify a default.
//
//     Polyglot.t("i_like_to_write_in_language", {
//       _: "I like to write in %{language}.",
//       language: "JavaScript"
//     });
//     => "I like to write in JavaScript."
//

  function t(key, options) {
    var result;
    options = options || {};
    var phrase = phrases[key] || options._ || '';
    if (phrase === '') {
      warn('Missing translation for key: "'+key+'"');
      result = key;
    } else {
      result = interpolate(phrase, options);
    }
    return result;
  }

// ### Polyglot.pluralize(noun, count)
//
// Polyglot provides a very basic pattern for providing
// pluralization based on a singular noun. Because varous languages
// have different nominal forms for zero, one, and multiple, and because
// the noun can be before or after the count, we have to be overly explicit
// about the possibile phrases.
//
// For pluralizing "car", it assumes you have phrase keys of the form:
//
//     Polyglot.extend({
//       "pluralize.car.zero": "%{count} cars",
//       "pluralize.car.one":  "%{count} car",
//       "pluralize.car.many": "%{count} cars"
//     });
//
// `Polyglot.pluralize()` will choose the appropriate phrase based
// on the provided count.
//
//     Polyglot.pluralize("car", 0);
//     => "0 cars"
//
//     Polyglot.pluralize("car", 1);
//     => "1 car"
//
//     Polyglot.pluralize("car", 2);
//     => "2 cars"
//
// The second argument can be a `Number` or anything with a `length` property,
// such as an `Array` or a `Backbone.Collection`.
//
//     var Cars = Backbone.Collection.extend({});
//     var cars = new Cars;
//
//     Polyglot.pluralize("car", cars);
//     => "0 cars"
//
//     cars.add({make: "Ford", model: "Fiesta"});
//
//     Polyglot.pluralize("car", cars);
//     => "1 car"
//
//     cars.add({make: "Subaru", model: "Impreza"});
//
//     Polyglot.pluralize("car", cars);
//     => "2 cars"
//

  function pluralize(noun, count) {
    if (count != null && count.length != null) {
      count = count.length;
    }
    var key;
    if (count === 0) {
      key = "pluralize." + noun + ".zero";
    } else if (count === 1) {
      key = "pluralize." + noun + ".one";
    } else {
      key = "pluralize." + noun + ".many";
    }
    return t(key, {count: count});
  }

// ### Polyglot.registerHandlebars(Handlebars)
//
// Registers Polyglot's Handlebars helpers on a given
// Handlebars context. This is automatically called if we find
// a global `Handlebars` object, which makes use in the
// browser a snap if Handlebars is included before Polyglot.
// Otherwise, you can manually register the Handlebars helpers
// by passing in a Handlebars conext, which is the primary Node
// use case:
//
//     var Handlebars = require('handlebars');
//     var Polyglot = require('polyglot');
//
//     console.log(Handlebars.helpers.t);
//     // => undefined
//
//     Polyglot.registerHandlebars(Handlebars);
//
//     console.log(Handlebars.helpers.t);
//     // => function(){...}

  function registerHandlebars(handlebars) {
    for (var key in handlebarsHelpers) {
      if (handlebarsHelpers.hasOwnProperty(key)) {
        handlebars.registerHelper(key, handlebarsHelpers[key]);
      }
    }
  }

// ## Private Methods

// ### interpolate
//
// Does the dirty work. Creates a `RegExp` object for each
// interpolation placeholder.

  function interpolate(phrase, options) {
    for (var arg in options) {
      if (arg !== '_' && options.hasOwnProperty(arg)) {
        // We create a new `RegExp` each time instead of using a more-efficient
        // string replace so that the same argument can be replaced multiple times
        // in the same phrase.
        phrase = phrase.replace(new RegExp('%\\{'+arg+'\\}', 'g'), options[arg]);
      }
    }
    return phrase;
  }

// ### warn
//
// Provides a warning in the console if a phrase key is missing.

  function warn(message) {
    root.console && root.console.warn && root.console.warn('WARNING: ' + message);
  }

// ## Handlebars helpers

  var handlebarsHelpers = {

// ### t
//
//     // In your JavaScript
//     Polyglot.extend({
//       "hello_first_and_last_name": "Hello, %{firstName} %{lastName}."
//     });
//
//     // In a Handlebars template
//     <h1>{{t "hello_first_and_last_name" firstName=firstName lastName=lastName}}</h1>
//
// gives:
//
//     <h1>Hello, Robert DeNiro.</h1>

    t: function(key, block) {
      return t(key, block.hash);
    },

// ### pluralize
//
//     <p>{{pluralize "car" count=carCollection}}</p>
//
// gives:
//
//     <p>3 cars</p>

    pluralize: function(noun, block) {
      return pluralize(noun, block.hash.count);
    }
  };


// ## Export public methods

  var Polyglot = {
    extend: extend,
    replace: replace,
    clear: clear,
    t: t,
    pluralize: pluralize,
    registerHandlebars: registerHandlebars
  };

// Export for Node, attach to `window` for browser.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Polyglot;
  } else {
    root.Polyglot = Polyglot;
  }


// Register Handlebars helpers if Handlebars is found.
// If not, you can manually register Handlebars helpers by
// calling `Polyglot.registerHandlebars(Handlebars)`,
// passing in your Handlebars context.
  if (root.Handlebars && root.Handlebars.registerHelper) {
    registerHandlebars(root.Handlebars);
  }

}(this);