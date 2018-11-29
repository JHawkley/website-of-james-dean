import Page from "components/Page";
import Jump from "components/Jump";

// Our work pages.
import TerraVu from "./TerraVu";
import Lithologic from "./Lithologic";
import LithologicPhoto from "./LithologicPhoto";
import Solar from "./Solar";
import ThreeDee from "./ThreeDee";
import Nate from "./Nate";
import MiscProgramming from "./MiscProgramming";

const $work = "work";
const { Fragment } = React;

const workItem = (description, title, page) => (
  <Jump page={page} className="work-item">
    <dl><dt>{description}</dt><dd>{title}</dd></dl>
  </Jump>
);

export default class Work extends Page($work) {
  content() {
    return (
      <Fragment>
        <h2 className="major">Work</h2>
        <span className="image main"><img src="/static/images/pic_work.png" alt="" /></span>
        <p>Much of my work was done at my previous employer, <strong><Jump href="http://www.terradomain.us/" target="_blank">TerraDom Corporation</Jump></strong> (formerly Terra Domain Consulting).  My best and biggest software projects were done there.  You can read about them from the selection below:</p>
        {workItem("Enterprise Geosteering", "TerraVu 2", TerraVu)}
        {workItem("Mud-Logger's Tool", "Lithologic", Lithologic)}
        {workItem("Rock Photography Database", "Lithologic Photo", LithologicPhoto)}
        <p>Along with software development, I've also done work in <strong>3D and animation</strong> for both personal and professional reasons.  I feel my ability here is still quite amateurish and isn't useful beyond architectural-style renders or placeholder assets, so I don't count it as one of my primary skills, but I suspect some of you would appreciate knowing I can handle myself in 3D modeling software.</p>
        {workItem("Bright Idea", "Solar Bio-Reactor", Solar)}
        {workItem("More Modeling", "Miscellaneous 3D", ThreeDee)}
        <p>I also enjoy taking on <strong>personal projects</strong>, usually to help me learn new things and expand my horizons.  A selection of my more worth-while projects, largely centered around game development, appear below:</p>
        {workItem("Abducted Dog Adventure", "Nate Game", Nate)}
        {workItem("My Time Invested", "Misc Programming", MiscProgramming)}
      </Fragment>
    );
  }

}