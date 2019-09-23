import { Fragment } from "react";

import Page from "components/Page";
import Jump from "components/Jump";

import ImgHeader from "static/images/website/header.png";

import ToWork from "pages/work/index?jump";

const Break = () => <Fragment><br /><br /></Fragment>;

const MiscProgrammingPage = (props) => (
  <Page {...props} navLeft={ToWork}>
    <h2 className="major">This Website</h2>
    <span className="image main"><ImgHeader alt="This Website" fluid /></span>
    <p>This website was built using <Jump href="https://nextjs.org/">NextJS</Jump> and based on <Jump href="https://html5up.net/dimension">the Dimension template by HTML5 UP</Jump>.  NextJS produces a static website, without requirements for any complex server infrastructure, with the help of <Jump href="https://webpack.js.org/">Webpack</Jump>.</p>
    <p>While the template was a great start in regards to style-sheets and the overall look and feel of the site, it was otherwise quite bare-bones and needed a lot of work to flesh it out completely.</p>
    <p>The original <Jump href="https://sass-lang.com/">SASS style-sheets</Jump> were modified where needed to get better compatibility with Internet Explorer 11 and Edge.  Pretty much all other custom CSS was written in <Jump href="https://github.com/zeit/styled-jsx">styled-jsx</Jump>, which NextJS has strong support for.</p>
    <p>A few Webpack loaders were also created to assist in managing static assets, such as images or sounds, as well as generate links to other pages.  These loaders help to ensure these assets actually exist prior to building the site and export React components and other information that make working with them easy and predictable.</p>
    <p>The template also had very few supporting React components and little attention given to utilizing Webpack's code splitting and tree-shaking features; I added support for these capabilities myself in order to ensure as small a payload as possible to the site's visitors.</p>
    <p>In pursuit of that goal, I also contributed to or forked a couple of projects.  These projects are listed below:</p>
    <dl>
      <dt><Jump href="https://github.com/JHawkley/babel-plugin-transform-resolve-wildcard-import">babel-plugin-transform-resolve-wildcard-import</Jump></dt>
      <dd>Attempts to aid Webpack's tree-shaking by converting wildcard imports into named imports.  Webpack is already pretty good at this, but this plugin can shake out or split a little more in certain edge-cases.<Break />
      My contributions remove the need for a surrogate object and also provides support for destructuring assignments.</dd>
    </dl>
    <dl>
      <dt><Jump href="https://github.com/JHawkley/resolve-imports-loader">resolve-imports-loader</Jump></dt>
      <dd>An adaptation of SectorLabs' <Jump href="https://github.com/SectorLabs/babel-plugin-transform-named-imports">babel-plugin-transform-named-imports</Jump> as a Webpack Loader.<Break />
      Because the Babel plugin required Webpack's configuration to work properly and some of the transformations it was attempting were incompatible with some of the loaders I was using, it made more sense to turn it into a Webpack loader.<Break />
      This website has not yet been built using this loader, however.  Due to the complexity of the transformations and how difficult it is to perform them without asynchronous support from Babel, I've begun to re-write this into a full-fledged Webpack plugin instead.  A later release of this website will likely make use of it, once I have time to finish it.
      </dd>
    </dl>
    <p>This site's code is available on <Jump href="https://github.com/JHawkley/website-of-james-dean">GitHub for viewing</Jump>.  Large portions of the code-base have been made available for use under an open-source license, as well.</p>
    <p>I consider this a good example of my website authoring capabilities.  As my knowledge and understanding of React and NextJS improved, it under went a few major refactors to improve on the design, which I am now rather pleased with.</p>
  </Page>
);

export default MiscProgrammingPage;