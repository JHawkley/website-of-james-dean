import PropTypes from "prop-types";
import Page from "components/Page";
import Jump from "components/Jump";
import { css } from "styled-jsx/css";
import styleVars from "styles/vars.json";

import ImgHeader from "static/images/pic_work.png";

// Our work pages.
import ToTerraVu from "pages/work/terravu?jump";
import ToLithologic from "pages/work/lithologic?jump";
import ToLithPhoto from "pages/work/lithphoto?jump";
import ToSolar from "pages/work/solar?jump";
import ToThreeDee from "pages/work/threedee?jump";
import ToNate from "pages/work/nate?jump";
import ToWebsite from "pages/work/website?jump";
import ToMiscProgramming from "pages/work/miscprogramming?jump";

const WorkItem = ({title, desc, jump: ToPage}) => (
  <ToPage className={workItemCss.className}>
    <dl><dt>{desc}</dt><dd>{title}</dd></dl>
  </ToPage>
);

WorkItem.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  jump: PropTypes.func.isRequired
};

const WorkPage = (props) => (
  <Page {...props}>
    <h2 className="major">Work</h2>
    <span className="image main"><ImgHeader alt="Variety of Work" fluid /></span>
    <p>Much of my work was done at my previous employer, <strong><Jump href="http://www.terradomain.us/">TerraDom Corporation</Jump></strong> (formerly Terra Domain Consulting).  My best and biggest software projects were done there.  You can read about them from the selection below:</p>

    <WorkItem title="TerraVu 2" desc="Enterprise Geosteering" jump={ToTerraVu} />
    <WorkItem title="Lithologic" desc="Mud-Logger's Tool" jump={ToLithologic} />
    <WorkItem title="Lithologic Photo" desc="Rock Photography Database" jump={ToLithPhoto} />

    <p>Along with software development, I've also done work in <strong>3D and animation</strong> for both personal and professional reasons.  I feel my ability here is still quite amateurish and isn't useful beyond architectural-style renders or placeholder assets, so I don't count it as one of my primary skills, but I suspect some of you would appreciate knowing I can handle myself in 3D modeling software.</p>

    <WorkItem title="Solar Bio-Reactor" desc="Bright Idea" jump={ToSolar} />
    <WorkItem title="Misc 3D Modeling" desc="Tris Rendered" jump={ToThreeDee} />

    <p>I also enjoy taking on <strong>personal projects</strong>, usually to help me learn new things and expand my horizons.  A selection of my more worth-while projects, largely centered around game development, appear below:</p>

    <WorkItem title="Nate Game" desc="Abducted Dog Adventure" jump={ToNate} />
    <WorkItem title="This Website" desc="You Are Here" jump={ToWebsite} />
    <WorkItem title="Misc Programming" desc="My Time Invested" jump={ToMiscProgramming} />
    {workItemCss.styles}
  </Page>
);

const workItemCss = css.resolve`
  a {
    display: block;
    border-radius: 4px;
    border: solid 1px #fff;
    margin: 0 auto 2rem auto;
    text-align: center;
    max-width: 70%;
  }

  a:hover {
    background-color: ${styleVars["palette"]["border-bg"]};
  }

  a :global(dl) {
    margin: 0.25rem;
  }

  a :global(dl > dt) {
    margin: 0;
    font-weight: inherit;
  }

  a :global(dl > dt:before) {
    content: "-";
    margin-right: 0.5em;
  }

  a :global(dl > dt:after) {
    content: "-";
    margin-left: 0.5em;
  }

  a :global(dl > dd) {
    font-variant-caps: small-caps;
    margin-left: 0;
    font-weight: ${styleVars["font"]["weight-bold"]};
    font-size: 2.25rem;
    line-height: 2.25rem;
  }
`;

export default WorkPage;