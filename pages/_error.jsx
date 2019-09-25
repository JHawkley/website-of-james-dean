import React from "react";
import NextErrorPage from "next/error";
import { is, global } from "tools/common";
import { memoize } from "tools/functions";
import { extensions as errorEx } from "tools/errors";
import PropTypes from "tools/propTypes";
import Page from "components/Page";
import SpreeForm from "components/SpreeForm";
import { errorBlockQuote } from "styles/jsx/lib/errorBlockQuote";

import { formTarget as $target } from "tools/formSpree";
import { asPath as $errorsubmitted } from "pages/errorsubmitted?jump";

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

  constructor(props) {
    super(props);
    this.state = { pathName: getPathName(props.asPath) };
  }

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
      const { props: { data, route }, state: { pathName } } = this;
      const error = convertToError(data, route, pathName);
      if (!error) return;

      // eslint-disable-next-line no-console
      error::errorEx.foreach(e => console.error(e));
    }
    catch { void 0; }
  }

  componentDidMount() {
    this.logError();
  }

  componentDidUpdate(prevProps) {
    const { props: curProps } = this;
    if (curProps === prevProps) return;

    switch (true) {
      case !Object.is(curProps.asPath, prevProps.asPath):
        this.setState({ pathName: getPathName(curProps.asPath) }, this.logError);
        break;
      case !Object.is(curProps.data, prevProps.data):
      case !Object.is(curProps.route, prevProps.route):
        this.logError();
        break;
    }
  }

  renderErrors(formattedError, route, pathName, className) {
    return formattedError.map((errData, i) => (
      <blockquote key={i} className={className}>
        {i === 0 && <p>Current route: &#96;{route}&#96;</p>}
        {i === 0 && <p>Current path: &#96;{pathName}&#96;</p>}
        <p>Error type: &#96;{errData.type}&#96;</p>
        <p>Error details: &#96;{errData.message}&#96;</p>
      </blockquote>
    ));
  }

  renderAppError(error, route, pathName, pageProps) {
    const formattedError = this.formatError(error);
    const forSubmission = errorForSubmission(formattedError);
    return (
      <Page {...pageProps} navLeft="reload">
        <h2 className="major">Application Error</h2>
        <p>The application threw an uncaught error.  Below are all the errors involved.</p>
        {this.renderErrors(formattedError, route, pathName, errorBlockQuote.className)}
        {forSubmission && (
          <SpreeForm validate={this.validate} method="post" action={$target} next={$errorsubmitted} hidden>
            <input type="hidden" name="route" id="route" value={route} />
            <input type="hidden" name="path" id="path" value={pathName} />
            <input type="hidden" name="error" id="error" value={forSubmission} />
            <ul className="actions">
              <li><SpreeForm.SendButton value="Submit Error Report" className="special" /></li>
            </ul>
          </SpreeForm>
        )}
        {errorBlockQuote.styles}
      </Page>
    );
  }

  renderHttpError(statusCode, pathName, pageProps) {
    return (
      <Page {...pageProps} navLeft="back">
        <h2 className="major">HTTP Error {statusCode}</h2>
        <p>There is no page associated with the path <code>{pathName}</code>.</p>
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

  renderFailure(e, pageProps) {
    // eslint-disable-next-line no-console
    console.error(e);

    return (
      <Page {...pageProps} navLeft="none">
        <h2 className="major">Error in Error</h2>
        <p>An error occurred while trying to render an error; this should not happen.</p>
        <p>In order to prevent an infinite error loop, this simple page is being rendered instead.  Many apologies for this issue.  The error that was thrown during the render has been logged to the browser console.</p>
      </Page>
    );
  }

  render() {
    const {
      props: { data, route, asPath, ...pageProps },
      state: { pathName }
    } = this;

    try {
      switch (true) {
        case !data::is.defined():
          return this.renderNoError(pageProps);
        case Object.is(data.type, $appError):
          return this.renderAppError(data.error::errorEx.asError(), route, pathName, pageProps);
        case Object.is(data.type, $httpError):
          return this.renderHttpError(data.statusCode, pathName, pageProps);
        default:
          return this.renderAppError(data::errorEx.asError(), route, pathName, pageProps);
      }
    }
    catch (e) {
      return this.renderFailure(e, pageProps);
    }
  }

}

const getPathName = (asPath) => {
  switch (true) {
    case !asPath::is.string():
    case asPath === "/404.html":
    case asPath === "(unknown)":
      if (global.location?.pathname::is.string())
        return global.location.pathname;
      else
        return "(unknown)";
    default:
      return asPath;
  }
};

const errorForSubmission = (formattedError) => {
  try {
    const errDetails = [];

    for (const errData of formattedError) {
      if (errDetails.length > 0) errDetails.push("");
      errDetails.push(`type: ${errData.type}`);
      errDetails.push(`message: ${errData.message}`);
      errDetails.push(`stack: ${errData.stack}`);
    }
    
    return errDetails.join("\r\n");
  }
  catch {
    return void 0;
  }
};

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

const convertToError = (data, route, pathName) => {
  switch (true) {
    case !data:
      return void 0;
    case Boolean(data.error):
      return data.error::errorEx.asError();
    case data.type === $httpError && !pathName:
      return new Error([
        `HTTP error code \`${data.statusCode}\``,
        `route provided to error-page is \`${route}\``
      ].join("; "));
    case data.type === $httpError:
      return new Error([
        `HTTP error code \`${data.statusCode}\` when accessing path \`${pathName}\``,
        `route provided to error-page is \`${route}\``
      ].join("; "));
    default:
      return data::errorEx.asError();
  }
};

export default ErrorPage;