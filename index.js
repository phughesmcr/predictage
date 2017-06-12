/**
 * predictAge
 * v0.2.0
 *
 * Predict the age of a string's author.
 *
 * Help me make this better:
 * https://github.com/phugh/predictAge
 *
 * Based on this paper:
 * Schwartz, H. A., Eichstaedt, J. C., Kern, M. L., Dziurzynski, L., Ramones, S. M., Agrawal, M., Shah, A., Kosinski, M., Stillwell, D., Seligman, M. E., & Ungar, L. H. (2013). Personality, gender, and age in the language of social media: The Open-Vocabulary Approach. PLOS ONE, 8(9), . . e73791.
 *
 * Using the age lexicon data from http://www.wwbp.org/lexica.html
 * Used under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported licence
 *
 * (C) 2017 P. Hughes
 * Licence : Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Usage example:
 * const pa = require('predictage);
 * const ngrams = true  // include bigrams and trigrams - not recommended for long strings!
 * const text = "A big long string of text...";
 * let age = pa(text, ngrams);
 * console.log(age)
 *
 * @param {string} str  input string
 * @param {Boolean} ngrams include bigrams and trigrams?
 * @return {number} predicted age
 */

'use strict'
;(function () {
  const root = this
  const previous = root.predictAge

  const hasRequire = typeof require !== 'undefined'

  let tokenizer = root.tokenizer
  let lexicon = root.lexicon
  let natural = root.natural

  if (typeof _ === 'undefined') {
    if (hasRequire) {
      tokenizer = require('happynodetokenizer')
      lexicon = require('./data/lexicon.json')
      natural = require('natural')
    } else throw new Error('predictAge required happynodetokenizer and ./data/lexicon.json')
  }

  // get number of times el appears in an array
  Array.prototype.indexesOf = function (el) {
    const idxs = []
    let i = this.length - 1
    for (i; i >= 0; i--) {
      if (this[i] === el) {
        idxs.unshift(i)
      }
    }
    return idxs
  }

  /**
  * @function getBigrams
  * @param  {string} str input string
  * @return {Array} array of bigram strings
  */
  const getBigrams = str => {
    const NGrams = natural.NGrams
    const bigrams = NGrams.bigrams(str)
    const result = []
    const len = bigrams.length
    let i = 0
    for (i; i < len; i++) {
      result.push(bigrams[i].join(' '))
    }
    return result
  }

  /**
  * @function getTrigrams
  * @param  {string} str input string
  * @return {Array} array of trigram strings
  */
  const getTrigrams = str => {
    const NGrams = natural.NGrams
    const trigrams = NGrams.trigrams(str)
    const result = []
    const len = trigrams.length
    let i = 0
    for (i; i < len; i++) {
      result.push(trigrams[i].join(' '))
    }
    return result
  }

  /**
  * @function getMatches
  * @param  {Array} arr token array
  * @param  {Object} lexicon  lexicon object
  * @return {Object}  object of matches
  */
  const getMatches = (arr, lexicon) => {
    const matches = {}
    // loop through the lexicon categories
    let category
    for (category in lexicon) {
      if (!lexicon.hasOwnProperty(category)) continue
      let match = []
      // loop through words in category
      let data = lexicon[category]
      let key
      for (key in data) {
        if (!data.hasOwnProperty(key)) continue
        // if word from input matches word from lexicon ...
        if (arr.indexOf(key) > -1) {
          let item
          let weight = data[key]
          let reps = arr.indexesOf(key).length // numbder of times the word appears in the input text
          if (reps > 1) { // if the word appears more than once, group all appearances in one array
            let words = []
            for (let i = 0; i < reps; i++) {
              words.push(key)
            }
            item = [words, weight]
          } else {
            item = [key, weight]
          }
          match.push(item)
        }
      }
      matches[category] = match
    }
    // return matches object
    return matches
  }

  /**
  * @function calcLex
  * @param  {Object} obj      matches object
  * @param  {number} wc       wordcount
  * @param  {number} int      intercept value
  * @return {number} lexical value
  */
  const calcLex = (obj, wc, int) => {
    const counts = []   // number of matched objects
    const weights = []  // weights of matched objects
    // loop through the matches and get the word frequency (counts) and weights
    let key
    for (key in obj) {
      if (!obj.hasOwnProperty(key)) continue
      if (Array.isArray(obj[key][0])) { // if the first item in the match is an array, the item is a duplicate
        counts.push(obj[key][0].length) // for duplicate matches
      } else {
        counts.push(1)                  // for non-duplicates
      }
      weights.push(obj[key][1])         // corresponding weight
    }
    // calculate lexical usage value
    let lex = 0
    let i
    const len = counts.length
    const words = Number(wc)
    for (i = 0; i < len; i++) {
      let weight = Number(weights[i])
      let count = Number(counts[i])
      // (word frequency / total word count) * weight
      lex += (count / words) * weight
    }
    // add intercept value
    lex += int
    // return final lexical value
    return lex
  }

  /**
  * @function predictAge
  * @param  {string} str  string input to analyse
  * @param  {Boolean} ngrams include bigrams and trigrams?
  * @return {number}  predicted age
  */
  const predictAge = (str, ngrams) => {
    // if string is null return null
    if (str == null) return null
    // make sure str is a string
    if (typeof str !== 'string') str = str.toString()
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim()
    // convert our string to tokens
    let tokens = tokenizer(str)
    // if there are no tokens return null
    if (tokens == null) return null
    // get wordcount before we add ngrams
    const wordcount = tokens.length
    // handle bigrams and trigrams if wanted
    if (ngrams) {
      const bigrams = getBigrams(str)
      const trigrams = getTrigrams(str)
      tokens = tokens.concat(bigrams)
      tokens = tokens.concat(trigrams)
    }
    // get matches from array
    const matches = getMatches(tokens, lexicon)
    // return predicted age as a number
    return calcLex(matches.AGE, wordcount, 23.2188604687)
  }

  predictAge.noConflict = function () {
    root.predictAge = previous
    return predictAge
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = predictAge
    }
    exports.predictAge = predictAge
  } else {
    root.predictAge = predictAge
  }
}).call(this)
