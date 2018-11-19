import PropTypes from "prop-types";
import Jump from "./Jump";
import Page from "./Page";
import Nate from "./Nate";
import Lightbox from "react-image-lightbox";
import ContactForm from "./ContactForm";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faLinkedin from "@fortawesome/fontawesome-free-brands/faLinkedin";
import faGithub from "@fortawesome/fontawesome-free-brands/faGithub";
import { faImages } from "@fortawesome/free-solid-svg-icons";

class Main extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      lightboxOpen: false,
      lightboxGallery: "",
      lightboxIndex: 0
    };
    this.galleries = {
      "terravu": [
        { i: "static/images/terravu/1.png", d: "TerraVu's minimalist interface gives it an unassuming appearance.  Note the help bar at the bottom guiding the user through the software." },
        { i: "static/images/terravu/2.png", d: "The Dip Changer appears only when it's in a state where it is needed; in this case, when there is an active segment." },
        { i: "static/images/terravu/3.png", d: "The LAS loader is by far the most worked on component of this software.  My latest update to TerraVu was even a small bug-fix to the data-loader." }
      ],
      "lithologic": [
        { i: "static/images/lithologic/1.png", d: "A video plays in the screenshot above, demonstrating a test that can determine if a sandstone sample's cementation is calcium-based.  Above the video, the dictionary defines the selected term; below it, a mud-logger focused explanation is provided." },
        { i: "static/images/lithologic/2.png", d: "Lithologic features many niceties, such as color swatches or a magnifier to take a closer look at a library photograph." },
        { i: "static/images/lithologic/3.png", d: "Lithologic's original design concept (top) compared to the final product (bottom)." }
      ],
      "lithphoto": [
        { i: "static/images/lithologic-photo/1.png", d: "The administrative interface.  Along with managing users, wells could be shared between organizations." },
        { i: "static/images/lithologic-photo/2.png", d: "A couple of example samples in a small example well.  The image processor automatically cropped out and squared off the sample area of the image, ensuring visual consistency between samples." },
        { i: "static/images/lithologic-photo/3.png", d: "The diagnostics view of a sample, revealing various properties of the color correction process.  If the process failed, this would provide error information explaining why." },
        { i: "static/images/lithologic-photo/4.jpg", d: "Example of some micro-photography done using version 1 of the special photography plate.  The markers used for image detection have been cropped out." },
        { i: "static/images/lithologic-photo/5.jpg", d: "A render of the plate I designed.  A 3D printing company was used to produce a prototype, which we used internally to test the application." }
      ],
      "solar": [
        { i: "static/images/3drenders/br1.jpg", d: "A glory shot of the solar bio-reactor with a sprawling Tibet-inspired mountain landscape behind it." },
        { i: "static/images/3drenders/br2.jpg", d: "An overview of the rendered installation.  The control script had a low chance to keep some of the mirrors unaimed so as to make them appear as if they were being cleaned and maintained." },
        { i: "static/images/3drenders/br3.jpg", d: "A cutaway of a mirror, showing its structure.  A thin membrane was intended to be flexed by controlling the air pressure inside it, which would deform the mirror and control its focus." },
        { i: "static/images/3drenders/br4.jpg", d: "Along with the algae, more mundane farming could also potentially be done.  These simple greenhouses would allow diffuse light inside, keeping it bright and balmy inside for plants." },
        { i: "static/images/3drenders/br5.png", d: "Another greenhouse concept; definitely a lot more detailed.  I think the idea here was to integrate a basic water desalination system into a greenhouse.  Salty water would be sprayed onto the curtains in the center and allowed to evaporate, while fresh water would condense on the plastic enclosing the greenhouse and drip down into collectors." }
      ],
      "threedee": [
        { i: "static/images/3drenders/landscape1.jpg", d: "The far LOD portion of the blackhole strike scene.  The procedural generation includes both trees and buildings of a small city far in the distance." },
        { i: "static/images/3drenders/landscape2.jpg", d: "The unfinished near LOD portion of the blackhole strike scene.  These trees were hard to render; I believe I was searching for ways to make them render faster, while still being high quality for the near shot.  These would have burst into flames the moment of the bright blast beyond the distant mountain." },
        { i: "static/images/3drenders/icecave.jpg", d: "Everyone tells me this render would be right at home in a Myst-like game.  The internal reflections from the ice and the metal are quite neat.  I really love the atmosphere here." },
      ],
      "nate": [
        { i: "static/images/nate-game/1.gif", d: "Nate jumps about in the test level.  Unfortunately, the build I have right now has shooting disabled; I believe I was reworking it at the time.  The gnarly design of the final room was intended to help work out issues with auto-tiling." },
        { i: "static/images/nate-game/2.jpg", d: "Chie's kind-of-cute appearance conceals the frightening power she has at her command.  This artwork was done by my partner on this project, Tderek99." },
        { i: "static/images/nate-game/3.jpg", d: "These early concept sketches of enemies show that Chie had some fun looking playmates for her \"pet\" in mind.  This artwork was done by my partner on this project, Tderek99." }
      ]
    };
  }

  componentDidUpdate(prevProps) {
    // In the case the route begins to transition, close the lightbox.
    if (this.props.articleTimeout !== prevProps.articleTimeout)
      if (!this.props.articleTimeout && this.state.lightboxOpen)
        this.setState({ lightboxOpen: false });
  }
  
  render() {
    const { article, timeout, articleTimeout } = this.props;
    
    const workItem = (description, title, article) => (
      <Jump href={`#${article}`} className="work-item">
        <dl><dt>{description}</dt><dd>{title}</dd></dl>
      </Jump>
    );
    
    const klass = articleTimeout ? "article-timeout" : null;
    
    const lightbox = () => {
      const { lightboxOpen, lightboxIndex, lightboxGallery } = this.state;
      if (!lightboxOpen) return null;
      const images = this.galleries[lightboxGallery];
      if (!images) return null;
      const image = (index) => (typeof images[index] === "object") ? images[index].i : images[index];
      const desc = (index) => (typeof images[index] === "object") ? (<p>{images[index].d}</p>) : null;
      return (
        <Lightbox
          mainSrc={image(lightboxIndex)}
          nextSrc={image((lightboxIndex + 1) % images.length)}
          prevSrc={image((lightboxIndex + images.length - 1) % images.length)}
          imageCaption={desc(lightboxIndex)}
          onCloseRequest={() => this.setState({ lightboxOpen: false })}
          onMovePrevRequest={() =>
            this.setState({
              lightboxIndex: (lightboxIndex + images.length - 1) % images.length
            })
          }
          onMoveNextRequest={() =>
            this.setState({
              lightboxIndex: (lightboxIndex + 1) % images.length
            })
          }
          animationOnKeyInput={true}
          enableZoom={false}
        />
      );
    };

    const lightboxOpener = (gallery, i = 0) => () => {
      const images = this.galleries[gallery];
      if (i < 0 || !images || i >= images.length) i = 0;
      this.setState({ lightboxOpen: true, lightboxGallery: gallery, lightboxIndex: i });
    };

    const Gallery = ({target, children, index = 0}) => {
      return (
        <a href="javascript:;" onClick={lightboxOpener(target, index)}>
          {children}
          <span style={{"whiteSpace": "nowrap"}}>
            &nbsp;
            <FontAwesomeIcon icon={faImages} size="sm" />
            <span style={{"width": "0", "display": "inline-block"}}>&nbsp;</span>
          </span>
        </a>
      );
    };

    return (
      <div id="main" className={klass} style={{display: timeout ? "flex" : "none"}}>

        <Page id="intro" article={article}>
          <h2 className="major">Intro</h2>
          <span className="image main"><img src="/static/images/pic01.jpg" alt="" /></span>
          <p>Welcome!  I'm James!  I'm a software developer from Texas, USA.</p>
          <p>I have been working professionally since 2002.  In that time, I've put together and maintained three big applications for my former employer.  You can read all about it in the <Jump href="./#work">work section of the site</Jump>.</p>
          <p>My first serious programming was in C#, which I primarily used until 2010, when I decided to shift much of my focus on to JavaScript and related technologies.  I consider web services and applications to pretty much be the future of end-user software, a universal platform that spans all devices across the planet.</p>
          <p>Though, it probably won't realize that potential for a while longer.  Nevertheless, it surely will be some day and in some form and I intend to help make it happen.</p>
          <p>I primarily consider myself a front-end and application developer; it's certainly where I've had most of my success.  User experiences that I design tend to be highly contextual and minimally cluttered.  If it isn't important to the user at the time, it should be given little to no screen space.  I also like to keep things clear, so one part of the UI is easily distinguishable from another part.</p>
          <p>I've also always had the dream to create games since I was in high school, which is where most of my spare time goes.  I have mostly been studying the technical aspects of game development, rather than building complete games.  The systems and algorithms that drive games fascinate me.</p>
          <p>I just have not yet gotten together with like-minded individuals who can handle the more artistic side of things and tough it out with me until the end.</p>
          <p>If you are such a person, please have a look at my <Jump href="./#work">game-specific works here</Jump>, toward the bottom of the page, to help you determine if I might be an asset to your project.</p>
          <p>A table of my skills is below:</p>
          <table>
            <thead>
              <tr>
                <td>Skill</td>
                <td>Description</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Confident Programming Languages</td>
                <td><strong>C#</strong>, <strong>Scala</strong> (ScalaJS), <strong>HTML</strong>, <strong>CSS</strong> (SASS, Stylus), <strong>JavaScript</strong> (CoffeeScript, TypeScript)</td>
              </tr>
              <tr>
                <td>Frameworks</td>
                <td><strong>.NET Framework</strong>, <strong>React</strong> (NextJS), <strong>Ember</strong>, formerly well-acquainted with <strong>Angular</strong>, formerly well-acquainted with <strong>Backbone</strong></td>
              </tr>
              <tr>
                <td>Build Tools</td>
                <td><strong>Visual Studio Projects</strong>, <strong>Grunt</strong>, <strong>Babel</strong>, basic competency with <strong>Scala Build Tool</strong></td>
              </tr>
              <tr>
                <td>Testing Frameworks</td>
                <td><strong>Jasmine</strong></td>
              </tr>
              <tr>
                <td>Source Control</td>
                <td>Basic competency with <strong>Git</strong>, <strong>GitHub</strong></td>
              </tr>
              <tr>
                <td>IDEs</td>
                <td><strong>Visual Studio 20XX</strong>, <strong>Visual Studio Code</strong>, <strong>IntelliJ IDEA</strong></td>
              </tr>
              <tr>
                <td>3D Modeling Software</td>
                <td>Basic competency with <strong>Autodesk Inventor</strong>, formerly well-acquainted with <strong>3D Studio Max</strong></td>
              </tr>
              <tr>
                <td>Other Software</td>
                <td><strong>Office-Related Software</strong> (such as Word, Excel), basic competency with <strong>Image Manipulation Software</strong> (such as Photoshop, The GIMP, Inkscape)</td>
              </tr>
            </tbody>
          </table>
        </Page>

        <Page id="work" article={article}>
          <h2 className="major">Work</h2>
          <span className="image main"><img src="/static/images/pic_work.png" alt="" /></span>
          <p>Much of my work was done at my previous employer, <strong><Jump href="http://www.terradomain.us/" target="_blank">TerraDom Corporation</Jump></strong> (formerly Terra Domain Consulting).  My best and biggest software projects were done there.  You can read about them from the selection below:</p>
          {workItem("Enterprise Geosteering", "TerraVu 2", "terravu")}
          {workItem("Mud-Logger's Tool", "Lithologic", "lithologic")}
          {workItem("Rock Photography Database", "Lithologic Photo", "lithphoto")}
          <p>Along with software development, I've also done work in <strong>3D and animation</strong> for both personal and professional reasons.  I feel my ability here is still quite amateurish and isn't useful beyond architectural-style renders or placeholder assets, so I don't count it as one of my primary skills, but I suspect some of you would appreciate knowing I can handle myself in 3D modeling software.</p>
          {workItem("Bright Idea", "Solar Bio-Reactor", "solar")}
          {workItem("More Modeling", "Miscellaneous 3D", "threedee")}
          <p>I also enjoy taking on <strong>personal projects</strong>, usually to help me learn new things and expand my horizons.  A selection of my more worth-while projects, largely centered around game development, appear below:</p>
          {workItem("Abducted Dog Adventure", "Nate Game", "nate")}
          {workItem("My Time Invested", "Misc Programming", "miscprogramming")}
        </Page>
        
        <Page id="terravu" parent="work" article={article}>
          <h2 className="major">TerraVu 2</h2>
          <span className="image main javascript-link" onClick={lightboxOpener("terravu")}>
            <img src="/static/images/terravu/header.png" alt="TerraVu Gallery" />
            <div className="label-right">Gallery</div>
          </span>
          <p>TerraVu 2 is a geosteering software package that I first started development on in 2002, programmed in C# using .NET's <Jump href="https://docs.microsoft.com/en-us/dotnet/framework/winforms/" target="_blank">Windows Forms API</Jump>.  It was my very first professional project.  It was used internally by Terra Domain until 2004 or so, when licenses began to be sold to other businesses in the Oil &amp; Gas industry.</p>
          <p>It is not inaccurate to say that for every well that TerraVu was deployed on, millions of dollars of our customer's capital rode on its successful function.  It was a big money-maker for Terra Domain, selling for over $20,000 a license.</p>
          <p>Along with building the application and maintaining its code, I also tended to provide technical support to customers.  I still do work on TerraVu on a contractor basis.</p>

          <h3>Geosteering?</h3>
          <p>This software is used by geologists while drilling horizontal wells deep underground to pin-point their vertical location with respect to known rock layers and markers.  This is done by first drilling a completely vertical well near where the main well is to be drilled, called the &quot;offset well&quot;, and measuring the intensity of gamma-rays emitted by the rocks as the drill bit descends into the earth.</p>
          <p>Generally speaking, the intensity of gamma-rays remain consistent within a rock layer.  This offset well represents a &quot;known state&quot; to which the second, main well is compared.  The productive portion of the main well is drilled side-ways in order to maximize its time in a single layer of the earth, which is why it's often called the &quot;horizontal well&quot;.</p>
          <p>As the horizontal well is being drilled, the gamma-rays being detected are compared to the offset well, then a rough map of the well's position relative to nearby layers can be derived using a bit of geometry.</p>
          <p>Using this knowledge, the well can be steered to remain within a single, target layer; the layer that the geologist believes will produce the most oil or gas!</p>

          <h3>Design &amp; Development</h3>
          <p>I designed TerraVu's user experience in a manner not unlike a computer game's user interface.  As much of the program's functionality was kept contextual.  Interface elements that were not appropriate to the program's current state are hidden, so as not to clutter things or distract the user.  It all gives TerraVu <Gallery  target="terravu" index={0}>a very minimalist appearance</Gallery>.</p>
          <p>User friendliness was quite important.  Most functionality could be accessed with a right-click on one of the charts and there was a help bar at the bottom of the window that always guided the user through the software's use.</p>
          <p>TerraVu's users are often roused from sleep at all hours to get an update done while a well is being drilled; this simple, concise design allowed them to get an update done and sent back to the rig in little more than 10 minutes.  We want them to be able to get right back to sleep as soon as possible!</p>
          <p>Perhaps the biggest challenge in producing this software was loading data from standardized LAS format files.  I use the term &quot;standardized&quot; loosely here; before LAS version 3, the standard was not very strongly defined, and what was defined wasn't always adhered to.</p>
          <p>Early on, receiving files from customers that wouldn't load for one reason or another was common.  Over time, <Gallery target="terravu" index={2}>my data loader</Gallery> became more toned, more honed.  Now it is as experienced and battle-hardened as Geralt from The Witcher series.</p>
          <p>Just try and kill it.  I dare ya.</p>
        </Page>
        
        <Page id="lithologic" parent="work" article={article}>
          <h2 className="major">Lithologic</h2>
          <span className="image main javascript-link" onClick={lightboxOpener("lithologic")}>
            <img src="/static/images/lithologic/header.png" alt="Lithologic Gallery" />
            <div className="label-right">Gallery</div>
          </span>
          <p>Lithologic is a tool to assist mud-loggers in their task of producing rock descriptions.  It was my second major application coded in C# using .NET's <Jump href="https://docs.microsoft.com/en-us/dotnet/framework/winforms/" target="_blank">Windows Forms API</Jump>.  I believe this project started in 2011 when someone came to us with the idea and was seeking a software developer to make it a reality.</p>

          <h3>Purpose &amp; Use</h3>
          <p>Lithologic has all the cold, focused functionality of <Gallery target="lithologic" index={0}>a calculator strapped to a digital encyclopedia</Gallery>.  It is given a very flat layout and presentation, intended to allow its users to very quickly find the option they need and input it.</p>
          <p>Mud-loggers would typically use it while peering into a microscope at rock shavings recovered from the depths of a well, and then make selections in the program to produce a description of the rock they were examining.  It had profiles for several kinds of rocks, guiding them through to ensure they hit all the important points.</p>
          <p>To help them along, the software also featured the entire Dictionary of Geological Terms and almost 1 gigabyte of photos and movies to assist in identifying and explaining features of the rocks.  Naturally, this also made Lithologic an excellent tool for training.</p>
          <p>Lithologic was intended to bring consistency to an industry that had little.  Rock descriptions were highly subjective and the quality of a description varied wildly from one logger to another, including the actual abbreviations they used to represent different rock properties in the description.</p>
          <p>It was pretty much impossible to use rock descriptions in any kind of quantifiable way thanks to this terrible consistency.  They couldn't be searched, sorted, correlated, or subjected to most any kind of computerization.  Lithologic hoped to create a shift in the industry to change that.</p>

          <h3>Design &amp; Development</h3>
          <p>Lithologic had a lot of parts to it; far more than just simple programming.</p>
          <p>Along with building the application itself, I also had to produce tools to assist other teams in assembling and collating the massive library of photographs and videos.  They used these tools while doing the photography to keep track of their work: what they were photographing, who was photographing, the conditions of the microscope, etc.</p>
          <p>Furthermore, there was the matter of actually assembling the library itself.  The photographs had to be associated to geological terms from the dictionary and then user-friendly HTML files assembled and exported into as neat a package as I could manage.  This library also needed to be capable of being updated as well.</p>
          <p>As for the design of the software itself, I was given a complete design document and tasked to follow it.  The final product pretty closely resembles <Gallery target="lithologic" index={2}>the original design document</Gallery>, with only a few minor differences.</p>
        </Page>

        <Page id="lithphoto" parent="work" article={article}>
          <h2 className="major">Lithologic Photo</h2>
          <span className="image main javascript-link" onClick={lightboxOpener("lithphoto")}>
            <img src="/static/images/lithologic-photo/header.png" alt="Lithologic Photo Gallery" />
            <div className="label-right">Gallery</div>
          </span>
          <p>Lithologic Photo was a big project intended to create a database of rock sample photography, extracting quantifiable information for other uses.  I worked on the front-end of this project while a second programmer specifically handled the back-end.</p>
          <p>The front-end was a monolithic single-page application built in <Jump href="https://coffeescript.org/" target="_blank">CoffeeScript</Jump> and <Jump href="https://www.emberjs.com/" target="_blank">Ember</Jump>, supported by various other technologies such as <Jump href="http://stylus-lang.com/" target="_blank">Stylus</Jump>, <Jump href="http://emblemjs.com/" target="_blank">Emblem</Jump>, and <Jump href="https://getbootstrap.com/" target="_blank">Twitter's Bootstrap</Jump>.  The back-end was built on <Jump href="https://aws.amazon.com/" target="_blank">Amazon's Web Services</Jump>.  The project was pretty mature at the time it was shelved.</p>

          <h3>Purpose &amp; Use</h3>
          <p>The idea with Lithologic Photo was to provide a simple means for mud-loggers to catalog photography of a well's rock samples in as close to real-time as possible and make it dead simple for decision makers to get access to that information.</p>
          <p>To put it more simply, it was an image database system specializing in tiny, ground-up rocks.</p>
          <span className="image right javascript-link" onClick={lightboxOpener("lithphoto", 3)}>
            <img src="/static/images/lithologic-photo/4_inset.jpg" alt="Micro-Photography Sample" />
            <div className="label-right">Image</div>
          </span>
          <p>The photography was to be done using a special photography plate; simple image detection was used to pin-point color swatches on the plate to use as guides in the color correction.  Combined with Lithologic, a standardized, high-quality description of the rock would also be provided.</p>
          <p>The hope was this information would be quantitative enough to act as additional data to improve geosteering, and this project would naturally have lead into TerraVu 3.</p>

          <h3>Design &amp; Development</h3>
          <p>At the time the project was getting off the ground, Microsoft was showing off their &quot;Metro&quot; design language, later renamed to the way lamer &quot;MDL&quot;.  Since I found its simplistic design with hard corners and bold colors rather appealing and easy to work with, I adopted it for <Gallery target="lithphoto" index={0}>this project</Gallery>.</p>
          <p>In all honesty, the programming was the easy part.  The API provided by my back-end developer just worked and flowed beautifully into the front-end.  It all worked exactly as I needed it and Ember interacted with it swimmingly.  Aside from a few performance problems concerning rendering lists of thousands of samples, it was all smooth on the programming front.</p>
          <p>No, the hard part was all the stuff that <em>wasn't</em> programming.</p>
          <span className="image right javascript-link" onClick={lightboxOpener("lithphoto", 4)}>
            <img src="/static/images/lithologic-photo/5_inset.jpg" alt="Plate Image" />
            <div className="label-right">Image</div>
          </span>
          <p>As I said before, the software relied on the photography being done on special plates.  These plates needed to be designed and manufactured, so I had to break out a copy of <Jump href="https://www.autodesk.com/products/inventor/overview" target="_blank">Autodesk Inventor</Jump> and produce a CAD drawing which could be 3D printed for testing and later used in mass-production.</p>
          <p>Along with that, I also had to produce the graphic with the color swatches to affix to the plate and make it microscope-sized.  This required the services of, so far as we know, the only color micro-film printing company that exists in the world.</p>
          <p>Finding them was hard; coordinating with them across the world was harder; not losing the microfilm we put considerable effort into purchasing turned out to be impossible.</p>
          <p>It was not me that lost it though, just to be clear.  Someone else was handling the actual manufacture of the plates and they had a hard time keeping track of that tiny black box worth $1000  ...or the other one we got when we ordered prints of the version 2 graphic.</p>
          <p>This, and other problems like it, eventually took their toll on the project.</p>
        </Page>

        <Page id="solar" parent="work" article={article}>
          <h2 className="major">Solar Bio-Reactor</h2>
          <span className="image main javascript-link" onClick={lightboxOpener("solar")}>
            <img src="/static/images/3drenders/br_header.jpg" alt="Bioreactor Gallery" />
            <div className="label-right">Gallery</div>
          </span>
          <p>My former employer, Terra Domain, had ambitions beyond oil &amp; gas exploration services and software.  One of these was creating a <Gallery target="solar" index={0}>hybrid power generator</Gallery> for remote locations with abundant solar energy.  I was tasked to create 3D renders and animations to help explain the concept.</p>
          <p>It involved a centralized solar tower combined with a giant algae tank.  The solar tower would generate electrical power while the algae tank would be used to generate bio-fuel for portable energy.</p>
          <p>However, I had nothing to do with the design of the concept.  I was merely hired to make the pretty pictures.</p>

          <h3>Details</h3>
          <Jump href="https://drive.google.com/open?id=1Yj7qHMptjpBB9uTfc1dLBvsXy34srr_5" target="_blank" icon="none" className="image right">
            <img src="/static/images/3drenders/br_anim_inset.jpg" alt="Bioreactor Flyby Animation" />
            <div className="label-right">Video</div>
          </Jump>
          <p>Pretty much all the modeling in this project was done in <Jump href="https://www.autodesk.com/products/3ds-max/overview" target="_blank">3D Studio Max</Jump>.  It relied heavily on ray-tracing to demonstrate some <Gallery target="solar" index={2}>interesting ideas involving the mirrors</Gallery>.  They were capable of both focusing on the power-tower and de-focusing to cast softer light on the algae tank.</p>
          <p>These mirrors were <Jump icon="movie" href="https://drive.google.com/open?id=1cCztyiDUtS8LZbiBiOI7l1c81v5QEMcf" target="_blank">all rigged up using inverse-kinematics</Jump> to be realistically aimed in order to bounce light onto their respective targets.  I had to create a control script to <Gallery target="solar" index={1}>populate the scene with mirrors</Gallery>, as well as aim them according to the current position of the sun in the scene.</p>
          <p>A really fun piece of software called <Jump href="https://www.world-machine.com/" target="_blank">World Machine</Jump> was used to generate a Tibetan-style landscape, which was apparently one of the locations this idea was thought to be practical.  The various texture maps it produced were used to add variation to the terrain; little touches like erosion and snow all played a part.</p>
          <span className="image right javascript-link" onClick={lightboxOpener("solar", 4)}>
            <img src="/static/images/3drenders/br5_inset.jpg" alt="Greenhouse Render" />
            <div className="label-right">Image</div>
          </span>
          <p>There were also ideas to use the installation for food and water production, so a couple of greenhouse designs were also included in the renders.  One greenhouse had <Gallery target="solar" index={3}>a more mundane design</Gallery> to it, while another was <Gallery target="solar" index={4}>much more complex</Gallery> with the idea of integrating a water desalination system into it.</p>
          <p>When the videos and images produced were shown in China while searching for investors, I was told that a few attendees asked where this installation was located.  I guess that's some high praise, but I always felt the terrain needed more love before it deserved comments like that.</p>
        </Page>

        <Page id="threedee" parent="work" article={article}>
          <h2 className="major">Miscellaneous 3D</h2>
          <span className="image main javascript-link" onClick={lightboxOpener("threedee")}>
            <img src="/static/images/3drenders/misc_header.jpg" alt="Misc 3D Gallery" />
            <div className="label-right">Gallery</div>
          </span>
          <p>Along with the Solar Bio-Reactor, I had a few other 3D projects as well.</p>

          <h3>Geo-Steering Concepts</h3>
          <p>Some of my first animations were to help explain geo-steering and related concepts to others.  These started as really quite poorly done Flash animations (which I'm not gonna be showing here), but I eventually got my hands on a copy of 3D Studio Max and did...  better?</p>
          <span className="span-across align-center">
            <Jump href="https://drive.google.com/open?id=15BXfXkI4uh-wPY9NWNtcDm-uPQQHAJ0x" target="_blank" icon="none" className="image contain">
              <img src="/static/images/3drenders/geo_bar.jpg" alt="Geo-Steering Correlation Animation" />
              <div className="label-right">Video</div>
            </Jump>
          </span>
          <p>Anyways, the one above is a basic explanation of how the offset well relates to the horizontal well, showing the similarities between the two wells' gamma-ray logs.  A correlation is shown explicitly and then a few more later in.</p>
          <span className="span-across align-center">
            <Jump href="https://drive.google.com/open?id=15qAXg7Y2k-j4UGEe3tKq12YFyqN-tBiQ" target="_blank" icon="none" className="image contain">
              <img src="/static/images/3drenders/oilsands_bar.jpg" alt="Oil Sands Animation" />
              <div className="label-right">Video</div>
            </Jump>
          </span>
          <p>This animation, I believe, was intended to show how horizontal drilling could be effective at hitting oil sands.  I seem to recall that you could use steam to release the oil that was trapped in the sand.  Been a long time since I thought about this old animation.</p>
          <p>Gosh, this camera work is real bad...  Well, these might not be much, but they got their point across.</p>

          <h3>Blackhole Animation</h3>
          <Jump href="https://drive.google.com/open?id=1X8FK2cpaQxLQLB2M7UHaOVgFco98uup9" target="_blank" icon="none" className="image right">
            <img src="/static/images/3drenders/blackhole_anim_inset.jpg" alt="Blackhole Atmosphere Animation" />
            <div className="label-right">Video</div>
          </Jump>
          <p>A long while ago, I had it in my mind that I wanted to do a big animation of Earth trapping a minor blackhole in its orbit and the slow, horrendous destruction of the world as it slowly fell into the core.</p>
          <p>It would basically fall through the atmosphere as this blindingly hot ball of swirling gas before punching clean through the Earth leaving a molten scar.</p>
          <span className="image right javascript-link" onClick={lightboxOpener("threedee", 0)}>
            <img src="/static/images/3drenders/landscape1.jpg" alt="Blackhole Landscape Render" />
            <div className="label-right">Image</div>
          </span>
          <p>Was gonna be this big, epic thing where you see the initial strike, then the blackhole erupt out the other side of the planet.  It would fly far enough out to eventually strike the moon before drifting back in again.  This landscape was going to be the setting of the initial blast.</p>
          <p>As you can see, I was aiming for photo-realism.  It features some 35,000 pine tree facades.  The original trees were created using this impressive procedurally-generated plant/tree plugin for 3DSMax called <Jump href="https://exlevel.com/features/">GrowFX</Jump>, then rendered to a 2D sprite and distributed all over the scene using a distribution map.</p>
          <p>A blinding light would have flown overhead before a hellish flash shown from the far side of the mountain.  <Gallery target="threedee" index={1}>The trees</Gallery> all instantly catch fire and this idyllic landscape would have then begun to crack and glow as the shockwaves twisted the crust and reshaped it into a hellscape.</p>
          <p>Describing it makes me wish I had at least finished that scene...  It'd have been a <em>hell</em> of a sight!  Alas, I got distracted by game-dev stuff instead and shelved my plans for this animation.</p>

          <h3>Ice Cavern</h3>
          <span className="image right javascript-link" onClick={lightboxOpener("threedee", 2)}>
            <img src="/static/images/3drenders/icecave.jpg" alt="Ice Cavern Render" />
            <div className="label-right">Image</div>
          </span>
          <p>A lot of landscapes and other macro-scale objects.  How about a scene that is a little more intimate?</p>
          <p>At one point, I was working on an AS3/Flash Choose Your Own Adventure game engine.  To sort of showcase its abilities, I was also working on a dumb little story to go with it that used random photographs, 3D renders, and colored-shapes as characters.</p>
          <p>This chilling scene would have led to the game's climax, where you release an evil colored-shape with, <em>gasp</em>, <strong>NO CORNERS</strong> from its prison!  Terrifying, I know...  This would have led into a silly jRPG battle mini-game before the credits played.</p>
          <p>Getting the ice texture to look this way was quite a challenge.  I wanted that translucent glow, like the sun's light is managing to break through into the cavern through the walls.</p>
          <p>Gives it quite the eerie atmosphere, doesn't it?</p>
        </Page>

        <Page id="nate" parent="work" article={article}>
          <h2 className="major">Nate Game</h2>
          <span className="image main"><img src="/static/images/pic03.jpg" alt="" onClick={lightboxOpener("nate")} /></span>
          <p>A jump'n'shoot side-scroller game targeting JavaScript platforms and using the <Jump href="https://impactjs.com/" target="_blank">Impact game engine</Jump>.  I was coding everything in <Jump href="https://coffeescript.org/" target="_blank">CoffeeScript</Jump> at the time and <Jump href="https://box2d.org/about/" target="_blank">Box2D</Jump> was being used to provide physics.  A friend of mine, an artist who goes by Tderek99, was doing the graphics while I was doing the programming.</p>

          <h3>Details</h3>
          <p>This game was pitched as: Binding of Isaac, but plays like MegaMan and has a dash of Metroid.</p>
          <p>You were to play a dog-boy named Nate who is abducted from his world by a mighty dragon demon and given to his daughter as a pet.  This <Gallery target="nate" index={1}>childish dragon girl, Chie</Gallery>, &quot;plays&quot; with Nate by using her reality warping powers to create a pocket dimension full of obstacles, traps, and <Gallery target="nate" index={2}>monsters</Gallery> looking to tear him apart.</p>
          <p>She's technically a child, and her treatment of Nate is kind of the demonic equivalent of putting the hamster in the microwave; she just doesn't know better.</p>
          <p>She still grants him a simple magical bullet for self-defense when she drops him into this terrifying world, but scatters &quot;dog toys&quot; that can grant him new powers all over the place.</p>
          <p>In the same fashion as Binding of Isaac, these powers could combine and interact, giving every play-through the potential for something unexpected and exciting.</p>
          <p>The world was gonna rely on procedural generation to make every game different.  The map would generate in such a way that some of the items sprinkled in the world would be used as keys for progressing into new areas, adding a little bit of Metroidvania mechanics into the mix.</p>
          <p>Each of the four or so areas was going to have a boss fight, and upon defeating all the bosses, Nate would escape the pocket dimension and face Chie herself, who'd try to do the demonic equivalent of smacking his nose with a newspaper for trying to bite.</p>
          <p>In order to get the good ending, though, you needed to discover and complete optional goals; if done so, you'd face Chie's father as the final boss, earning your freedom and returning home ...if you manage to beat him.</p>
          <p>We'd probably have tuned things so a single run would probably take one to three hours.</p>

          <h3>Design</h3>
          <p>This project was my first time utilizing Entity-Component Systems and Action Lists.  Impact did not really have support for ECS entities out of the box, so I integrated an open-source ECS library, which I later ported to CoffeeScript so I could understand how it worked better as well as customize it.</p>
          <p>Unfortunately, I was not satisfied with Box2D's performance for driving the physics of the game.  Nate was using the old &quot;capsule body&quot; trick to make him run smoothly across slopes and other surfaces without getting stuck; this gave him a bit of a slippery feel on the edges of platforms.</p>
          <p>Most likely, I would have eventually disabled the physical simulation and only used Box2D for collision detection.  I didn't really like the thought of having so much dead weight from Box2D hanging around, though, and it inspired me to instead work on <Jump href="./#platter">Platter</Jump>, a collision detection engine specifically for classical feeling 2D games.</p>
          <p>At the time we stopped working on the game, I was still building out the basic gameplay mechanics, figuring out how to handle all the power interactions and abilities, as well as laying the foundation for enemy programming.  Although I had scribbled out thoughts on how I'd try and do all the proc-gen stuff, I never got started on a prototype.</p>

          <h3>Interactive Example</h3>
          <p>What with not being able to get more than a simple GIF animation together to demonstrate the original game, I put together this neat interactive widget for this website.  You can use your cursor to play with Nate, who will chase after and try to shoot it when he sees it.</p>
          <p>When he is in his passive state, he will just pace around, showing off his move-set through random actions.  But when he sees the cursor, he'll bark at it and switch to his aggressive state.</p>
          <p>He'll chase the cursor around and try to shoot at it.  If it gets too close, he'll flee, but try and take potshots at it.  If the cursor sits still too long or gets to a place he can't reach, he'll stare at it and display frustration in not being able to play anymore.</p>
          <p>If he is left bored for too long, he'll make a sad, confused whine and return to his passive behaviors.  Be nice and give him some fun!  It gets boring on that blue platform...</p>
          {article === "nate" && Nate.supported && <Nate />}
          {!Nate.supported && <p>(Unfortunately, your browser does not support the features of the interactive component.  Please revisit this page with a different browser if you would like to play with Nate.)</p>}
          <p>All of this was made using a combination of HTML, JavaScript (with ESNext features via <Jump href="https://babeljs.io/" target="_blank">Babel</Jump>), and CSS (via <Jump href="https://sass-lang.com/" target="_blank">SASS</Jump>).  The sounds were created using <Jump href="http://github.grumdrig.com/jsfxr/" target="_blank">jsfxr</Jump> and hopefully the sounds he makes when he changes between his behavior states are recognized as sounds a dog might make.</p>
          <p>While the Canvas API would probably have been the more performant option, an HTML-element based solution is fine for such a simple interactive piece.  His animations are all driven and controlled by CSS, and an action-list coded in a data-driven style drives his rather complicated behavior, made up of around 50 individual actions spread across 4 major behaviors.</p>
          <p>This was actually the most complex AI that I have made to date, in terms of behavioral complexity.</p>
        </Page>

        <Page id="miscprogramming" parent="work" article={article}>
          <h2 className="major">Misc Programming</h2>
          <span className="image main"><img src="/static/images/miscprogramming/header.png" alt="" /></span>
          <p>For the following projects, I have less to show, but they're still worth mentioning.</p>

          <h3>Platter</h3>
          <p>Platter was an attempt to create a collision detection engine that was specially suited for creating 2D retro-style games.  It started out being programmed in CoffeeScript but was shifted to TypeScript later on.</p>
          <p>Platter's code is available for viewing on <Jump href="https://github.com/JHawkley/platter" target="_blank">GitHub</Jump>.  It is a recent and decent example of my coding ability, however it is not presently functional.</p>
          <p>I was not having much luck attracting collaborators on my other game-dev projects, so I decided to focus on building an open-source collision detection library in the meantime while I considered my future plans.  I also took this as an opportunity to cut my teeth on test-driven development.  I felt that a collision-detection engine would be well suited for this method of development, since its domain should be quite testable.</p>
          <p>Sticking to test-driven development proved to be pretty tricky as the project grew, especially as the project entered into the bulk of the actual collision detection routines.  The temptation to just &quot;get it working&quot; and not bother with the complexity of building tests first became pretty strong.</p>
          <p>However, the technique was very good for building the initial APIs for the various kinds of shaped colliders.  It certainly helped to focus things early on; I still have more to learn on sticking to TDD as the project's code-base grows in size.</p>
          <p>The switch from CoffeeScript to TypeScript I actually view as an unfortunate choice.  Many of the patterns I used in JavaScript were not compatible with the type-system at the time, mostly object-composition related patterns.  This caused TypeScript to rub me the wrong way as I tried to force it to work the way I wanted through complicated &quot;type-system gymnastics&quot;.</p>
          <p>TypeScript also has very few language features that make programming in it terse and expressive; it's just a more-restricted sub-set of JavaScript with few added language features over ECMAScript 2015.  I know this was a design goal of the language, but it is regrettable that the language won't do more to support the programmer.  You sometimes just have to accept that you can't make DRY code that is also clear and readable.</p>
          <p>In the end, I made the mistake of trying to fight TypeScript; it has a particular way it wants you to do things and deviating from that will cause you nothing but grief.  Now I know better.</p>

          <h3>Scala Game Engine</h3>
          <p>While I was working with Impact, I actually re-wrote and enhanced it a few times as my needs changed, getting pretty intimate with it; added things like <Jump href="http://www.pixijs.com/" target="_blank">PixiJS</Jump> integration to modernize it a bit, an entity-component system, etc.  It helped me understand how game engines functioned, and with other influences, that understanding evolved.</p>
          <p>This eventually led into this project, to create a game engine in Scala from scratch.</p>
          <p>Unfortunately, I don't have too much to show in regards to this project, aside from <Jump href="/static/sge/index-dev.html" target="_blank">a bouncing-box benchmark</Jump> (based on <Jump href="https://pixijs.io/bunny-mark/" target="_blank">Pixi.js' Bunnymark</Jump>), but it is my most recent project.  Much of the work has so far been under-the-hood; laying the foundation of the engine and all that.</p>
          <p>While the demo doesn't reveal it very well, it has an input system, resource management infrastructure, an entity-component system, and the beginnings of a customizable rendering pipeline.</p>
          <p>Interested in Scala, I was poking around to see what the state of game development was on the platform.  This led me to <Jump href="http://michaelshaw.io/game_talk/game.html#/" target="_blank">an intriguing little slideshow</Jump>, which made reference to <Jump icon="movie" href="https://youtu.be/1PhArSujR_A?t=16m18s" target="_blank">an old key-note of John Carmack's from QuakeCon 2013</Jump> and his thoughts on the future of multi-threaded game engine architecture.  It seemed like it might be kind of fun to try and work within an immutable world state.</p>
          <p>Unfortunately, I did a bit of a silly thing and did it all in ScalaJS, which targets the decidedly single-threaded JavaScript platform and can't take advantage of the concurrency gains from immutability.  But hey, baby steps.  I know JavaScript well.  I could adapt it to JVM later once I got the principals down.</p>
          <p>I kind of wish I had targeted the JVM, though, as I can see a number of mistakes now that would negatively impact concurrency.  I also think I over-complicated the design a lot by using a functional-reactive style for the entity manager.</p>
          <p>I think if I ever come back to this project, I'd probably do a number of refactors to reduce that complexity and make safe concurrency easier to obtain.  However, making my own engine, while a great learning experience, wouldn't be the best use of my time.  I would prefer investing my time mastering Unity instead.</p>
        </Page>

        <Page id="about" article={article}>
          <h2 className="major">About</h2>
          <p>Lorem ipsum dolor sit amet, consectetur et adipiscing elit. Praesent eleifend dignissim arcu, at eleifend sapien imperdiet ac. Aliquam erat volutpat. Praesent urna nisi, fringila lorem et vehicula lacinia quam. Integer sollicitudin mauris nec lorem luctus ultrices. Aliquam libero et malesuada fames ac ante ipsum primis in faucibus. Cras viverra ligula sit amet ex mollis mattis lorem ipsum dolor sit amet.</p>
        </Page>
        
        <Page id="questions" article={article}>
          <h2 className="major">Questions &amp; Answers</h2>
          <p>Below I'll answer some questions that I suspect might be pretty common.</p>
          <dl>
            <dt>Are you able to move?</dt>
            <dd>I currently have a house and three roommates.  Moving would be a significant inconvenience for a lot of people.  I would be resistant to the idea of moving, but with the right offer and support during the move, I could be persuaded.</dd>
            <dd>Telepresence would be a much more agreeable solution, though, if you can support it.</dd>

            <dt>Are you willing to learn a programming language?</dt>
            <dd>Certainly.  I should be able to pick up most popular imperative languages pretty readily.  I can't imagine it would take me very long to pick up <Jump href="https://swift.org/" target="_blank">Swift</Jump> or <Jump href="https://www.rust-lang.org/" target="_blank">Rust</Jump>, for instance.</dd>
            <dd>As most of my experience has been in these imperative languages, learning a purely functional language may take more time; if you need a Haskell developer on short notice, you may want to search elsewhere.</dd>
            <dd>I do have an interest in learning a functional language, but they tend to require a different style of thinking from what I'm used to.  I've slowly been wrapping my head around it, thanks to my work in Scala, but I fear it would still be some time before my competency reaches acceptable levels.</dd>

            <dt>Can you work in <code>&lt;javascript web framework&gt;</code>?</dt>
            <dd>Yes, I can work in <code>&lt;javascript web framework&gt;</code>, no problem.</dd>
            <dd>I've got experience in Backbone, Angular, Ember, and now React; I've been around and am pretty aware of how these frameworks are organized and operate.  JavaScript frameworks are a dime-a-dozen and it seems like a new one pops up every few months that is the new darling of the JavaScript community.  I have good generalized experience that should allow me to become effective in an unfamiliar framework in just a couple of days.</dd>
            <dd>In fact, case in point is this website.  It uses React, which I had never used before, but in only a couple days, I was already building useful components for this site and had basic routing operating  ...which this template's developer apparently attempted, but gave up on finishing.</dd>
            <dd>As long as you're not looking to use something exotic, like <Jump href="https://elm-lang.org/" target="_blank">Elm</Jump>, I should be able to manage.</dd>

            <dt>How is your experience with back-end development?</dt>
            <dd>Not the greatest.  I've worked closely with a back-end developer before and am familiar with a lot of the technologies involved and a number of the security pitfalls to avoid, but aside from some of my own toy projects, I haven't done much back-end development or systems administration of server environments.</dd>
            <dd>In a pinch, I feel like I could manage it, but I would be slower and more error-prone than someone with more focused experience, and this part of your web application infrastructure really does require the best talent.</dd>
            <dd>I feel that I would be best suited in a support role with more veteran back-end developers, where I could work under their guidance and learn from them, while taking some of the less critical workloads off their shoulders.</dd>

            <dt>Do you have Unity experience?</dt>
            <dd>Very little direct experience.  I've been keeping tabs on it and ran through a few of the tutorials, but I have yet to build anything in it.  Most of my experience has been related to creating source-level mods for Unity-powered games using the <Jump href="https://github.com/pardeike/Harmony" target="_blank">Harmony library</Jump>, which isn't the best experience, but it's something!</dd>
            <dd>I suppose I haven't started with it yet because I'm waiting for <Jump href="https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-7" target="_blank">C# 7</Jump> support, which is slated to come in <Jump href="https://blogs.unity3d.com/2018/09/13/unity-2018-3-beta-get-early-access-now/" target="_blank">Unity 2018.3</Jump>.  After my time with Scala, working in C# 6 and lower just seems like a chore by comparison.</dd>
            <dd>But, if you need a Unity dev, I can likely manage it.  I will just be a little sad without my pattern-matching and out-variables is all  ...for a few months anyways.  They do have the open beta out now; surely it won't be too much longer!</dd>
          </dl>
        </Page>

        <Page id="contact" article={article}>
          <h2 className="major">Contact</h2>
          <ContactForm />
          <ul className="icons">
            <li><a href="https://www.linkedin.com/in/james-dean-7b96aa169/">
              <FontAwesomeIcon icon={faLinkedin} />
            </a></li>
            <li><a href="https://github.com/JHawkley">
              <FontAwesomeIcon icon={faGithub} />
            </a></li>
          </ul>
        </Page>

        <Page id="contacted" article={article}>
          <h2 className="major">Thank You</h2>
          <p>Your message was sent successfully.  I'll try to reply to your inquiry when I can.</p>
          <p>Please hit the close button in the upper-right to return to the landing page.</p>
        </Page>
        
        {lightbox()}

      </div>
    );
  }
}

Main.propTypes = {
  route: PropTypes.object,
  article: PropTypes.string,
  articleTimeout: PropTypes.bool,
  timeout: PropTypes.bool
};

export default Main;
