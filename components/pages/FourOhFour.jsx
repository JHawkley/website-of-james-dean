import Page from "components/Page";

const $fourOhFour = "404";
const { Fragment } = React;

export default class FourOhFour extends Page($fourOhFour) {

  content() {
    return (
      <Fragment>
        <h2 className="major">404 - Route Missing</h2>
        <p>There is no article associated with this route.  Please press the close button in the upper-right to return to the site's index.</p>
      </Fragment>
    );
  }

}