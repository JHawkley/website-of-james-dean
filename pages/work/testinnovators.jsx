import Page from "components/Page";
import Jump from "components/Jump";

import ImgHeader from "static/images/testinnovators/header.png";

import ToWork from "pages/work/index?jump";

const TestInnovatorsPage = (props) => (
  <Page {...props} navLeft={ToWork}>
    <h2 className="major">Test Innovators</h2>
    <span className="image main"><ImgHeader alt="Test Innovators" fluid /></span>
    <p>From the start of 2020 to the end of 2021, I worked at Test Innovators as a senior developer.</p>
    <p>My responsibilities were quite broad, being involved in pretty much every aspect of their web applications and backend server infrastructure; I implemented new features and helped to build whole new applications, authored and safely executed MySQL queries to perform migrations or deliver unusual data the operations staff needed, and also worked with AWS to configure their services from time-to-time.</p>
    <p>Their infrastructure was originally built using CoffeeScript and AngularJS, with Express handling their backend APIs.  Each product they offered was originally its own server that handled everything in isolation from their other products.  When I left, they had a unified authentication system and unified admin tool with a lot more data sharing between their products.</p>
    <p>I was hired specifically to assist in a transition to React or Vue, as <Jump href="https://angularjs.org/">AngularJS</Jump> (the <em>original</em> one) was approaching end-of-support, but the time to perform this big rework just never materialized while I was there.  Disappointing, but sometimes that's how it goes.</p>
    <p>Here's a list of notable accomplishments I played a significant role in:</p>
    <dl>
      <dt>Grunt to Gulp Build-Tool Transition</dt>
      <dd>
        <p>I led the transition of the core build system from <Jump href="https://gruntjs.com/">Grunt</Jump> to the more flexible <Jump href="https://gulpjs.com/">Gulp</Jump>.</p>
        <p>I recall it being quite challenging and interesting to funnel so much and so many different kinds of source files into a final artifact.  Since Gulp allowed task parallelization, build times were significantly reduced.</p>
      </dd>
    </dl>
    <dl>
      <dt>CoffeeScript to JavaScript Conversion</dt>
      <dd>
        <p>When I came on board, they were trying to transition from CoffeeScript to JavaScript in preparation for the React/Vue transition; at the time, CoffeeScript's JSX syntax was still not stable, not to mention that most popular tooling paid no mind to CoffeeScript.</p>
        <p>The Teacher Tools, a tool that let teachers administrate and view the progress of their students, had already been converted in a naive-but-straightforward way, resulting in an ECMAScript 5 code-base that felt very artificial and clearly transpiled.  Devs tidied up the code to make it more readable to others as they touched it, adding a bit of overhead as they worked to complete their task.</p>
        <p>When I was given the task to transition the web app's backend code, I used a more advanced code transpiler with some custom-made AST transforms to produce a more organic result in ECMAScript 6, requiring significantly less cleanup.  I was actually very proud of the result; it just worked!  Was quite the jarring Git commit, though, and there is no doubt still a lot of code that I would get <code>git blame</code>'d for over there.</p>
      </dd>
    </dl>
    <dl>
      <dt>Frontend Design for the OpenID Connect Service</dt>
      <dd>
        <p>I spearheaded the design of the core templates and styling for their OpenID Connect system that handles sign-on with their own account system, as well as third-party identities such as Google.</p>
        <p>Unlike many of their other services, the OIDC service was a dumb app, delivering static HTML generated from templates; this was largely a limitation of OIDC itself, which relies heavily on standardized routes that each have a very well-defined purpose.  It utilized <Jump href="https://getbootstrap.com/">Bootstrap</Jump> with some custom <Jump href="https://lesscss.org/">LESS</Jump> sprinkled in for style.</p>
        <p>I also implemented a great many of the pages delivered for these different routes; each one was designed to be responsive, supporting everything from desktop to mobile phones.  It stood out as being the first user-facing service with a responsive design, something we intended to expand on during the React/Vue transition.</p>
        <p>It looks like the design I originally created is still in use, though the background has since been changed from their brand's beautiful blue hue to a simple white.</p>
      </dd>
    </dl>
    <dl>
      <dt>Frontend Design for the Unified Admin Tool</dt>
      <dd>
        <p>Before OIDC, each product had its own isolated set of users and own admin tool.  After OIDC, we had the opportunity to unify users across the different products and administrate almost everything related to users and organizations from a single tool.</p>
        <p>I did a lot of the design and bootstrapping for this new admin tool and a implemented a number of the tools themselves.  This all helped operations get a much broader view of how users and organizations were using their products and reduced tedium having to hop between multiple sites to administrate subscriptions or user information.</p>
      </dd>
    </dl>
  </Page>
);

export default TestInnovatorsPage;