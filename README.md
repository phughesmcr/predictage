# predictage - Node.js based Age Prediction

Predict the age of a string's author.

## Usage
```Javascript
const pa = require('predictage')
const ngrams = true  // include bigrams and trigrams - not recommended for long strings!
const text = "A long string of text...."
const age = pa(text, ngrams)
console.log(age)
```

## Acknowledgements

### References
Schwartz, H. A., Eichstaedt, J. C., Kern, M. L., Dziurzynski, L., Ramones, S. M., Agrawal, M., Shah, A., Kosinski, M., Stillwell, D., Seligman, M. E., & Ungar, L. H. (2013). Personality, gender, and age in the language of social media: The Open-Vocabulary Approach. PLOS ONE, 8(9), . . e73791.

### Lexicon
Using the age lexicon data from http://www.wwbp.org/lexica.html
Used under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported licence

## Licence
(C) 2017 P. Hughes
Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
[Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)
