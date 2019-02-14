import React from "react";
import GalleryContext from "lib/GalleryContext";
import Gallery from "components/Gallery";
import Page from "components/Page";
import Jump from "components/Jump";

import ImgHeader from "static/images/lithologic-photo/header.png";
import ImgFourInset from "static/images/lithologic-photo/4_inset.jpg";
import ImgFiveInset from "static/images/lithologic-photo/5_inset.jpg";
import { src as $gallery$1 } from "static/images/lithologic-photo/1.png";
import { src as $gallery$2 } from "static/images/lithologic-photo/2.png";
import { src as $gallery$3 } from "static/images/lithologic-photo/3.png";
import { src as $gallery$4 } from "static/images/lithologic-photo/4.jpg";
import { src as $gallery$5 } from "static/images/lithologic-photo/5.jpg";

const gallery = [
  { i: $gallery$1, d: "The administrative interface.  Along with managing users, wells could be shared between organizations." },
  { i: $gallery$2, d: "A couple of example samples in a small example well.  The image processor automatically cropped out and squared off the sample area of the image, ensuring visual consistency between samples." },
  { i: $gallery$3, d: "The diagnostics view of a sample, revealing various properties of the color correction process.  If the process failed, this would provide error information explaining why." },
  { i: $gallery$4, d: "Example of some micro-photography done using version 1 of the special photography plate.  The markers used for image detection have been cropped out." },
  { i: $gallery$5, d: "A render of the plate I designed.  A 3D printing company was used to produce a prototype, which we used internally to test the application." }
];

const LithologicPhoto = (props) => (
  <Page {...props}>
    <GalleryContext.Provider value={gallery}>
      <h2 className="major">Lithologic Photo</h2>
      <Gallery.Span className="image main">
        <ImgHeader alt="Lithologic Photo Gallery" fluid />
        <div className="label-right">Gallery</div>
      </Gallery.Span>
      <p>Lithologic Photo was a big project intended to create a database of rock sample photography, extracting quantifiable information for other uses.  I worked on the front-end of this project while a second programmer specifically handled the back-end.</p>
      <p>The front-end was a monolithic single-page application built in <Jump href="https://coffeescript.org/">CoffeeScript</Jump> and <Jump href="https://www.emberjs.com/">Ember</Jump>, supported by various other technologies such as <Jump href="http://stylus-lang.com/">Stylus</Jump>, <Jump href="http://emblemjs.com/">Emblem</Jump>, and <Jump href="https://getbootstrap.com/">Twitter's Bootstrap</Jump>.  The back-end was built on <Jump href="https://aws.amazon.com/">Amazon's Web Services</Jump>.  The project was pretty mature at the time it was shelved.</p>

      <h3>Purpose &amp; Use</h3>
      <p>The idea with Lithologic Photo was to provide a simple means for mud-loggers to catalog photography of a well's rock samples in as close to real-time as possible and make it dead simple for decision makers to get access to that information.</p>
      <p>To put it more simply, it was an image database system specializing in tiny, ground-up rocks.</p>
      <Gallery.Span className="image right" index={3}>
        <ImgFourInset alt="Micro-Photography Sample" fluid />
        <div className="label-right">Image</div>
      </Gallery.Span>
      <p>The photography was to be done using a special photography plate; simple image detection was used to pin-point color swatches on the plate to use as guides in the color correction.  Combined with Lithologic, a standardized, high-quality description of the rock would also be provided.</p>
      <p>The hope was this information would be quantitative enough to act as additional data to improve geosteering, and this project would naturally have lead into TerraVu 3.</p>

      <h3>Design &amp; Development</h3>
      <p>At the time the project was getting off the ground, Microsoft was showing off their &quot;Metro&quot; design language, later renamed to the way lamer &quot;MDL&quot;.  Since I found its simplistic design with hard corners and bold colors rather appealing and easy to work with, I adopted it for <Gallery index={0}>this project</Gallery>.</p>
      <p>In all honesty, the programming was the easy part.  The API provided by my back-end developer just worked and flowed beautifully into the front-end.  It all worked exactly as I needed it and Ember interacted with it swimmingly.  Aside from a few performance problems concerning rendering lists of thousands of samples, it was all smooth on the programming front.</p>
      <p>No, the hard part was all the stuff that <em>wasn't</em> programming.</p>
      <Gallery.Span className="image right" index={4}>
        <ImgFiveInset alt="Plate Image" fluid />
        <div className="label-right">Image</div>
      </Gallery.Span>
      <p>As I said before, the software relied on the photography being done on special plates.  These plates needed to be designed and manufactured, so I had to break out a copy of <Jump href="https://www.autodesk.com/products/inventor/overview">Autodesk Inventor</Jump> and produce a CAD drawing which could be 3D printed for testing and later used in mass-production.</p>
      <p>Along with that, I also had to produce the graphic with the color swatches to affix to the plate and make it microscope-sized.  This required the services of, so far as we know, the only color micro-film printing company that exists in the world.</p>
      <p>Finding them was hard; coordinating with them across the world was harder; not losing the microfilm we put considerable effort into purchasing turned out to be impossible.</p>
      <p>It was not me that lost it though, just to be clear.  Someone else was handling the actual manufacture of the plates and they had a hard time keeping track of that tiny black box worth $1000  ...or the other one we got when we ordered prints of the version 2 graphic.</p>
      <p>This, and other problems like it, eventually took their toll on the project.</p>
    </GalleryContext.Provider>
  </Page>
);

export default LithologicPhoto;