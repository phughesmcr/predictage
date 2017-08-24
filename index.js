/**
 * predictAge
 * v1.0.0-rc.1
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
 *  'max': Number.POSITIVE_INFINITY,
 *  'min': Number.NEGATIVE_INFINITY,
 *  'nGrams': true,
 *  'output': 'age',
 *  'places': 16,
 *  'sortBy': 'lex',
 *  'wcGrams': false,
 * }
 * const text = 'A big long string of text...';
 * const age = pa(text, opts);
 * console.log(age)
 *
 * See README.md for help.
 *
 * @param {string} str input string
 * @param {Object} opts options object
 * @return {(number|Array|Object)} predicted age, matched words, or both
 */

'use strict'
;(function() {
  const global = this;
  const previous = global.predictAge;

  let lexicon = global.lexicon;
  let simplengrams = global.simplengrams;
  let tokenizer = global.tokenizer;
  let lexHelpers = global.lexHelpers;

  if (typeof lexicon === 'undefined') {
    if (typeof require !== 'undefined') {
      lexicon = require('./data/lexicon.json');
      simplengrams = require('simplengrams');
      tokenizer = require('happynodetokenizer');
      lexHelpers = require('lex-helpers');
    } else throw new Error('predictAge required modules not found!');
  }

  const arr2string = lexHelpers.arr2string;
  const prepareMatches = lexHelpers.prepareMatches;
  const getMatches = lexHelpers.getMatches;
  const calcLex = lexHelpers.calcLex;

  /**
  * @function predictAge
  * @param {string} str input string
  * @param {Object} opts options object
  * @return {(number|Array)} predicted age or array of matched words
  */
  const predictAge = (str, opts) => {
    // no string return null
    if (!str) {
      console.error('predictAge: no string found. Returning null.');
      return null;
    }
    // if str isn't a string, make it into one
    if (typeof str !== 'string') str = str.toString();
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim();
    // options defaults
    if (!opts || typeof opts !== 'object') {
      opts = {
        'encoding': 'freq',
        'max': Number.POSITIVE_INFINITY,
        'min': Number.NEGATIVE_INFINITY,
        'nGrams': true,
        'output': 'age',
        'places': 16,
        'sortBy': 'lex',
        'wcGrams': false,
      };
    }
    opts.encoding = opts.encoding || 'freq';
    opts.max = opts.max || Number.POSITIVE_INFINITY;
    opts.min = opts.min || Number.NEGATIVE_INFINITY;
    opts.nGrams = opts.nGrams || true;
    opts.output = opts.output || 'age';
    opts.places = opts.places || 16;
    opts.sortBy = opts.sortBy || 'lex';
    opts.wcGrams = opts.wcGrams || false;
    const encoding = opts.encoding;
    const output = opts.output;
    const places = opts.places;
    const sortBy = opts.sortBy;
    // convert our string to tokens
    let tokens = tokenizer(str);
    // if there are no tokens return null
    if (!tokens) {
      console.warn('predictAge: no tokens found. Returned null.');
      return null;
    }
    // get wordcount before we add ngrams
    let wordcount = tokens.length;
    // get n-grams
    if (opts.nGrams) {
      const bigrams = arr2string(simplengrams(str, 2));
      const trigrams = arr2string(simplengrams(str, 3));
      tokens = tokens.concat(bigrams, trigrams);
    }
    // recalculate wordcount if wcGrams is true
    if (opts.wcGrams) wordcount = tokens.length;
    // get matches from array
    const matches = getMatches(tokens, lexicon, opts.min, opts.max);
    // return requested output
    if (output === 'matches') {
      return prepareMatches(matches.AGE, sortBy, wordcount, places,
          encoding);
    }
    let age = calcLex(matches.AGE, 23.2188604687, places, encoding, wordcount);
    if (output === 'lex') {
      return age;
    } else if (output === 'full') {
      const full = {};
      full.lex = age;
      full.age = Number(age.toFixed());
      full.matches = prepareMatches(matches.AGE, sortBy, wordcount, places,
          encoding);
      return full;
    } else {
      if (output !== 'age') {
        console.warn('predictAge: output option ("' + output +
            '") is invalid, defaulting to "age".');
      }
      return Number(age.toFixed());
    }
  };

  predictAge.noConflict = function() {
    root.predictAge = previous;
    return predictAge;
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = predictAge;
    }
    exports.predictAge = predictAge;
  } else {
    root.predictAge = predictAge;
  }
}).call(this);
