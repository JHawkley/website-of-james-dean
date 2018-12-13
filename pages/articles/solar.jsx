import Page from "components/Page";
import Jump from "components/Jump";
import Lightbox from "components/Lightbox";

import ImgHeader from "static/images/3drenders/br_header.jpg";
import ImgAnimInset from "static/images/3drenders/br_anim_inset.jpg";
import ImgFiveInset from "static/images/3drenders/br5_inset.jpg";

import $work from "pages/articles/work?name";
import $solar from "?name";

const Gallery = Lightbox.makeGallery($solar, [
  { i: "static/images/3drenders/br1.jpg", d: "A glory shot of the solar bio-reactor with a sprawling Tibet-inspired mountain landscape behind it." },
  { i: "static/images/3drenders/br2.jpg", d: "An overview of the rendered installation.  The control script had a low chance to keep some of the mirrors unaimed so as to make them appear as if they were being cleaned and maintained." },
  { i: "static/images/3drenders/br3.jpg", d: "A cutaway of a mirror, showing its structure.  A thin membrane was intended to be flexed by controlling the air pressure inside it, which would deform the mirror and control its focus." },
  { i: "static/images/3drenders/br4.jpg", d: "Along with the algae, more mundane farming could also potentially be done.  These simple greenhouses would allow diffuse light inside, keeping it bright and balmy inside for plants." },
  { i: "static/images/3drenders/br5.png", d: "Another greenhouse concept; definitely a lot more detailed.  I think the idea here was to integrate a basic water desalination system into a greenhouse.  Salty water would be sprayed onto the curtains in the center and allowed to evaporate, while fresh water would condense on the plastic enclosing the greenhouse and drip down into collectors." }
]);

const Solar = (props) => {
  const { imageSync, active } = props;
  const headerPhase = active ? 0 : 1;
  const bodyPhase = active ? 0 : 2;
  return (
    <Page {...props} parent={$work}>
      <h2 className="major">Solar Bio-Reactor</h2>
      <span className="image main javascript-link" onClick={Gallery.openCallback(0)}>
        <ImgHeader fluid phase={headerPhase} imageSync={imageSync} alt="Bioreactor Gallery" />
        <div className="label-right">Gallery</div>
      </span>
      <p>My former employer, Terra Domain, had ambitions beyond oil &amp; gas exploration services and software.  One of these was creating a <Gallery index={0}>hybrid power generator</Gallery> for remote locations with abundant solar energy.  I was tasked to create 3D renders and animations to help explain the concept.</p>
      <p>It involved a centralized solar tower combined with a giant algae tank.  The solar tower would generate electrical power while the algae tank would be used to generate bio-fuel for portable energy.</p>
      <p>However, I had nothing to do with the design of the concept.  I was merely hired to make the pretty pictures.</p>

      <h3>Details</h3>
      <Jump href="https://drive.google.com/open?id=1Yj7qHMptjpBB9uTfc1dLBvsXy34srr_5" icon="none" className="image right">
        <ImgAnimInset fluid phase={bodyPhase} imageSync={imageSync} alt="Bioreactor Flyby Animation" />
        <div className="label-right">Video</div>
      </Jump>
      <p>Pretty much all the modeling in this project was done in <Jump href="https://www.autodesk.com/products/3ds-max/overview">3D Studio Max</Jump>.  It relied heavily on ray-tracing to demonstrate some <Gallery index={2}>interesting ideas involving the mirrors</Gallery>.  They were capable of both focusing on the power-tower and de-focusing to cast softer light on the algae tank.</p>
      <p>These mirrors were <Jump href="https://drive.google.com/open?id=1cCztyiDUtS8LZbiBiOI7l1c81v5QEMcf" icon="movie">all rigged up using inverse-kinematics</Jump> to be realistically aimed in order to bounce light onto their respective targets.  I had to create a control script to <Gallery index={1}>populate the scene with mirrors</Gallery>, as well as aim them according to the current position of the sun in the scene.</p>
      <p>A really fun piece of software called <Jump href="https://www.world-machine.com/">World Machine</Jump> was used to generate a Tibetan-style landscape, which was apparently one of the locations this idea was thought to be practical.  The various texture maps it produced were used to add variation to the terrain; little touches like erosion and snow all played a part.</p>
      <span className="image right javascript-link" onClick={Gallery.openCallback(4)}>
        <ImgFiveInset fluid phase={bodyPhase} imageSync={imageSync} alt="Greenhouse Render" />
        <div className="label-right">Image</div>
      </span>
      <p>There were also ideas to use the installation for food and water production, so a couple of greenhouse designs were also included in the renders.  One greenhouse had <Gallery index={3}>a more mundane design</Gallery> to it, while another was <Gallery index={4}>much more complex</Gallery> with the idea of integrating a water desalination system into it.</p>
      <p>When the videos and images produced were shown in China while searching for investors, I was told that a few attendees asked where this installation was located.  I guess that's some high praise, but I always felt the terrain needed more love before it deserved comments like that.</p>
    </Page>
  );
};

export default Solar;