import Article from "components/Article";
import Jump from "components/Jump";

import ImgHeader from "static/images/3drenders/misc_header.jpg";
import ImgGeoBar from "static/images/3drenders/geo_bar.jpg";
import ImgOilSandsBar from "static/images/3drenders/oilsands_bar.jpg";
import ImgBlackholeInset from "static/images/3drenders/blackhole_anim_inset.jpg";
import ImgLandscapeInset from "static/images/3drenders/landscape1_inset.jpg";
import ImgIceCaveInset from "static/images/3drenders/icecave_inset.jpg";

import $work from "components/articles/Work?name";

class ThreeDee extends React.PureComponent {

  Gallery = this.props.appContext.makeGallery([
    { i: "static/images/3drenders/landscape1.jpg", d: "The far LOD portion of the blackhole strike scene.  The procedural generation includes both trees and buildings of a small city far in the distance." },
    { i: "static/images/3drenders/landscape2.jpg", d: "The unfinished near LOD portion of the blackhole strike scene.  These trees were hard to render; I believe I was searching for ways to make them render faster, while still being high quality for the near shot.  These would have burst into flames the moment of the bright blast beyond the distant mountain." },
    { i: "static/images/3drenders/icecave.jpg", d: "Everyone tells me this render would be right at home in a Myst-like game.  The internal reflections from the ice and the metal are quite neat.  I really love the atmosphere here." },
  ]);

  render() {
    const { Gallery, props: { appContext: { preloadSync } } } = this;
    return (
      <Article {...this.props} parent={$work}>
        <h2 className="major">Miscellaneous 3D</h2>
        <span className="image main javascript-link" onClick={Gallery.openCallback(0)}>
          <ImgHeader fluid preloadSync={preloadSync} alt="Miscellaneous 3D Modeling Gallery" />
          <div className="label-right">Gallery</div>
        </span>
        <p>Along with the Solar Bio-Reactor, I had a few other 3D projects as well.</p>

        <h3>Geo-Steering Concepts</h3>
        <p>Some of my first animations were to help explain geo-steering and related concepts to others.  These started as really quite poorly done Flash animations (which I'm not gonna be showing here), but I eventually got my hands on a copy of 3D Studio Max and did...  better?</p>
        <span className="span-across align-center">
          <Jump href="https://drive.google.com/open?id=15BXfXkI4uh-wPY9NWNtcDm-uPQQHAJ0x" icon="none" className="image contain">
            <ImgGeoBar fluid preloadSync={preloadSync} alt="Geo-Steering Correlation Animation" />
            <div className="label-right">Video</div>
          </Jump>
        </span>
        <p>Anyways, the one above is a basic explanation of how the offset well relates to the horizontal well, showing the similarities between the two wells' gamma-ray logs.  A correlation is shown explicitly and then a few more later in.</p>
        <span className="span-across align-center">
          <Jump href="https://drive.google.com/open?id=15qAXg7Y2k-j4UGEe3tKq12YFyqN-tBiQ" icon="none" className="image contain">
            <ImgOilSandsBar fluid preloadSync={preloadSync} alt="Oil Sands Animation" />
            <div className="label-right">Video</div>
          </Jump>
        </span>
        <p>This animation, I believe, was intended to show how horizontal drilling could be effective at hitting oil sands.  I seem to recall that you could use steam to release the oil that was trapped in the sand.  Been a long time since I thought about this old animation.</p>
        <p>Gosh, this camera work is real bad...  Well, these might not be much, but they got their point across.</p>

        <h3>Blackhole Animation</h3>
        <Jump href="https://drive.google.com/open?id=1X8FK2cpaQxLQLB2M7UHaOVgFco98uup9" icon="none" className="image right">
          <ImgBlackholeInset fluid preloadSync={preloadSync} alt="Blackhole Atmosphere Animation" />
          <div className="label-right">Video</div>
        </Jump>
        <p>A long while ago, I had it in my mind that I wanted to do a big animation of Earth trapping a minor blackhole in its orbit and the slow, horrendous destruction of the world as it slowly fell into the core.</p>
        <p>It would basically fall through the atmosphere as this blindingly hot ball of swirling gas before punching clean through the Earth leaving a molten scar.</p>
        <p>Was gonna be this big, epic thing where you see the initial strike, then the blackhole erupt out the other side of the planet.  It would fly far enough out to eventually strike the moon before drifting back in again.  This landscape was going to be the setting of the initial blast.</p>
        <span className="image right javascript-link" onClick={Gallery.openCallback(0)}>
          <ImgLandscapeInset fluid preloadSync={preloadSync} alt="Blackhole Landscape Render" />
          <div className="label-right">Image</div>
        </span>
        <p>As you can see, I was aiming for photo-realism.  It features some 35,000 pine tree facades.  The original trees were created using this impressive procedurally-generated plant/tree plugin for 3DSMax called <Jump href="https://exlevel.com/features/">GrowFX</Jump>, then rendered to a 2D sprite and distributed all over the scene using a distribution map.</p>
        <p>A blinding light would have flown overhead before a hellish flash shown from the far side of the mountain.  <Gallery index={1}>The trees</Gallery> all instantly catch fire and this idyllic landscape would have then begun to crack and glow as the shockwaves twisted the crust and reshaped it into a hellscape.</p>
        <p>Describing it makes me wish I had at least finished that scene...  It'd have been a <em>hell</em> of a sight!  Alas, I got distracted by game-dev stuff instead and shelved my plans for this animation.</p>

        <h3>Ice Cavern</h3>
        <span className="image right javascript-link" onClick={Gallery.openCallback(2)}>
          <ImgIceCaveInset fluid preloadSync={preloadSync} alt="Ice Cavern Render" />
          <div className="label-right">Image</div>
        </span>
        <p>A lot of landscapes and other macro-scale objects.  How about a scene that is a little more intimate?</p>
        <p>At one point, I was working on an AS3/Flash Choose Your Own Adventure game engine.  To sort of showcase its abilities, I was also working on a dumb little story to go with it that used random photographs, 3D renders, and colored-shapes as characters.</p>
        <p>This chilling scene would have led to the game's climax, where you release an evil colored-shape with, <em>gasp</em>, <strong>NO CORNERS</strong> from its prison!  Terrifying, I know...  This would have led into a silly jRPG battle mini-game before the credits played.</p>
        <p>Getting the ice texture to look this way was quite a challenge.  I wanted that translucent glow, like the sun's light is managing to break through into the cavern through the walls.</p>
        <p>Gives it quite the eerie atmosphere, doesn't it?</p>
      </Article>
    );
  }

}

export default ThreeDee;