import Article, { Goto } from "components/Article";
import Jump from "components/Jump";

import ImgHeader from "static/images/pic_work.png";

// Our work pages.
import $terravu from "components/articles/TerraVu?name";
import $lithologic from "components/articles/Lithologic?name";
import $lithphoto from "components/articles/LithologicPhoto?name";
import $solar from "components/articles/Solar?name";
import $threedee from "components/articles/ThreeDee?name";
import $nate from "components/articles/Nate?name";
import $miscprogramming from "components/articles/MiscProgramming?name";

const workItem = (description, title, article) => (
  <Goto article={article} className="work-item">
    <dl><dt>{description}</dt><dd>{title}</dd></dl>
  </Goto>
);

const Work = (props) => {
  const { appContext: { imageSync }, active } = props;
  const phase = active ? 0 : 1;
  return (
    <Article {...props}>
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
    </Article>
  );
};

export default Work;