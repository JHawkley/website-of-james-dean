import React, { Fragment } from "react";
import { dew } from "tools/common";
import GalleryContext from "common/GalleryContext";
import Gallery from "components/Gallery";
import Page from "components/Page";
import Jump from "components/Jump";
import NateWidget from "components/Nate";
import NotSupportedError from "components/Nate/NotSupportedError";
import GameUpdateError from "components/Nate/GameUpdateError";

import ImgHeader from "static/images/nate-game/header.png";
import ImgTwo from "static/images/nate-game/2.jpg";
import ImgThreeInset from "static/images/nate-game/3_inset.jpg";
import { src as $gallery$1 } from "static/images/nate-game/1.gif";
import { src as $gallery$2 } from "static/images/nate-game/2.jpg";
import { src as $gallery$3 } from "static/images/nate-game/3.jpg";
import { src as $gallery$4 } from "static/images/nate-game/4.jpg";

import $miscprogramming from "pages/work/miscprogramming?route";

const isDev = process.env.NODE_ENV !== 'production';

const gallery = [
  { i: $gallery$1, d: "Nate jumps about in the test level.  Unfortunately, the build I have right now has shooting disabled; I believe I was reworking it at the time.  The gnarly design of the final room was intended to help work out issues with auto-tiling." },
  { i: $gallery$2, d: "Basic sketches of Nate himself; I wish I had more concept art of him to show.  This artwork was done by my partner on this project, Tderek99." },
  { i: $gallery$3, d: "Chie's kind-of-cute appearance conceals the frightening power she has at her command.  This artwork was done by my partner on this project, Tderek99." },
  { i: $gallery$4, d: "These early concept sketches of enemies show that Chie had some fun looking playmates for her \"pet\" in mind.  This artwork was done by my partner on this project, Tderek99." }
];

class Nate extends React.PureComponent {

  state = { nateWidgetError: null };

  handleNateError = (nateWidgetError) => {
    this.setState({ nateWidgetError });
    if (isDev) {
      let error = nateWidgetError;
      while (error != null) {
        console.error(error);
        error = error.innerError;
      }
    }
  }

  renderError(error) {
    const message = dew(() => {
      switch (true) {
        case error instanceof NotSupportedError: return (
          <p>Unfortunately, your browser does not support the features of the interactive component.  Please revisit this page with a different browser if you would like to play with Nate.</p>
        );
        case error instanceof GameUpdateError: return (
          <Fragment>
            <p>An unexpected error occurred while updating the Nate widget's state and can no longer run.  Please refresh the page if you would like to give it another go.</p>
            <p>Error details: &#96;{error.innerError.message}&#96;</p>
          </Fragment>
        );
        default: return (
          <Fragment>
            <p>The Nate widget encountered an unexpected error can can no longer run.  Please refresh the page if you would like to give it another go.</p>
            <p>Error details: &#96;{error.message}&#96;</p>
          </Fragment>
        );
      }
    });

    return (
      <blockquote>
        {message}
        <style jsx>
          {`
            blockquote { border-left-color: red; font-style: normal; }
            blockquote > :global(p:last-child) { margin-bottom: 0px; }
          `}
        </style>
      </blockquote>
    );
  }

