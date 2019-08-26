import React from "react";
import ErrorPage from "pages/_error";
import { route as $404 } from "pages/404?jump";

const data = { statusCode: 404, type: "http-error" };

class FourOhFourPage extends React.PureComponent {

  // Start with an empty `asPath` so rehydration does not throw any warning.
  state = { asPath: null };

  componentDidMount() {
    if (!process.browser) return;
    this.setState({ asPath: location.pathname });
  }

  render() {
    const { asPath } = this.state;
    if (!asPath) return null;
    return <ErrorPage {...this.props} route={$404} asPath={asPath} data={data} />;
  }

}

export default FourOhFourPage;