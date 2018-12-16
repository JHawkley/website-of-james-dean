import Page, { pageDataFor } from "components/Page";
import { dew } from "tools/common";
import $name from "?name";

const codes = (code) => {
  switch (code) {
    case 404: return [
      "404 - Route Missing",
      <p>There is no article associated with this route.  Please press the close button in the upper-right to return to the site's index.</p>
    ];
    case void 0:
    case null: return [
      "Unexpected Error",
      <p>An unusual and unexpected error occured.  You can try refreshing the page or trying to return to the site index by pressing the close button in the upper-right.</p>
    ];
    default: return [
      `${code} - Unexpected Error`,
      <p>An unusual and unexpected error occured.  You can try refreshing the page or trying to return to the site index by pressing the close button in the upper-right.</p>
    ];
  }
};

const Error = (props) => {
  const [title, body] = codes(props.statusCode);
  return <Page {...props}><h2 className="major">{title}</h2>{body}</Page>;
};

Error.pageData = pageDataFor($name);

Error.getInitialProps = ({ query, res, err }) => {
  const statusCode = dew(() => {
    if (query?.statusCode) return query.statusCode;
    if (res) return res.statusCode;
    if (err) return err.statusCode;
    return null;
  });
  return { statusCode };
}

export default Error;