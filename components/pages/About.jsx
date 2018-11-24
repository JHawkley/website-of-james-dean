import Page from "components/Page";

const $about = "about";
const { Fragment } = React;

export default class About extends Page($about) {

  content() {
    return (
      <Fragment>
        <h2 className="major">About</h2>
        <p>Lorem ipsum dolor sit amet, consectetur et adipiscing elit. Praesent eleifend dignissim arcu, at eleifend sapien imperdiet ac. Aliquam erat volutpat. Praesent urna nisi, fringila lorem et vehicula lacinia quam. Integer sollicitudin mauris nec lorem luctus ultrices. Aliquam libero et malesuada fames ac ante ipsum primis in faucibus. Cras viverra ligula sit amet ex mollis mattis lorem ipsum dolor sit amet.</p>
      </Fragment>
    );
  }

}