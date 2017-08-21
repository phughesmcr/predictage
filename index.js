/**
 * predictAge
 * v0.5.1
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
 * // These are the default options
 * const opts = {
 *  'output': 'age'
 *  'nGrams': true,
 *  'wcGrams': false,
 *  'sortBy': 'lex',
 *  'places': 7
 * }
 * const text = 'A big long string of text...';
 * const age = pa(text, opts);
 * console.log(age)
 *
 * @param {string} str input string
 * @param {Object} opts options object
 * @return {(number|Array)} predicted age or array of matched words
 */

'use strict'
;(function() {
  const root = this;
  const previous = root.predictAge;

  let lexicon = root.lexicon;
  let simplengrams = root.simplengrams;
  let tokenizer = root.tokenizer;

  if (typeof lexicon === 'undefined') {
    if (typeof require !== 'undefined') {
      tokenizer = require('happynodetokenizer');
      lexicon = require('./data/lexicon.json');
      simplengrams = require('simplengrams');
    } else throw new Error('predictAge required packages not found!');
  }

  /**
   * Get the indexes of duplicate elements in an array
   * @function indexesOf
   * @param  {Array} arr input array
   * @param  {string} str string to test against
   * @return {Array} array of indexes
   */
  const indexesOf = (arr, str) => {
    const idxs = [];
    let i = arr.length;
    while (i--) {
      if (arr[i] === str) {
        idxs.unshift(i);
      }
    }
    return idxs;
  };

  /**
   * Combines multidimensional array elements into strings
   * @function arr2string
   * @param  {Array} arr input array
   * @return {Array} output array
   */
  const arr2string = (arr) => {
    let i = 0;
    const len = arr.length;
    const result = [];
    for (i; i < len; i++) {
      result.push(arr[i].join(' '));
    }
    return result;
  };

  /**
   * Sort and return an array by column
   * @function sortByUse
   * @param  {Array} arr input array
   * @param  {string} by  what to sort by
   * @return {Array}
   */
  const sortArrBy = (arr, by) => {
    let x = 3; // default to sort by lexical value
    if (by === 'weight') {
      x = 2;
    } else if (by === 'freq') {
      x = 1;
    }
    const sorter = (a, b) => {
      return a[x] - b[x];
    };
    return arr.sort(sorter);
  };

  /**
   * Prepare an object to be sorted by sortArrBy
   * @function prepareMatches
   * @param  {Object} obj input object
   * @param  {string} by  string
   * @param  {number} wc  word count
   * @param  {number} places  decimal places
   * @return {Array} sorted array
   */
  const prepareMatches = (obj, by, wc, places) => {
    let matches = [];
    for (let word in obj) {
      if (!obj.hasOwnProperty(word)) continue;
      let lex = (Number(obj[word][1]) / wc) * Number(obj[word][2]);
      lex = Number(lex.toFixed(places));
      matches.push([obj[word][0], obj[word][1], obj[word][2], lex]);
    }
    return sortArrBy(matches, by);
  };

  /**
  * Match an array against a lexicon object
  * @function getMatches
  * @param {Array} arr token array
  * @param {Object} lexicon lexicon object
  * @param {number} places decimal places
  * @return {Object} object of matches
  */
  const getMatches = (arr, lexicon, places) => {
    const matches = {};
    // loop through the lexicon categories
    let category;
    for (category in lexicon) {
      if (!lexicon.hasOwnProperty(category)) continue;
      let match = [];
      // loop through words in category
      let data = lexicon[category];
      let word;
      for (word in data) {
        if (!data.hasOwnProperty(word)) continue;
        // if word from input matches word from lexicon ...
        if (arr.indexOf(word) > -1) {
          let weight = Number((data[word]).toFixed(places));
          // reps: number of times word appears in text
          let reps = indexesOf(arr, word).length;
          let item = [word, reps, weight];
          match.push(item);
        }
      }
      matches[category] = match;
    }
    // return matches object
    return matches;
  };

  /**
  * Calculate the total lexical value of matches
  * @function calcLex
  * @param {Object} obj matches object
  * @param {number} wc wordcount
  * @param {number} int intercept value
  * @param {number} places decimal places
  * @return {number} lexical value
  */
  const calcLex = (obj, wc, int, places) => {
    let word;
    let lex = 0;
    for (word in obj) {
      if (!obj.hasOwnProperty(word)) continue;
      // (word frequency / total wordcount) * weight
      lex += (Number(obj[word][1]) / wc) * Number(obj[word][2]);
    }
    // add intercept value
    lex += int;
    // return final lexical value
    return Number(lex.toFixed(places));
  };

  /**
  * @function predictAge
  * @param {string} str input string
  * @param {Object} opts options object
  * @return {(number|Array)} predicted age or array of matched words
  */
  const predictAge = (str, opts) => {
    // no string return null
    if (!str) return null;
    // if str isn't a string, make it into one
    if (typeof str !== 'string') str = str.toString();
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim();
    // options defaults
    if (!opts) {
      opts = {
        'output': 'age',
        'nGrams': true,
        'wcGrams': false,
        'sortBy': 'lex',
        'places': 16,
      };
    }
    opts.output = opts.output || 'age';
    opts.sortBy = opts.sortBy || 'lex';
    opts.nGrams = opts.nGrams || true;
    opts.wcGrams = opts.wcGrams || false;
    opts.places = opts.places || 16;
    const output = opts.output;
    const places = opts.places;
    // convert our string to tokens
    let tokens = tokenizer(str);
    // if there are no tokens return null
    if (!tokens) return null;
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
    const matches = getMatches(tokens, lexicon, places);
    // return requested output
    if (output === 'matches') {
      return prepareMatches(matches.AGE, opts.sortBy, wordcount, places);
    }
    let age = calcLex(matches.AGE, wordcount, 23.2188604687, places);
    if (output === 'age') {
      return Number(age.toFixed());
    } else {
      return age;
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
