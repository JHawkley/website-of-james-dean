import Page from "components/Page";
import Jump from "components/Jump";

import ImgHeader from "static/images/pic_work.png";

// Our work pages.
import $terravu from "pages/articles/terravu?name";
import $lithologic from "pages/articles/lithologic?name";
import $lithphoto from "pages/articles/lithphoto?name";
import $solar from "pages/articles/solar?name";
import $threedee from "pages/articles/threedee?name";
import $nate from "pages/articles/nate?name";
import $miscprogramming from "pages/articles/miscprogramming?name";

const workItem = (description, title, page) => (
  <Jump page={page} className="work-item">
    <dl><dt>{description}</dt><dd>{title}</dd></dl>
  </Jump>
);

const Work = (props) => {
  const { imageSync, active } = props;
  const phase = active ? 0 : 1;
  return (
    <Page {...props}>
      <h2 className="major">Work</h2>
      <span className="image main"><ImgHeader fluid phase={phase} imageSync={imageSync} alt="Variety of Work" /></span>
      <p>Much of my work was done at my previous employer, <strong><Jump href="http://www.terradomain.us/">TerraDom Corporation</Jump></strong> (formerly Terra Domain Consulting).  My best and biggest software projects were done there.  You can read about them from the selection below:</p>
      {workItem("Enterprise Geosteering", "TerraVu 2", $terravu)}
      {workItem("Mud-Logger's Tool", "Lithologic", $lithologic)}
      {workItem("Rock Photography Database", "Lithologic Photo", $lithphoto)}
      <p>Along with software development, I've also done work in <strong>3D and animation</strong> for both personal and professional reasons.  I feel my ability here is still quite amateurish and isn't useful beyond architectural-style renders or placeholder assets, so I don't count it as one of my primary skills, but I suspect some of you would appreciate knowing I can handle myself in 3D modeling software.</p>
      {workItem("Bright Idea", "Solar Bio-Reactor", $solar)}
      {workItem("More Modeling", "Miscellaneous 3D", $threedee)}
      <p>I also enjoy taking on <strong>personal projects</strong>, usually to help me learn new things and expand my horizons.  A selection of my more worth-while projects, largely centered around game development, appear below:</p>
      {workItem("Abducted Dog Adventure", "Nate Game", $nate)}
      {workItem("My Time Invested", "Misc Programming", $miscprogramming)}
    </Page>
  );
};

export default Work;