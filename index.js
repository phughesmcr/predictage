/**
 * predictAge
 * v3.0.0
 *
 * Predict the age of a string's author.
 *
 * Help me make this better:
 * https://github.com/phugh/predictAge
 *
 * Based on this paper:
 * Schwartz, H. A., Eichstaedt, J. C., Kern, M. L., Dziurzynski,
 * L., Ramones, S. M., Agrawal, M., Shah, A., Kosinski, M., Stillwell,
 * D., Seligman, M. E., & Ungar, L. H. (2013).
 * Personality, gender, and age in the language of social media:
 * The Open-Vocabulary Approach. PLOS ONE, 8(9), . . e73791.
 *
 * Using the age lexicon data from http://www.wwbp.org/lexica.html, under the
 * Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported licence
 *
 * (C) 2017 P. Hughes
 * Licence : Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Usage example:
 * const pa = require('predictage');
 * const opts = {  // These are the default options
 *  'encoding': 'freq',
 *  'locale': 'US',
 *  'logs': 3,
 *  'max': Number.POSITIVE_INFINITY,
 *  'min': Number.NEGATIVE_INFINITY,
 *  'nGrams': 'true',
 *  'output': 'age',
 *  'places': 9,
 *  'sortBy': 'lex',
 *  'wcGrams': 'false',
 * }
 * const text = 'A big long string of text...';
 * const age = pa(text, opts);
 * console.log(age)
 *
 * See README.md for help.
 *
 * @param {string} str input string
 * @param {Object} opts options object
 * @return {Object} predicted age, matched words, or both
 */

(function() {
  'use strict';

  // Lexicon data
  const lexicon = require('./data/lexicon.json');

  // Modules
  const async = require('async');
  const lexHelpers = require('lex-helpers');
  const simplengrams = require('simplengrams');
  const tokenizer = require('happynodetokenizer');
  const trans = require('british_american_translate');
  const arr2string = lexHelpers.arr2string;
  const doLex = lexHelpers.doLex;
  const doMatches = lexHelpers.doMatches;
  const getMatches = lexHelpers.getMatches;
  const itemCount = lexHelpers.itemCount;

  /**
  * Predict the age of a string's author 
  * @function predictAge
  * @param {string} str input string
  * @param {Object} opts options object
  * @return {Object} object with predicted age or array of matched words
  */
  const predictAge = (str, opts) => {
    // default options
    opts.encoding = (typeof opts.encoding !== 'undefined') ? opts.encoding : 'freq';
    opts.locale = (typeof opts.logs !== 'undefined') ? opts.logs : 'US';
    opts.logs = (typeof opts.logs !== 'undefined') ? opts.logs : 3;
    if (opts.suppressLog) opts.logs = 0;
    opts.max = (typeof opts.max !== 'undefined') ? opts.max : Number.POSITIVE_INFINITY;
    opts.min = (typeof opts.min !== 'undefined') ? opts.min : Number.NEGATIVE_INFINITY;
    if (typeof opts.max !== 'number' || typeof opts.min !== 'number') {
      // try to convert to a number
      opts.min = Number(opts.min);
      opts.max = Number(opts.max);
      // check it worked, or else default to infinity
      opts.max = (typeof opts.max !== 'number') ? opts.max : Number.POSITIVE_INFINITY;
      opts.min = (typeof opts.min !== 'number') ? opts.min : Number.NEGATIVE_INFINITY;
    }
    opts.nGrams = (typeof opts.nGrams !== 'undefined') ? opts.nGrams : [2, 3];
    if (!Array.isArray(opts.nGrams)) {
      if (opts.logs > 1) {
        console.warn('affectimo: nGrams option must be an array! ' + 
            'Defaulting to [2, 3].');
      }
      opts.nGrams = [2, 3];
    }
    opts.output = (typeof opts.output !== 'undefined') ? opts.output : 'lex';
    opts.places = (typeof opts.places !== 'undefined') ? opts.places : 9;
    opts.sortBy = (typeof opts.sortBy !== 'undefined') ? opts.sortBy : 'freq';
    opts.wcGrams = (typeof opts.wcGrams !== 'undefined') ? opts.wcGrams : false;   
    // cache frequently used options
    const encoding = opts.encoding;
    const logs = opts.logs;
    const nGrams = opts.nGrams;
    const output = opts.output;
    const places = opts.places;
    const sortBy = opts.sortBy;
    // no string return null
    if (!str) {
      if (logs > 1) console.warn('predictAge: no string found. Returning null.');
      return null;
    }
    // if str isn't a string, make it into one
    if (typeof str !== 'string') str = str.toString();
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim();
    // translalte US English to UK English if selected
    if (opts.locale === 'GB') str = trans.uk2us(str);
    // convert our string to tokens
    let tokens = tokenizer(str, {logs: opts.logs});
    // if there are no tokens return null
    if (!tokens) {
      if (logs > 1) console.warn('predictAge: no tokens found. Returned null.');
      return null;
    }
    // get wordcount before we add ngrams
    let wordcount = tokens.length;
    // get n-grams
    if (nGrams) {
      async.each(nGrams, function(n, callback) {
        if (wordcount < n) {
          callback(`predictAge: wordcount (${wordcount}) less than n-gram value (${n}). Ignoring.`);
        } else {
          tokens = [...arr2string(simplengrams(str, n, {logs: logs})), ...tokens];
          callback();
        }
      }, function(err) {
        if (err && logs > 0) console.error('predictAge: nGram error: ', err);        
      });
    }
    // recalculate wordcount if wcGrams is true
    if (opts.wcGrams) wordcount = tokens.length; 
    // get matches from array
    const matches = getMatches(itemCount(tokens), lexicon, opts.min, opts.max);
    // define intercept values (from Preotiuc-Pietro et al.)
    const ints = {AGE: 23.2188604687};
    // return requested output
    if (output.match(/matches/gi)) {
      return doMatches(matches, sortBy, wordcount, places, encoding);
    } else if (output.match(/full/gi)) {
      return {
        age: doLex(matches, ints, places, encoding, wordcount),
        matches: doMatches(matches, sortBy, wordcount, places, encoding),
      };
    } else {
      if (!output.match(/lex/gi) && logs > 1) {
        console.warn('predictAge: output option ("' + output +
            '") is invalid, defaulting to "lex".');
      }
      return doLex(matches, ints, places, encoding, wordcount);
    }
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = predictAge;
    }
    exports.predictAge = predictAge;
  } else {
    global.predictAge = predictAge;
  }
})();
