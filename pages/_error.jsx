import React from "react";
import NextErrorPage from "next/error";
import { is, compareOwnProps } from "tools/common";
import { memoize } from "tools/functions";
import { extensions as errorEx } from "tools/errors";
import PropTypes from "tools/propTypes";
import Page from "components/Page";
import { errorBlockQuote } from "styles/jsx/lib/errorBlockQuote";

const $appError = "app-error";
const $httpError = "http-error";

class ErrorPage extends React.PureComponent {

  static async getInitialProps(ctx) {
    const { pathname: route, asPath, err } = ctx;
    const props = { route, asPath };

    if (err)
      props.data = { error: err, type: $appError };
    else {
      const nextErrorProps = await NextErrorPage.getInitialProps(ctx);
      props.data = { ...nextErrorProps, type: $httpError };
    }
    
    return props;
  }

  static propTypes = {
    data: PropTypes.oneOfType([
      PropTypes.instanceOf(Error),
      PropTypes.shape({
        type: PropTypes.exactly($appError).isRequired,
        error: PropTypes.any.isRequired
      }),
      PropTypes.shape({
        type: PropTypes.exactly($httpError).isRequired,
        statusCode: PropTypes.number.isRequired
      })
    ]),
    route: PropTypes.string.isRequired,
    asPath: PropTypes.string.isRequired
  };

  state = { asPath: void 0 };

  decomposeProps = memoize((props) => {
    const { data, route, asPath, ...pageProps } = props;
    return { ownProps: { data, route, asPath }, pageProps };
  });

  formatError = memoize((error) => {
    return error::errorEx.map((error) => {
      return {
        type: errorType(error),
        message: errorMessage(error),
        stack: errorStack(error)
      };
    });
  });

  logError = () => {
    try {
      const { data, route } = this.props;
      const { asPath } = this.state;
      const error = convertToError(data, route, asPath);
      if (!error) return;
      // eslint-disable-next-line no-console
      error::errorEx.foreach(e => console.error(e));
    }
    catch { void 0; }
  }

  componentDidMount() {
    const asPath = this.props.asPath ?? location?.pathname ?? null;
    this.setState({ asPath }, this.logError);
  }

  componentDidUpdate(prevProps) {
    if (this.props === prevProps) return;

    const { ownProps } = this.decomposeProps(this.props);
    const { ownProps: prevOwnProps } = this.decomposeProps(prevProps);

    if (!compareOwnProps(prevOwnProps, ownProps)) {
      const { asPath: prevAsPath } = this.state;
      const asPath = ownProps.asPath ?? prevAsPath;

      if (Object.is(asPath, prevAsPath))
        this.logError();
      else
        this.setState({ asPath }, this.logError);
    }
  }

  renderErrors(formattedError, route, asPath, className) {
    return formattedError.map((errData, i) => (
      <blockquote key={i} className={className}>
        {i === 0 && <p>Current route: &#96;{route}&#96;</p>}
        {i === 0 && <p>Current path: &#96;{asPath}&#96;</p>}
        <p>Error type: &#96;{errData.type}&#96;</p>
        <p>Error details: &#96;{errData.message}&#96;</p>
      </blockquote>
    ));
  }

  renderAppError(error, route, asPath, pageProps) {
    const formattedError = this.formatError(error);
    return (
      <Page {...pageProps} navLeft="reload">
        <h2 className="major">Application Error</h2>
        <p>The application threw an uncaught error.  Below are all the errors involved.</p>
        {this.renderErrors(formattedError, route, asPath, errorBlockQuote.className)}
        {/* TODO: Add error submission button. */}
        {errorBlockQuote.styles}
      </Page>
    );
  }

  renderHttpError(statusCode, asPath, pageProps) {
    return (
      <Page {...pageProps} navLeft="back">
        <h2 className="major">HTTP Error {statusCode}</h2>
        <p>There is no page associated with the path <code>{asPath}</code>.</p>
        <p>Please press the close button in the upper-right to return to the site's index or navigate back to the page your came from.</p>
      </Page>
    );
  }

  renderNoError(pageProps) {
    return (
      <Page {...pageProps} navLeft="none">
        <h2 className="major">Error Happen!?</h2>
        <p>Welcome to the error page!</p>
        <p>No error appears to have been provided, so either a bug brought you here without providing an error to display or you found an easter egg.  Whichever the case, please press the close button in the upper-right to return to the site's index if you'd like to continue browsing this website.</p>
      </Page>
    );
  }

  renderPage({data, route}, {asPath}, pageProps) {
    switch (true) {
      case asPath::is.undefined():
        // Awaiting a proper `asPath` before rendering.
        return null;
      case !data::is.defined():
        return this.renderNoError(pageProps);
      case Object.is(data.type, $appError):
        return this.renderAppError(data.error::errorEx.asError(), route, asPath, pageProps);
      case Object.is(data.type, $httpError):
        return this.renderHttpError(data.statusCode, asPath, pageProps);
      default:
        return this.renderAppError(data::errorEx.asError(), route, asPath, pageProps);
    }
  }

  render() {
    const { ownProps, pageProps } = this.decomposeProps(this.props);
    return this.renderPage(ownProps, this.state, pageProps);
  }

}

const errorType = (error) => {
  if (error::is.dict()) return "(anonymous object)";
  if (error.constructor?.name) return error.constructor.name;
  return "(anonymous class)";
};

const errorMessage = (error) => {
  if (error::is.error()) return error.message;
  if (error::is.string()) return error;
  if (error::is.dict()) return `string representation: \`${JSON.stringify(error)}\``;
  return `string representation: \`${error.toString()}\``;
};

const errorStack = (error) => (error::is.error() && error.stack) || "(no stack data)";

const convertToError = (data, route, asPath) => {
  switch (true) {
    case !data:
      return void 0;
    case Boolean(data.error):
      return data.error::errorEx.asError();
    case data.type === $httpError && !asPath:
      return new Error([
        `HTTP error code \`${data.statusCode}\``,
        `route provided to error-page is \`${route}\``
      ].join("; "));
    case data.type === $httpError:
      return new Error([
        `HTTP error code \`${data.statusCode}\` when accessing path \`${asPath}\``,
        `route provided to error-page is \`${route}\``
      ].join("; "));
    default:
      return data::errorEx.asError();
  }
};

export default ErrorPage;