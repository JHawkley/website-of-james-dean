import Page from "components/Page";
import Jump from "components/Jump";
import Lightbox from "components/Lightbox";
import Work from "./Work";

const $lithologic = "lithologic";
const { Fragment } = React;
const Gallery = Lightbox.makeGallery($lithologic, [
  { i: "static/images/lithologic/1.png", d: "A video plays in the screenshot above, demonstrating a test that can determine if a sandstone sample's cementation is calcium-based.  Above the video, the dictionary defines the selected term; below it, a mud-logger focused explanation is provided." },
  { i: "static/images/lithologic/2.png", d: "Lithologic features many niceties, such as color swatches or a magnifier to take a closer look at a library photograph." },
  { i: "static/images/lithologic/3.png", d: "Lithologic's original design concept (top) compared to the final product (bottom)." }
]);

export default class Lithologic extends Page($lithologic, Work) {

  content() {
    return (
      <Fragment>
        <h2 className="major">Lithologic</h2>
        <span className="image main javascript-link" onClick={Gallery.openCallback(0)}>
          <img src="/static/images/lithologic/header.png" alt="Lithologic Gallery" />
          <div className="label-right">Gallery</div>
        </span>
        <p>Lithologic is a tool to assist mud-loggers in their task of producing rock descriptions.  It was my second major application coded in C# using .NET's <Jump href="https://docs.microsoft.com/en-us/dotnet/framework/winforms/" target="_blank">Windows Forms API</Jump>.  I believe this project started in 2011 when someone came to us with the idea and was seeking a software developer to make it a reality.</p>

        <h3>Purpose &amp; Use</h3>
        <p>Lithologic has all the cold, focused functionality of <Gallery index={0}>a calculator strapped to a digital encyclopedia</Gallery>.  It is given a very flat layout and presentation, intended to allow its users to very quickly find the option they need and input it.</p>
        <p>Mud-loggers would typically use it while peering into a microscope at rock shavings recovered from the depths of a well, and then make selections in the program to produce a description of the rock they were examining.  It had profiles for several kinds of rocks, guiding them through to ensure they hit all the important points.</p>
        <p>To help them along, the software also featured the entire Dictionary of Geological Terms and almost 1 gigabyte of photos and movies to assist in identifying and explaining features of the rocks.  Naturally, this also made Lithologic an excellent tool for training.</p>
        <p>Lithologic was intended to bring consistency to an industry that had little.  Rock descriptions were highly subjective and the quality of a description varied wildly from one logger to another, including the actual abbreviations they used to represent different rock properties in the description.</p>
        <p>It was pretty much impossible to use rock descriptions in any kind of quantifiable way thanks to this terrible consistency.  They couldn't be searched, sorted, correlated, or subjected to most any kind of computerization.  Lithologic hoped to create a shift in the industry to change that.</p>

        <h3>Design &amp; Development</h3>
        <p>Lithologic had a lot of parts to it; far more than just simple programming.</p>
        <p>Along with building the application itself, I also had to produce tools to assist other teams in assembling and collating the massive library of photographs and videos.  They used these tools while doing the photography to keep track of their work: what they were photographing, who was photographing, the conditions of the microscope, etc.</p>
        <p>Furthermore, there was the matter of actually assembling the library itself.  The photographs had to be associated to geological terms from the dictionary and then user-friendly HTML files assembled and exported into as neat a package as I could manage.  This library also needed to be capable of being updated as well.</p>
        <p>As for the design of the software itself, I was given a complete design document and tasked to follow it.  The final product pretty closely resembles <Gallery index={2}>the original design document</Gallery>, with only a few minor differences.</p>
      </Fragment>
    );
  }

}