require('remark')
var slideshow;

window.addEventListener('load', () => {
  slideshow = remark.create({
    sourceUrl: 'deck.md'
  })
})
