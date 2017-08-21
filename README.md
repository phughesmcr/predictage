# predictage - Node.js based Age Prediction

Predict the age of a string's author.

## Usage
```Javascript
const pa = require('predictage')
const opts = {
  'output': 'age'   /* 'age' (default) returns the predicted age (e.g. 49).
                       'lex', returns the lexical value (i.e. the predicted
                       age with decimal places).
                       'matches' returns an array, see below. */
  'nGrams': true,    // include bigrams / trigrams (true - default).
  'wcGrams': false,  /* take word count before (false - default) or
                          after (true) n-Grams have been added. */
  'sortBy': 'lex',   /* if output = 'matches', sortBy can be used to sort the
                          returned matches array. Acceptable options are
                          'weight' sorts by singular weight, 'freq' sorts by
                          word frequency, or 'lex' (default) sorts by final
                          lexical value ((word freq / word count) * weight). */
  'places': 7        // number of decimal places to return values to.
}
const text = 'A long string of text....'
const age = pa(text, opts)
console.log(age)
```

## Options

A number of options are provided to allow you to tailor the output to your needs. However, for general use it is recommended that all options are left to their defaults.

### "output"

**String - Valid options: 'age' (default),'matches', 'lex'**

'age' (default) returns the predicted age to 0 decimal places.

'lex' returns the lexical value, which is essentially the predicted age to 7 decimal places.

The number of decimal places can be changed using the 'places' value in the options object. Note that setting 'places' to 0 produces the same result as setting 'output' to 'age'.

'matches' returns an array of matched words along with the number of times each word appears, its weight, and its final lexical value (i.e. (appearances / word count) * weight). See the output section below for an example.

### nGrams

**Boolean - valid options: true (default) or false**

n-Grams are contiguous pieces of text, bi-grams being chunks of 2, tri-grams being chunks of 3.

### wcGrams

**Boolean - valid options: true or false (default)**

When set to true, the output from the nGrams option will be added to the word count.

### sortBy

**String - valid options: 'weight', 'freq', 'lex' (default)**

If 'output' = 'matches', this option can be used to control how the outputted array is sorted.

'weight' sorts by the words initial weight.

'freq' sorts by word frequency.

'lex' sorts by final lexical value, i.e. (word frequency * word count) / word weight.

### places

**Number**

Number of decimal places to limit outputted values to.


## Acknowledgements

### References
Schwartz, H. A., Eichstaedt, J. C., Kern, M. L., Dziurzynski, L., Ramones, S. M., Agrawal, M., Shah, A., Kosinski, M., Stillwell, D., Seligman, M. E., & Ungar, L. H. (2013). Personality, gender, and age in the language of social media: The Open-Vocabulary Approach. PLOS ONE, 8(9), . . e73791.

### Lexicon
Using the age lexicon data from http://www.wwbp.org/lexica.html
Used under the [Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)

## Licence
(C) 2017 P. Hughes

[Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)
