import Page from "components/Page";

const FourOhFour = (props) => (
  <Page {...props}>
    <h2 className="major">404 - Route Missing</h2>
    <p>There is no page associated with this route.  Please press the close button in the upper-right to return to the site's index.</p>
  </Page>
);

export default FourOhFour;