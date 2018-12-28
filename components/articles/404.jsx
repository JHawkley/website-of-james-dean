import Article from "components/Article";

const FourOhFour = (props) => (
  <Article {...props}>
    <h2 className="major">404 - Route Missing</h2>
    <p>There is no article associated with this route.  Please press the close button in the upper-right to return to the site's index.</p>
  </Article>
);

export default FourOhFour;