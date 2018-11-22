import PropTypes from "prop-types";
import Lightbox from "./Lightbox";

import IntroPage from "./pages/Intro";
import WorkPage from "./pages/Work";
import TerraVuPage from "./pages/TerraVu";
import LithologicPage from "./pages/Lithologic";
import LithologicPhotoPage from "./pages/LithologicPhoto";
import SolarPage from "./pages/Solar";
import ThreeDeePage from "./pages/ThreeDee";
import NatePage from "./pages/Nate";
import MiscProgrammingPage from "./pages/MiscProgramming";
import AboutPage from "./pages/About";
import QuestionsPage from "./pages/Questions";
import ContactPage from "./pages/Contact";
import ContactedPage from "./pages/Contacted";
import FourOhFourPage from "./pages/FourOhFour";

class Main extends React.Component {

  componentDidUpdate(prevProps) {
    // In the case the route begins to transition, close the lightbox.
    if (this.props.articleTimeout !== prevProps.articleTimeout)
      if (!this.props.articleTimeout)
        Lightbox.forceClose();
  }
  
  render() {
    const { article, timeout, articleTimeout } = this.props;
    const klass = articleTimeout ? "article-timeout" : null;

    return (
      <div id="main" className={klass} style={{display: timeout ? "flex" : "none"}}>

        <IntroPage article={article} />

        <WorkPage article={article} />

        <TerraVuPage parent="work" article={article} />
        <LithologicPage parent="work" article={article} />
        <LithologicPhotoPage parent="work" article={article} />
        <SolarPage parent="work" article={article} />
        <ThreeDeePage parent="work" article={article} />
        <NatePage parent="work" article={article} />
        <MiscProgrammingPage parent="work" article={article} />

        <AboutPage article={article} />

        <QuestionsPage article={article} />

        <ContactPage article={article} />

        <ContactedPage article={article} />

        <FourOhFourPage article={article} />
        
        <Lightbox />

      </div>
    );
  }
}

Main.propTypes = {
  route: PropTypes.object,
  article: PropTypes.string,
  articleTimeout: PropTypes.bool,
  timeout: PropTypes.bool
};

export default Main;
