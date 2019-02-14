import PropTypes from "prop-types";
import Page from "components/Page";
import Jump from "components/Jump";
import { css } from "styled-jsx/css";
import styleVars from "styles/vars.json";

import ImgHeader from "static/images/pic_work.png";

// Our work pages.
import $terravu from "pages/work/terravu?route";
import $lithologic from "pages/work/lithologic?route";
import $lithphoto from "pages/work/lithphoto?route";
import $solar from "pages/work/solar?route";
import $threedee from "pages/work/threedee?route";
import $nate from "pages/work/nate?route";
import $miscprogramming from "pages/work/miscprogramming?route";

const WorkItem = ({title, desc, href}) => (
  <Jump href={href} className={workItemCss.className}>
    <dl><dt>{desc}</dt><dd>{title}</dd></dl>
    {workItemCss.styles}
  </Jump>
);

WorkItem.propTypes = {
  title: PropTypes.string,
  desc: PropTypes.string,
  href: PropTypes.string,
};

const Work = (props) => (
  <Page {...props}>
    <h2 className="major">Work</h2>
    <span className="image main"><ImgHeader alt="Variety of Work" fluid /></span>
    <p>Much of my work was done at my previous employer, <strong><Jump href="http://www.terradomain.us/">TerraDom Corporation</Jump></strong> (formerly Terra Domain Consulting).  My best and biggest software projects were done there.  You can read about them from the selection below:</p>

    <WorkItem title="TerraVu 2" desc="Enterprise Geosteering" href={$terravu} />
    <WorkItem title="Lithologic" desc="Mud-Logger's Tool" href={$lithologic} />
    <WorkItem title="Lithologic Photo" desc="Rock Photography Database" href={$lithphoto} />

    <p>Along with software development, I've also done work in <strong>3D and animation</strong> for both personal and professional reasons.  I feel my ability here is still quite amateurish and isn't useful beyond architectural-style renders or placeholder assets, so I don't count it as one of my primary skills, but I suspect some of you would appreciate knowing I can handle myself in 3D modeling software.</p>

    <WorkItem title="Solar Bio-Reactor" desc="Bright Idea" href={$solar} />
    <WorkItem title="Misc 3D Modeling" desc="Tris Rendered" href={$threedee} />

    <p>I also enjoy taking on <strong>personal projects</strong>, usually to help me learn new things and expand my horizons.  A selection of my more worth-while projects, largely centered around game development, appear below:</p>

    <WorkItem title="Nate Game" desc="Abducted Dog Adventure" href={$nate} />
    <WorkItem title="Misc Programming" desc="My Time Invested" href={$miscprogramming} />
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

export default Work;