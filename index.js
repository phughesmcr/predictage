/**
 * predictAge
 * v0.2.1
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
 * const age = pa(text, ngrams);
 * console.log(age)
 *
 * @param {string} str input string
 * @param {Boolean} ngrams include bigrams and trigrams?
 * @return {number} predicted age
 */

'use strict'
;(function () {
  const root = this
  const previous = root.predictAge

  let lexicon = root.lexicon
  let natural = root.natural
  let tokenizer = root.tokenizer

  if (typeof lexicon === 'undefined') {
    if (typeof require !== 'undefined') {
      tokenizer = require('happynodetokenizer')
      lexicon = require('./data/lexicon.json')
      natural = require('natural')
    } else throw new Error('predictAge requires node modules happynodetokenizer and natural, and ./data/lexicon.json')
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
  * Get all the bigrams of a string and return as an array
  * @function getBigrams
  * @param  {string} str input string
  * @return {Array} array of bigram strings
  */
  const getBigrams = str => {
    const bigrams = natural.NGrams.bigrams(str)
    const len = bigrams.length
    const result = []
    let i = 0
    for (i; i < len; i++) {
      result.push(bigrams[i].join(' '))
    }
    return result
  }

  /**
  * Get all the trigrams of a string and return as an array
  * @function getTrigrams
  * @param  {string} str input string
  * @return {Array} array of trigram strings
  */
  const getTrigrams = str => {
    const trigrams = natural.NGrams.trigrams(str)
    const len = trigrams.length
    const result = []
    let i = 0
    for (i; i < len; i++) {
      result.push(trigrams[i].join(' '))
    }
    return result
  }

  /**
  * Match an array against a lexicon object
  * @function getMatches
  * @param  {Array} arr token array
  * @param  {Object} lexicon lexicon object
  * @return {Object} object of matches
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
      let word
      for (word in data) {
        if (!data.hasOwnProperty(word)) continue
        // if word from input matches word from lexicon ...
        if (arr.indexOf(word) > -1) {
          let item
          let weight = data[word]
          let reps = arr.indexesOf(word).length // number of times the word appears in the input text
          if (reps > 1) { // if the word appears more than once, group all appearances in one array
            let words = []
            for (let i = 0; i < reps; i++) {
              words.push(word)
            }
            item = [words, weight]  // i.e. [[word, word, word], weight]
          } else {
            item = [word, weight]   // i.e. [word, weight]
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
  * Calculate the total lexical value of matches
  * @function calcLex
  * @param {Object} obj matches object
  * @param {number} wc wordcount
  * @param {number} int intercept value
  * @return {number} lexical value
  */
  const calcLex = (obj, wc, int) => {
    const counts = []   // number of matched objects
    const weights = []  // weights of matched objects
    // loop through the matches and get the word frequency (counts) and weights
    let word
    for (word in obj) {
      if (!obj.hasOwnProperty(word)) continue
      if (Array.isArray(obj[word][0])) {  // if the first item in the match is an array, the item is a duplicate
        counts.push(obj[word][0].length)  // state the number of times the duplicate item appears
      } else {
        counts.push(1)                    // for non-duplicates, the word obviously only appears 1 time
      }
      weights.push(obj[word][1])          // corresponding weight
    }
    // calculate lexical usage value
    let lex = 0
    let i = 0
    const len = counts.length
    for (i; i < len; i++) {
      // (word frequency / total wordcount) * weight
      lex += (Number(counts[i]) / wc) * Number(weights[i])
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
      tokens = tokens.concat(bigrams, trigrams)
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
