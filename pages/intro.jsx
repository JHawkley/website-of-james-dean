import Page from "components/Page";
import Jump from "components/Jump";

import ImgPlaceholderPhoto from "static/images/placeholder_photo.jpg";

import $work from "pages/work/index?route";

const Intro = () => (
  <Page>
    <h2 className="major">Intro</h2>
    <span className="image right">
      <ImgPlaceholderPhoto alt="A Photo of James Dean" fluid />
    </span>
    <p>Welcome!  I'm James!  I'm a software developer from Texas, USA.</p>
    <p>I have been working professionally since 2002.  In that time, I've put together and maintained three big applications for my former employer.  You can read all about it in the <Jump href={$work}>work section of the site</Jump>.</p>
    <p>My first serious programming was in C#, which I primarily used until 2010, when I decided to shift much of my focus on to JavaScript and related technologies.  I consider web services and applications to pretty much be the future of end-user software, a universal platform that spans all devices across the planet.</p>
    <p>Though, it probably won't realize that potential for a while longer.  Nevertheless, it surely will be some day and in some form and I intend to help make it happen.</p>
    <p>I primarily consider myself a front-end and application developer; it's certainly where I've had most of my success.  User experiences that I design tend to be highly contextual and minimally cluttered.  If it isn't important to the user at the time, it should be given little to no screen space.  I also like to keep things clear, so one part of the UI is easily distinguishable from another part.</p>
    <p>I've also always had the dream to create games since I was in high school, which is where most of my spare time goes.  I have mostly been studying the technical aspects of game development, rather than building complete games.  The systems and algorithms that drive games fascinate me.</p>
    <p>I just have not yet gotten together with like-minded individuals who can handle the more artistic side of things and tough it out with me until the end.</p>
    <p>If you are such a person, please have a look at my <Jump href={$work}>game-specific works here</Jump>, toward the bottom of the page, to help you determine if I might be an asset to your project.</p>
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
);

export default Intro;