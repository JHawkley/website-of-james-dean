import React from "react";
import GalleryContext from "lib/GalleryContext";
import Gallery from "components/Gallery";
import Page from "components/Page";
import Jump from "components/Jump";

import ImgHeader from "static/images/3drenders/br_header.jpg";
import ImgAnimInset from "static/images/3drenders/br_anim_inset.jpg";
import ImgFiveInset from "static/images/3drenders/br5_inset.jpg";
import { src as $gallery$br1 } from "static/images/3drenders/br1.jpg";
import { src as $gallery$br2 } from "static/images/3drenders/br2.jpg";
import { src as $gallery$br3 } from "static/images/3drenders/br3.jpg";
import { src as $gallery$br4 } from "static/images/3drenders/br4.jpg";
import { src as $gallery$br5 } from "static/images/3drenders/br5.png";

import ToWork from "pages/work/index?jump";

const gallery = [
  { i: $gallery$br1, d: "A glory shot of the solar bio-reactor with a sprawling Tibet-inspired mountain landscape behind it." },
  { i: $gallery$br2, d: "An overview of the rendered installation.  The control script had a low chance to keep some of the mirrors unaimed so as to make them appear as if they were being cleaned and maintained." },
  { i: $gallery$br3, d: "A cutaway of a mirror, showing its structure.  A thin membrane was intended to be flexed by controlling the air pressure inside it, which would deform the mirror and control its focus." },
  { i: $gallery$br4, d: "Along with the algae, more mundane farming could also potentially be done.  These simple greenhouses would allow diffuse light inside, keeping it bright and balmy inside for plants." },
  { i: $gallery$br5, d: "Another greenhouse concept; definitely a lot more detailed.  I think the idea here was to integrate a basic water desalination system into a greenhouse.  Salty water would be sprayed onto the curtains in the center and allowed to evaporate, while fresh water would condense on the plastic enclosing the greenhouse and drip down into collectors." }
];

const SolarPage = (props) => (
  <Page {...props} navLeft={ToWork}>
    <GalleryContext.Provider value={gallery}>
      <h2 className="major">Solar Bio-Reactor</h2>
      <Gallery.Span className="image main">
        <ImgHeader alt="Bioreactor Gallery" fluid />
        <div className="label-right">Gallery</div>
      </Gallery.Span>
      <p>My former employer, Terra Domain, had ambitions beyond oil &amp; gas exploration services and software.  One of these was creating a <Gallery index={0}>hybrid power generator</Gallery> for remote locations with abundant solar energy.  I was tasked to create 3D renders and animations to help explain the concept.</p>
      <p>It involved a centralized solar tower combined with a giant algae tank.  The solar tower would generate electrical power while the algae tank would be used to generate bio-fuel for portable energy.</p>
      <p>However, I had nothing to do with the design of the concept.  I was merely hired to make the pretty pictures.</p>

      <h3>Details</h3>
      <Jump href="https://drive.google.com/open?id=1Yj7qHMptjpBB9uTfc1dLBvsXy34srr_5" icon="none" className="image right">
        <ImgAnimInset alt="Bioreactor Flyby Animation" fluid />
        <div className="label-right">Video</div>
      </Jump>
      <p>Pretty much all the modeling in this project was done in <Jump href="https://www.autodesk.com/products/3ds-max/overview">3D Studio Max</Jump>.  It relied heavily on ray-tracing to demonstrate some <Gallery index={2}>interesting ideas involving the mirrors</Gallery>.  They were capable of both focusing on the power-tower and de-focusing to cast softer light on the algae tank.</p>
      <p>These mirrors were <Jump href="https://drive.google.com/open?id=1cCztyiDUtS8LZbiBiOI7l1c81v5QEMcf" icon="movie">all rigged up using inverse-kinematics</Jump> to be realistically aimed in order to bounce light onto their respective targets.  I had to create a control script to <Gallery index={1}>populate the scene with mirrors</Gallery>, as well as aim them according to the current position of the sun in the scene.</p>
      <p>A really fun piece of software called <Jump href="https://www.world-machine.com/">World Machine</Jump> was used to generate a Tibetan-style landscape, which was apparently one of the locations this idea was thought to be practical.  The various texture maps it produced were used to add variation to the terrain; little touches like erosion and snow all played a part.</p>
      <Gallery.Span className="image right" index={4}>
        <ImgFiveInset alt="Greenhouse Render" fluid />
        <div className="label-right">Image</div>
      </Gallery.Span>
      <p>There were also ideas to use the installation for food and water production, so a couple of greenhouse designs were also included in the renders.  One greenhouse had <Gallery index={3}>a more mundane design</Gallery> to it, while another was <Gallery index={4}>much more complex</Gallery> with the idea of integrating a water desalination system into it.</p>
      <p>When the videos and images produced were shown in China while searching for investors, I was told that a few attendees asked where this installation was located.  I guess that's some high praise, but I always felt the terrain needed more love before it deserved comments like that.</p>
    </GalleryContext.Provider>
  </Page>
);

export default SolarPage;