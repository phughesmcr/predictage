/**
 * predictAge
 * v4.0.1
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
 * (C) 2017-18 P. Hughes
 * Licence : Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Usage example:
 * const age = require('predictage');
 * // These are the default options
 * const opts = {
 *   'encoding': 'freq',
 *   'locale': 'US',
 *   'logs': 3,
 *   'max': Number.POSITIVE_INFINITY,
 *   'min': Number.NEGATIVE_INFINITY,
 *   'noInt': false,
 *   'output': 'lex',
 *   'places': undefined,
 *   'sortBy': 'lex',
 * }
 * const text = 'A big long string of text...';
 * const output = age(text, opts);
 * console.log(output)
 *
 * See README.md for help.
 *
 * @param {string} str input string
 * @param {Object} [opts] options object
 * @return {Object} predicted age, matched words, or both
 */

(function() {
  'use strict';

  // Lexicon data
  const lexicon = require('./data/lexicon.json');

  // Modules
  const async = require('async');
  const lexHelpers = require('lex-helpers');
  const tokenizer = require('happynodetokenizer');
  const trans = require('british_american_translate');
  const doLex = lexHelpers.doLex;
  const doMatches = lexHelpers.doMatches;
  const getMatches = lexHelpers.getMatches;
  const itemCount = lexHelpers.itemCount;

  /**
  * Predict the age of a string's author
  * @function predictAge
  * @param {string} str input string
  * @param {Object} [opts] options object
  * @return {Object} object with predicted age or array of matched words
  */
  const predictAge = (str, opts = {}) => {
    // default options
    opts.encoding = (typeof opts.encoding === 'undefined') ? 'freq' : opts.encoding;
    opts.locale = (typeof opts.locale === 'undefined') ? 'US' : opts.locale;
    opts.logs = (typeof opts.logs === 'undefined') ? 3 : opts.logs;
    if (opts.suppressLog) opts.logs = 0; // suppressLog was depreciated in v3.0.0
    opts.max = (typeof opts.max === 'undefined') ? Number.POSITIVE_INFINITY : opts.max;
    opts.min = (typeof opts.min === 'undefined') ? Number.NEGATIVE_INFINITY : opts.min;
    if (typeof opts.max !== 'number' || typeof opts.min !== 'number') {
      // try to convert to a number
      opts.min = Number(opts.min);
      opts.max = Number(opts.max);
      // check it worked, or else default to infinity
      opts.max = (typeof opts.max === 'number') ? opts.max : Number.POSITIVE_INFINITY;
      opts.min = (typeof opts.min === 'number') ? opts.min : Number.NEGATIVE_INFINITY;
    }
    opts.noInt = (typeof opts.noInt === 'undefined') ? false : opts.noInt;
    opts.output = (typeof opts.output === 'undefined') ? 'lex' : opts.output;
    opts.sortBy = (typeof opts.sortBy === 'undefined') ? 'freq' : opts.sortBy;
    // cache frequently used options
    const encoding = opts.encoding;
    const logs = opts.logs;
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
    // convert to lowercase and trim whitespace
    str = str.toLowerCase().trim();
    // translalte US English to UK English if selected
    if (opts.locale.match(/gb/gi)) str = trans.uk2us(str);
    // convert our string to tokens
    const tokens = tokenizer(str, {logs: opts.logs});
    // if there are no tokens return null
    if (!tokens) {
      if (logs > 1) console.warn('predictAge: no tokens found. Returning null.');
      return null;
    }
    // get wordcount before we add ngrams
    const wordcount = tokens.length;
    // get matches from array
    const matches = getMatches(itemCount(tokens), lexicon, opts.min, opts.max);
    // define intercept values
    const ints = {AGE: 23.2188604687};
    if (opts.noInt === true) ints.AGE = 0;
    // return requested output
    if (output.match(/matches/gi)) {
      return doMatches(matches, encoding, wordcount, sortBy, places);
    } else if (output.match(/full/gi)) {
      // return matches and values in one object
      let results;
      async.parallel({
        matches: function(callback) {
          callback(null, doMatches(matches, encoding, wordcount, sortBy, places));
        },
        values: function(callback) {
          callback(null, doLex(matches, ints, encoding, wordcount, places));
        },
      }, function(err, res) {
        if (err && logs > 0) console.error(err);
        results = res;
      });
      return results;
    } else {
      if (!output.match(/lex/gi) && logs > 1) {
        console.warn(`predictAge: output option ("${output}") is invalid, defaulting to "lex".`);
      }
      return doLex(matches, ints, encoding, wordcount, places);
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
