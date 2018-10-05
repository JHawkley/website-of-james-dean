import Router from "next/router";
import Head from "next/head";
import stylesheet from 'styles/main.scss';
import lightboxStyle from "react-image-lightbox/style.css";

import Header from "../components/Header";
import Main from "../components/Main";
import Footer from "../components/Footer";

class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isArticleVisible: false,
      timeout: false,
      articleTimeout: false,
      article: "",
      loading: "is-loading"
    };
    this.setState = ::this.setState;
    this.tryStateUpdate = ::this.tryStateUpdate;
    this.doStateUpdate = ::this.doStateUpdate;
  }

  componentDidMount() {
    if (typeof window.history.scrollRestoration !== "undefined")
      window.history.scrollRestoration = "manual";
    Router.router.events.on("hashChangeComplete", this.tryStateUpdate);
    
    this.timeoutId = setTimeout(this.setState, 100, { loading: "" });
    // Restore location.
    this.tryStateUpdate();
  }

  componentWillUnmount() {
    Router.router.events.off("hashChangeComplete", this.tryStateUpdate);
    
    if (this.timeoutId)
      clearTimeout(this.timeoutId);
  }
  
  tryStateUpdate() {
    if (this.transitionStarted) return;
    this.transitionStarted = true;
    this.doStateUpdate();
  }
  
  doStateUpdate() {
    const article = this.getHash();
    const finalState = !!article;
    
    if (this.state.timeout && !this.state.articleTimeout) {
      // Middle transition state.
      this.setState({ article }, () => {
        // Fixes a small presentation issue on narrow-screen devices.
        window.scrollTo(window.scrollX, 0);
        // Transition to our final, desired state.
        this.setState(
          { timeout: finalState, articleTimeout: finalState },
          () => setTimeout(this.doStateUpdate, 25)
        );
      });
    }
    else if (finalState && !this.state.timeout) {
      // Transitioning from header.
      this.setState(
        { isArticleVisible: true },
        () => setTimeout(this.setState, 325, { timeout: true }, this.doStateUpdate)
      );
    }
    else if (this.state.article !== article && this.state.articleTimeout) {
      // Transitioning from article.
      this.setState({ articleTimeout: false }, () => setTimeout(this.doStateUpdate, 325));
    }
    else if (!finalState && this.state.isArticleVisible) {
      // Finish transition into header.
      this.setState({ isArticleVisible: false }, this.doStateUpdate);
    }
    else {
      this.transitionStarted = false;
    }
  }
  
  getHash() {
    const articleHash = window.location.hash;
    return articleHash.length > 1 && articleHash.startsWith("#") ? articleHash.substring(1) : "";
  }
  
  render() {
    const { loading, isArticleVisible, timeout, articleTimeout, article, historyLength } = this.state;
  
    return (
      <div className={`body ${loading} ${isArticleVisible ? "is-article-visible" : ""}`}>
        <div className="prevent-scroll">
          <Head>
            <title>Next.js Starter</title>
            <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,600,600i" rel="stylesheet" />
          </Head>

          <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
          <style dangerouslySetInnerHTML={{ __html: lightboxStyle }} />
          <style dangerouslySetInnerHTML={{ __html: "body { overflow-y: scroll; }"}} />

          <div id="wrapper">
            <Header timeout={timeout} />
            <Main
              isArticleVisible={isArticleVisible}
              timeout={timeout}
              articleTimeout={articleTimeout}
              article={article}
              historyLength={historyLength}
            />
            <Footer timeout={timeout} />
          </div>

          <div id="bg" />
        </div>
      </div>
    );
  }
}

export default IndexPage;
