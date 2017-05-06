/**
 * predictAge
 * v0.1.3
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
 * const text = "A big long string of text...";
 * let age = pa(text);
 * console.log(age)
 *
 * @param {string} str  input string
 * @return {number} predicted age
 */

'use strict'
;(function () {
  const root = this
  const previous = root.predictAge

  const hasRequire = typeof require !== 'undefined'

  let tokenizer = root.tokenizer
  let lexicon = root.lexicon

  if (typeof _ === 'undefined') {
    if (hasRequire) {
      tokenizer = require('happynodetokenizer')
      lexicon = require('./data/lexicon.json')
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
  * @function getMatches
  * @param  {Array} arr token array
  * @return {Object}  object of matches in their respective categories
  */
  const getMatches = (arr) => {
    const matches = {}
    // loop through the lexicon
    const data = lexicon.AGE
    let key
    for (key in data) {
      if (!data.hasOwnProperty(key)) continue
      let match = []
      if (arr.indexOf(key) > -1) {  // if there is a match between lexicon and input
        let item
        let weight = data[key]
        let reps = arr.indexesOf(key).length  // numbder of times the word appears in the input text
        if (reps > 1) { // if the word appears more than once, group all appearances in one array
          let words = []
          let i
          for (i = 0; i < reps; i++) {
            words.push(key)
          }
          item = [words, weight]
        } else {
          item = [key, weight]
        }
        match.push(item)
        matches[key] = match
      }
    }
    // return matches object
    return matches
  }

  /**
  * Calculate the lexical value of matched items in object
  * @function calcLex
  * @param  {Object} obj  object of matched items
  * @param  {number} wc   total word count
  * @param  {number} int  intercept value
  * @return {number}  lexical value
  */
  const calcLex = (obj, wc, int) => {
    const counts = []   // number of matched objects
    const weights = []  // weights of matched objects
    // loop through the matches and get the word frequency (counts) and weights
    let key
    for (key in obj) {
      if (!obj.hasOwnProperty(key)) continue
      if (Array.isArray(obj[key][0][0])) {  // if the first item in the match is an array, the item is a duplicate
        counts.push(obj[key][0][0].length)  // for duplicate matches
      } else {
        counts.push(1)                      // for non-duplicates
      }
      weights.push(obj[key][0][1])          // corresponding weight
    }
    // calculate lexical usage value
    let lex = 0
    let i = 0
    const len = counts.length
    const words = Number(wc)
    for (i; i < len; i++) {
      let count = Number(counts[i])
      let weight = Number(weights[i])
      // (word frequency / total word count) * weight
      lex += (count / words) * weight
    }
    // add int
    lex += Number(int)
    // return final lexical value + intercept
    return Number(lex)
  }

  /**
  * @function predictAge
  * @param  {string} str  string input to analyse
  * @return {number}  predicted age
  */
  const predictAge = (str) => {
    // if string is null return null
    if (str == null) return null
    // make sure str is a string
    if (typeof str !== 'string') str = str.toString()
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim()
    // convert our string to tokens
    const tokens = tokenizer(str)
    // if there are no tokens return null
    if (tokens == null) return null
    // get matches from array
    const matches = getMatches(tokens)
    // calculate lexical useage
    const age = calcLex(matches, tokens.length, 23.2188604687)
    // return predicted age as a number
    return age
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
