import Document, { Head, Main, NextScript } from "next/document";
import siteStyle from "styles/main.scss";
import lightboxStyle from "react-image-lightbox/style.css";
import flush from 'styled-jsx/server';

export default class StyledDocument extends Document {

  static async getInitialProps(ctx) {
    const props = await super.getInitialProps(ctx);
    return { ...props, styles: flush() };
  }

  render() {
    return (
      <html>
        <Head>
          <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,600,600i" rel="stylesheet" />
          <style dangerouslySetInnerHTML={{ __html: siteStyle }} />
          <style dangerouslySetInnerHTML={{ __html: lightboxStyle }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }

}