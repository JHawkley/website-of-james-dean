import { Fragment } from "react";
import ReactDOMServer from "react-dom/server";
import flushStyles from "styled-jsx/server";
import Document, { Head, Main, NextScript } from "next/document";
import siteStyle from "styles/static/main.scss";
import faStyle from "styles/font-awesome?as-css";
import lightboxStyle from "react-image-lightbox/style.css";

import AppRoot from "components/AppRoot";
import Wrapper from "components/Wrapper";
import Background from "components/Background";
import Page from "components/Page";
import NoScriptPage from "pages/_noscript";

export default class StyledDocument extends Document {

  renderNoScript() {
    // Based on: https://github.com/facebook/react/issues/11423#issuecomment-341760646
    const { render, exitDelay } = { ...Page.transition, ...NoScriptPage.transition };

    const app = ReactDOMServer.renderToString(
      <AppRoot>
        <Wrapper>
          {render(NoScriptPage, {}, exitDelay, "entered")}
        </Wrapper>
        <Background className="blur" immediate />
        <style jsx global>{`#__next { display: none !important; }`}</style>
      </AppRoot>
    );

    const staticMarkup = ReactDOMServer.renderToStaticMarkup(
      <Fragment>
        { flushStyles() }
        <div id="__noscript" dangerouslySetInnerHTML={{__html: app}} />
      </Fragment>
    );

    return <noscript dangerouslySetInnerHTML={{ __html: staticMarkup }} />;
  }

  render() {
    return (
      <html>
        <Head>
          <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,600,600i" rel="stylesheet" />
          <style dangerouslySetInnerHTML={{ __html: siteStyle }} />
          <style dangerouslySetInnerHTML={{ __html: lightboxStyle }} />
          <style dangerouslySetInnerHTML={{ __html: faStyle }} />
        </Head>
        <body>
          { this.renderNoScript() }
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }

}