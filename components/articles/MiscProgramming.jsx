import Article from "components/Article";
import Jump from "components/Jump";

import ImgHeader from "static/images/miscprogramming/header.png";

import $work from "components/articles/Work?name";

const MiscProgramming = (props) => {
  const { imageSync, active } = props;
  const phase = active ? 0 : 1;
  return (
    <Article {...props} parent={$work}>
      <h2 className="major">Misc Programming</h2>
      <span className="image main"><ImgHeader fluid phase={phase} imageSync={imageSync} alt="Misc Programming" /></span>
      <p>For the following projects, I have less to show, but they're still worth mentioning.</p>

      <h3 id="platter">Platter</h3>
      <p>Platter was an attempt to create a collision detection engine that was specially suited for creating 2D retro-style games.  It started out being programmed in CoffeeScript but was shifted to TypeScript later on.</p>
      <p>Platter's code is available for viewing on <Jump href="https://github.com/JHawkley/platter">GitHub</Jump>.  It is a recent and decent example of my coding ability, however it is not presently functional.</p>
      <p>I was not having much luck attracting collaborators on my other game-dev projects, so I decided to focus on building an open-source collision detection library in the meantime while I considered my future plans.  I also took this as an opportunity to cut my teeth on test-driven development.  I felt that a collision-detection engine would be well suited for this method of development, since its domain should be quite testable.</p>
      <p>Sticking to test-driven development proved to be pretty tricky as the project grew, especially as the project entered into the bulk of the actual collision detection routines.  The temptation to just &quot;get it working&quot; and not bother with the complexity of building tests first became pretty strong.</p>
      <p>However, the technique was very good for building the initial APIs for the various kinds of shaped colliders.  It certainly helped to focus things early on; I still have more to learn on sticking to TDD as the project's code-base grows in size.</p>
      <p>The switch from CoffeeScript to TypeScript I actually view as an unfortunate choice.  Many of the patterns I used in JavaScript were not compatible with the type-system at the time, mostly object-composition related patterns.  This caused TypeScript to rub me the wrong way as I tried to force it to work the way I wanted through complicated &quot;type-system gymnastics&quot;.</p>
      <p>TypeScript also has very few language features that make programming in it terse and expressive; it's just a more-restricted sub-set of JavaScript with few added language features over ECMAScript 2015.  I know this was a design goal of the language, but it is regrettable that the language won't do more to support the programmer.  You sometimes just have to accept that you can't make DRY code that is also clear and readable.</p>
      <p>In the end, I made the mistake of trying to fight TypeScript; it has a particular way it wants you to do things and deviating from that will cause you nothing but grief.  Now I know better.</p>

      <h3 id="sge">Scala Game Engine</h3>
      <p>While I was working with Impact, I actually re-wrote and enhanced it a few times as my needs changed, getting pretty intimate with it; added things like <Jump href="http://www.pixijs.com/">PixiJS</Jump> integration to modernize it a bit, an entity-component system, etc.  It helped me understand how game engines functioned, and with other influences, that understanding evolved.</p>
      <p>This eventually led into this project, to create a game engine in Scala from scratch.</p>
      <p>Unfortunately, I don't have too much to show in regards to this project, aside from <Jump href="/static/sge/index-dev.html">a bouncing-box benchmark</Jump> (based on <Jump href="https://pixijs.io/bunny-mark/">Pixi.js' Bunnymark</Jump>), but it is my most recent project.  Much of the work has so far been under-the-hood; laying the foundation of the engine and all that.</p>
      <p>While the demo doesn't reveal it very well, it has an input system, resource management infrastructure, an entity-component system, and the beginnings of a customizable rendering pipeline.</p>
      <p>Interested in Scala, I was poking around to see what the state of game development was on the platform.  This led me to <Jump href="http://michaelshaw.io/game_talk/game.html#/">an intriguing little slideshow</Jump>, which made reference to <Jump icon="movie" href="https://youtu.be/1PhArSujR_A?t=16m18s">an old key-note of John Carmack's from QuakeCon 2013</Jump> and his thoughts on the future of multi-threaded game engine architecture.  It seemed like it might be kind of fun to try and work within an immutable world state.</p>
      <p>Unfortunately, I did a bit of a silly thing and did it all in ScalaJS, which targets the decidedly single-threaded JavaScript platform and can't take advantage of the concurrency gains from immutability.  But hey, baby steps.  I know JavaScript well.  I could adapt it to JVM later once I got the principals down.</p>
      <p>I kind of wish I had targeted the JVM, though, as I can see a number of mistakes now that would negatively impact concurrency.  I also think I over-complicated the design a lot by using a functional-reactive style for the entity manager.</p>
      <p>I think if I ever come back to this project, I'd probably do a number of refactors to reduce that complexity and make safe concurrency easier to obtain.  However, making my own engine, while a great learning experience, wouldn't be the best use of my time.  I would prefer investing my time mastering Unity instead.</p>
    </Article>
  );
};

export default MiscProgramming;