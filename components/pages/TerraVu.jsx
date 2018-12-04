import Page from "components/Page";
import Jump from "components/Jump";
import Lightbox from "components/Lightbox";
import Work from "./Work";

const $terravu = "terravu";
const { Fragment } = React;
const Gallery = Lightbox.makeGallery($terravu, [
  { i: "static/images/terravu/1.png", d: "TerraVu's minimalist interface gives it an unassuming appearance.  Note the help bar at the bottom guiding the user through the software." },
  { i: "static/images/terravu/2.png", d: "The Dip Changer appears only when it's in a state where it is needed; in this case, when there is an active segment." },
  { i: "static/images/terravu/3.png", d: "The LAS loader is by far the most worked on component of this software.  My latest update to TerraVu was even a small bug-fix to the data-loader." }
]);

export default class TerraVu extends Page($terravu, () => Work) {

  content() {
    return (
      <Fragment>
        <h2 className="major">TerraVu 2</h2>
        <span className="image main javascript-link" onClick={Gallery.openCallback(0)}>
          <img src="/static/images/terravu/header.png" alt="TerraVu Gallery" />
          <div className="label-right">Gallery</div>
        </span>
        <p>TerraVu 2 is a geosteering software package that I first started development on in 2002, programmed in C# using .NET's <Jump href="https://docs.microsoft.com/en-us/dotnet/framework/winforms/">Windows Forms API</Jump>.  It was my very first professional project.  It was used internally by Terra Domain until 2004 or so, when licenses began to be sold to other businesses in the Oil &amp; Gas industry.</p>
        <p>It is not inaccurate to say that for every well that TerraVu was deployed on, millions of dollars of our customer's capital rode on its successful function.  It was a big money-maker for Terra Domain, selling for over $20,000 a license.</p>
        <p>Along with building the application and maintaining its code, I also tended to provide technical support to customers.  I still do work on TerraVu on a contractor basis.</p>

        <h3>Geosteering?</h3>
        <p>This software is used by geologists while drilling horizontal wells deep underground to pin-point their vertical location with respect to known rock layers and markers.  This is done by first drilling a completely vertical well near where the main well is to be drilled, called the &quot;offset well&quot;, and measuring the intensity of gamma-rays emitted by the rocks as the drill bit descends into the earth.</p>
        <p>Generally speaking, the intensity of gamma-rays remain consistent within a rock layer.  This offset well represents a &quot;known state&quot; to which the second, main well is compared.  The productive portion of the main well is drilled side-ways in order to maximize its time in a single layer of the earth, which is why it's often called the &quot;horizontal well&quot;.</p>
        <p>As the horizontal well is being drilled, the gamma-rays being detected are compared to the offset well, then a rough map of the well's position relative to nearby layers can be derived using a bit of geometry.</p>
        <p>Using this knowledge, the well can be steered to remain within a single, target layer; the layer that the geologist believes will produce the most oil or gas!</p>

        <h3>Design &amp; Development</h3>
        <p>I designed TerraVu's user experience in a manner not unlike a computer game's user interface.  As much of the program's functionality was kept contextual.  Interface elements that were not appropriate to the program's current state are hidden, so as not to clutter things or distract the user.  It all gives TerraVu <Gallery index={0}>a very minimalist appearance</Gallery>.</p>
        <p>User friendliness was quite important.  Most functionality could be accessed with a right-click on one of the charts and there was a help bar at the bottom of the window that always guided the user through the software's use.</p>
        <p>TerraVu's users are often roused from sleep at all hours to get an update done while a well is being drilled; this simple, concise design allowed them to get an update done and sent back to the rig in little more than 10 minutes.  We want them to be able to get right back to sleep as soon as possible!</p>
        <p>Perhaps the biggest challenge in producing this software was loading data from standardized LAS format files.  I use the term &quot;standardized&quot; loosely here; before LAS version 3, the standard was not very strongly defined, and what was defined wasn't always adhered to.</p>
        <p>Early on, receiving files from customers that wouldn't load for one reason or another was common.  Over time, <Gallery index={2}>my data loader</Gallery> became more toned, more honed.  It is exceptionally rare for it to fail on a file that isn't inherently flawed in some way.</p>
      </Fragment>
    );
  }

}