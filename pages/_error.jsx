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

  decomposeProps = memoize((ownProps) => {
    const { data, route, asPath, ...pageProps } = ownProps;
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

  logError({data, route, asPath}) {
    try {
      const error = convertToError(data, route, asPath);
      if (!error) return;
      error::errorEx.foreach(console.error);
    }
    catch { void 0; }
  }

  componentDidMount() {
    const { ownProps } = this.decomposeProps(this.props);
    this.logError(ownProps);
  }

  componentDidUpdate(prevProps) {
    const { ownProps } = this.decomposeProps(this.props);
    const { ownProps: prevOwnProps } = this.decomposeProps(prevProps);

    if (!compareOwnProps(prevOwnProps, ownProps))
      this.logError(ownProps);
  }

  renderErrors(formattedError, {route, asPath}, className) {
    return formattedError::errorEx.map((errData, depth) => (
      <blockquote key={depth} className={className}>
        {depth === 0 && <p>Current route: &#96;{route}&#96;</p>}
        {depth === 0 && <p>Current path: &#96;{asPath}&#96;</p>}
        <p>Error type: &#96;{formattedError.type}&#96;</p>
        <p>Error details: &#96;{formattedError.message}&#96;</p>
      </blockquote>
    ));
  }

  renderAppError(error, ownProps, pageProps) {
    const formattedError = this.formatError(error);
    return (
      <Page {...pageProps} navLeft="reload">
        <h2 className="major">Application Error</h2>
        <p>The application threw an uncaught error.  Below are all the errors involved.</p>
        {this.renderErrors(formattedError, ownProps, errorBlockQuote.className)}
        {/* TODO: Add error submission button. */}
        {errorBlockQuote.styles}
      </Page>
    );
  }

  renderHttpError(statusCode, {asPath}, pageProps) {
    return (
      <Page {...pageProps} navLeft="back">
        <h2 className="major">HTTP Error {statusCode}</h2>
        <p>There is no page associated with the path <code>{asPath}</code>.</p>
        <p>Please press the close button in the upper-right to return to the site's index or navigate back to the page your came from.</p>
      </Page>
    );
  }

  renderNoError(ownProps, pageProps) {
    return (
      <Page {...pageProps} navLeft="none">
        <h2 className="major">Error Happen!?</h2>
        <p>Welcome to the error page!</p>
        <p>No error appears to have been provided, so either a bug brought you here without providing an error to display or you found an easter egg.  Whichever the case, please press the close button in the upper-right to return to the site's index if you'd like to continue browsing this website.</p>
      </Page>
    );
  }

  renderPage(ownProps, pageProps) {
    const { data } = ownProps;
    switch (true) {
      case !data:
        return this.renderNoError(ownProps, pageProps);
      case Object.is(data.type, $appError):
        return this.renderAppError(data.error::errorEx.asError(), ownProps, pageProps);
      case Object.is(data.type, $httpError):
        return this.renderHttpError(data.statusCode, ownProps, pageProps);
      default:
        return this.renderAppError(data::errorEx.asError(), ownProps, pageProps);
    }
  }

  render() {
    const { ownProps, pageProps } = this.decomposeProps(this.props);
    return this.renderPage(ownProps, pageProps);
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