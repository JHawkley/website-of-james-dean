import Page from "components/Page";
import Jump from "components/Jump";

const $about = "about";
const { Fragment } = React;

export default class About extends Page($about) {

  content() {
    return (
      <Fragment>
        <h2 className="major">About</h2>
        <p>This website was created and is maintained for personal use by myself, James Dean, to showcase my work to potential employers and other interested parties.</p>
        <p>It is based on a <Jump href="https://github.com/codebushi/nextjs-starter-dimension" target="_blank">Next.JS starter project</Jump> that uses the Dimension template offered by <Jump href="https://html5up.net/dimension" target="_blank">HTML5 UP</Jump>, licensed under Creative Commons.</p>
        <p>Other page content is under license or used with explicit permission.  Portions authored by and © James Dean 2018.  Please do not use any original portion of this site without explicit permission.</p>
        <p>For inquiries regarding this website, please <Jump href="./#contact">contact me</Jump>.</p>
      </Fragment>
    );
  }

}