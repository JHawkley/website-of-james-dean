import Page from "components/Page";

import ImgJamesPhoto from "static/images/james_photo.jpg";

import ToWork from "pages/work/index?jump";

const IntroPage = (props) => (
  <Page {...props}>
    <h2 className="major">Intro</h2>
    <span className="image right">
      <ImgJamesPhoto alt="A Photo of James Dean" fluid />
    </span>
    <p>Welcome!  I'm James!  I'm a software developer in the greater Seattle area of Washington, USA.  I'm originally from Texas.</p>
    <p>I have been working professionally since 2003.  In that time, I've put together and maintained three big applications for my former employer, though that isn't all.  You can read all about that and more in the <ToWork>work section of the site</ToWork>.</p>
    <p>My first serious programming was in C#, which I primarily used until 2010, when I decided to shift much of my focus on to JavaScript and related technologies.  I consider web services and applications to pretty much be the future of end-user software, a universal platform that spans all devices across the planet.</p>
    <p>While it probably won't realize that potential for a while longer, it will some day and in some form; I want to be a part of making it happen.</p>
    <p>I primarily consider myself a front-end developer with most of my experience being in desktop applications; it's certainly where I've had most of my success. User experiences that I design tend to be highly contextual and minimally cluttered. If it isn't important to the user at the time, it should be given little to no screen space. I also like to keep things clear, so one part of the UI is easily distinguishable from another part.</p>
    <p>I've also always had the dream to create games since I was in high school, which is where most of my spare time goes.  I have mostly been studying the technical aspects of game development, rather than building complete games.  The systems and algorithms that drive games fascinate me.</p>
    <p>I just have not yet gotten together with like-minded individuals who can handle the more artistic side of things and tough it out with me until the end.</p>
    <p>If you are such a person, please have a look at my <ToWork>game-specific works here</ToWork>, toward the bottom of the page, to help you determine if I might be an asset to your project.</p>
    <p>For recruiters and those involved with talent acquisition, you may wish to view <a href="/static/misc/James%20Dean%20-%20Resume.pdf">my current resume</a> and the table of my skills below:</p>
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
          <td><strong>C#</strong>, <strong>Scala</strong> (ScalaJS), <strong>HTML</strong>, <strong>CSS</strong> (SASS, LESS), <strong>JavaScript</strong> (CoffeeScript, TypeScript)</td>
        </tr>
        <tr>
          <td>Frameworks</td>
          <td><strong>.NET Framework</strong>, <strong>React</strong> (NextJS), <strong>Ember</strong>, formerly well-acquainted with <strong>Angular</strong>, formerly well-acquainted with <strong>Backbone</strong></td>
        </tr>
        <tr>
          <td>Build Tools</td>
          <td><strong>Visual Studio Projects</strong>, <strong>Grunt</strong>, <strong>Gulp</strong>, <strong>Babel</strong>, basic competency with <strong>Scala Build Tool</strong></td>
        </tr>
        <tr>
          <td>Testing Frameworks</td>
          <td><strong>Jasmine</strong>, <strong>Jest</strong></td>
        </tr>
        <tr>
          <td>Source Control</td>
          <td><strong>Git</strong>, <strong>GitHub</strong>, and <strong>GitKraken</strong> being my preferred GUI.</td>
        </tr>
        <tr>
          <td>IDEs</td>
          <td><strong>Visual Studio 20XX</strong>, <strong>Visual Studio Code</strong>, <strong>IntelliJ IDEA</strong></td>
        </tr>
        <tr>
          <td>3D Modeling Software</td>
          <td>Basic competency with <strong>Autodesk Inventor</strong>, basic competency with <strong>Blender</strong>, formerly well-acquainted with <strong>3D Studio Max</strong></td>
        </tr>
        <tr>
          <td>Other Software</td>
          <td><strong>Office-Related Software</strong> (such as Word, Excel), basic competency with <strong>Image Manipulation Software</strong> (such as Photoshop, The GIMP, Inkscape)</td>
        </tr>
      </tbody>
    </table>
  </Page>
);

export default IntroPage;