  render() {
    const { nateWidgetError } = this.state;

    return (
      <Page {...this.props}>
        <GalleryContext.Provider value={gallery}>
          <h2 className="major">Nate Game</h2>
          <Gallery.Span className="image main">
            <ImgHeader alt="Nate Game Gallery" fluid />
            <div className="label-right">Gallery</div>
          </Gallery.Span>
          <p>A jump'n'shoot side-scroller game targeting JavaScript platforms and using the <Jump href="https://impactjs.com/">Impact game engine</Jump>.  I was coding everything in <Jump href="https://coffeescript.org/">CoffeeScript</Jump> at the time and <Jump href="https://box2d.org/about/">Box2D</Jump> was being used to provide physics.  A friend of mine, an artist who goes by Tderek99, was doing the graphics while I was doing the programming.</p>

          <h3>Details</h3>
          <Gallery.Span className="image right" index={1}>
            <ImgTwo alt="Nate Concepts" fluid />
            <div className="label-right">Image</div>
          </Gallery.Span>
          <p>This game was pitched as: Binding of Isaac, but plays like MegaMan and has a dash of Metroid.</p>
          <p>You were to play a <Gallery index={1}>dog-boy named Nate</Gallery> who is abducted from his world by a mighty dragon demon and given to his daughter as a pet.  This <Gallery index={2}>childish dragon girl, Chie</Gallery>, &quot;plays&quot; with Nate by using her reality warping powers to create a pocket dimension full of obstacles, traps, and <Gallery index={3}>monsters</Gallery> looking to tear him apart.</p>
          <p>She's technically a child, and her treatment of Nate is kind of the demonic equivalent of putting the hamster in the microwave; she just doesn't know better.</p>
          <p>She still grants him a simple magical bullet for self-defense when she drops him into this terrifying world, but scatters &quot;dog toys&quot; that can grant him new powers all over the place.</p>
          <p>In the same fashion as Binding of Isaac, these powers could combine and interact, giving every play-through the potential for something unexpected and exciting.</p>
          <p>The world was gonna rely on procedural generation to make every game different.  The map would generate in such a way that some of the items sprinkled in the world would be used as keys for progressing into new areas, adding a little bit of Metroidvania mechanics into the mix.</p>
          <Gallery.Span className="image right" index={2}>
            <ImgThreeInset alt="Chie Concepts" fluid />
            <div className="label-right">Image</div>
          </Gallery.Span>
          <p>Each of the four or so areas was going to have a boss fight, and upon defeating all the bosses, Nate would escape the pocket dimension and face Chie herself, who'd try to do the demonic equivalent of smacking his nose with a newspaper for trying to bite.</p>
          <p>In order to get the good ending, though, you needed to discover and complete optional goals; if done so, you'd face Chie's father as the final boss, earning your freedom and returning home ...if you manage to beat him.</p>
          <p>We'd probably have tuned things so a single run would probably take one to three hours.</p>

          <h3>Design</h3>
          <p>This project was my first time utilizing Entity-Component Systems and Action Lists.  Impact did not really have support for ECS entities out of the box, so I integrated an open-source ECS library, which I later ported to CoffeeScript so I could understand how it worked better as well as customize it.</p>
          <p>Unfortunately, I was not satisfied with Box2D's performance for driving the physics of the game.  Nate was using the old &quot;capsule body&quot; trick to make him run smoothly across slopes and other surfaces without getting stuck; this gave him a bit of a slippery feel on the edges of platforms.</p>
          <p>Most likely, I would have eventually disabled the physical simulation and only used Box2D for collision detection.  I didn't really like the thought of having so much dead weight from Box2D hanging around, though, and it inspired me to instead work on <Jump href={`${$miscprogramming}#platter`}>Platter</Jump>, a collision detection engine specifically for classical feeling 2D games.</p>
          <p>At the time we stopped working on the game, I was still building out the basic gameplay mechanics, figuring out how to handle all the power interactions and abilities, as well as laying the foundation for enemy programming.  Although I had scribbled out thoughts on how I'd try and do all the proc-gen stuff, I never got started on a prototype.</p>

          <h3>Interactive Sample</h3>
          <p>What with not being able to get more than a <Gallery index={0}>simple GIF animation</Gallery> together to demonstrate the original game, I put together this neat interactive widget for this website.  You can use your cursor to play with Nate, who will chase after and try to shoot it when he sees it.</p>
          <p>When he is in his passive state, he will just pace around, showing off his move-set through random actions.  But when he sees the cursor, he'll bark at it and switch to his aggressive state.</p>
          <p>He'll chase the cursor around and try to shoot at it.  If it gets too close, he'll flee, but try and take potshots at it.  If the cursor sits still too long or gets to a place he can't reach, he'll stare at it and display frustration in not being able to play anymore.</p>
          <p>If he is left bored for too long, he'll make a sad, confused whine and return to his passive behaviors.  Be nice and give him some fun!  It gets boring on that blue platform...</p>
          <NateWidget onError={this.handleNateError} />
          {nateWidgetError && this.renderError(nateWidgetError)}
          <p>All of this was made using a combination of HTML, JavaScript (with ESNext features via <Jump href="https://babeljs.io/">Babel</Jump>), and CSS (via <Jump href="https://github.com/zeit/styled-jsx">styled-jsx</Jump>).  The sounds were created using <Jump href="http://github.grumdrig.com/jsfxr/">jsfxr</Jump> and hopefully the sounds he makes when he changes between his behavior states are recognized as sounds a dog might make.</p>
          <p>While the Canvas API would probably have been the more performant option, an HTML-element based solution is fine for such a simple interactive piece.  His animations are all driven and controlled by CSS, and an action-list coded in a data-driven style drives his rather complicated behavior, made up of around 50 individual actions spread across 4 major behaviors.</p>
          <p>This was actually the most complex AI that I have made to date, in terms of behavioral complexity.</p>
        </GalleryContext.Provider>
      </Page>
    );
  }

}

export default Nate;