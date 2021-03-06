# swf
A Simple Web Framework, written in TypeScript 

## Requirements and specs
- single page application with header, footer, main panel with tabs, menu and optional side navigation panel
- additional components
  - editable html table, compact but powerful (check [here](https://www.malagate.com/tools/uct/uct-main.html) to see it in action)
  - photos gallery with the following characteristics
    - justification of the gallery width, based on a given row target height: that is to say that 
      - all rows of the gallery have the same width and more or less the same height (except for the last one)
      - the ratios width/height are respected (no cropping)
    - checkable images
    - lightbox view
- client side javascript

These specs will certainly evolve with time and new needs, including server side functions to manage more sophisticated requirements (like authentication, localization) but the current objective was to put together a barebone framework to quickly develop simple applications like this [Universal Conversion Tool](https://www.malagate.com/tools/uct/uct-main.html)

For version 1.4, the framework was rewritten in TypeScript, and the JQuery dependencies eliminated. The js files have been left in the repository as a mater of convenience but are generated y the tsc compiler from the source files in the ts folder.

## Dependencies
- fonts from Google
- icons from [Feather](https://feathericons.com/)
  - including an addition, feather-sprite-circled.svg, developped to add a background circle to some of the icons defined in feather-sprite.svg 
- Rob Garrison's excellent [javascript number formatter](https://github.com/Mottie/javascript-number-formatter)

