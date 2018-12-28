import Document, { Head, Main, NextScript } from "next/document";
import siteStyle from "styles/main.scss";
import lightboxStyle from "react-image-lightbox/style.css";

export default class StyledDocument extends Document {

  render() {
    return (
      <html>
        <Head>
          <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,600,600i" rel="stylesheet" />
        </Head>
        <body>
          <style dangerouslySetInnerHTML={{ __html: siteStyle }} />
          <style dangerouslySetInnerHTML={{ __html: lightboxStyle }} />
          <style dangerouslySetInnerHTML={{ __html: "body { overflow-y: scroll; }"}} />
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }

}