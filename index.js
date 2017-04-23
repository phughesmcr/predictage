/* jshint node: true, esversion:6, laxbreak: true */
/**
 * predictAge
 * v0.0.3
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
 * @param {string} str  {input string}
 * @return {number} {predicted age}
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

  // get multiple indexes helper
  Array.prototype.indexesOf = function (el) {
    var idxs = []
    for (var i = this.length - 1; i >= 0; i--) {
      if (this[i] === el) {
        idxs.unshift(i)
      }
    }
    return idxs
  }

  const getMatches = (arr) => {
    let matches = {}
    for (var key in lexicon['AGE']) {
      if (!lexicon['AGE'].hasOwnProperty(key)) continue;
      let match = []
      let word = key
      if (arr.indexOf(word) > -1) {
        let item
        let mWord = word
        let weight = lexicon['AGE'][key]
        let reps = arr.indexesOf(word).length
        if (reps > 1) {
          let words = []
          for (let i = 0; i < reps; i++) {
            words.push(word)
          }
          item = [words, weight]
        } else {
          item = [word, weight]
        }
        match.push(item)
        matches[mWord] = match
      }
    }
    return matches
  }

  const calcLex = (obj, wc, int) => {
    let lex
    let counts = []
    let weights = []
    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      if (Array.isArray(obj[key][0][0])) {
        counts.push(obj[key][0][0].length)
      } else {
        counts.push(1)
      }
      weights.push(obj[key][0][1])
    }
    let sums = []
    counts.forEach(function (a, b) {
      let sum = (a / wc) * weights[b]
      sums.push(sum)
    })
    lex = sums.reduce(function (a, b) { return a + b }, 0)
    lex = Number(lex) + Number(int)
    return lex
  }

  const getAge = (arr) => {
    // get matches from array
    const matches = getMatches(arr)

    // get wordcount
    const wordcount = arr.length

    // set intercept value
    const int = 23.2188604687

    // calculate lexical useage
    const age = calcLex(matches, wordcount, int)

    return age
  }

  const predictAge = (str) => {
    // make sure there is input before proceeding
    if (str == null) throw new Error('Whoops! No input string found!')

    // convert our string to tokens
    const tokens = tokenizer(str)

    // predict and return
    return getAge(tokens)
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
