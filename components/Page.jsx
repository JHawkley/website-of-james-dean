import PropTypes from "prop-types";
import Link from "next/link";
import { extensions as maybe, nothing } from "tools/maybe";

class BasePage extends React.PureComponent {

  static propTypes = {
    active: PropTypes.bool
  };

  static defaultProps = {
    active: false
  };

  constructor(props, articleName, parentArticle) {
    super(props);
    if (parentArticle != null && typeof parentArticle !== "string")
      throw new Error("only a named page can be a parent to a page;" +
        "pass either the page-component itself or a name as a string");

    Object.defineProperty(this, "pageName", { value: articleName, writable: false });
    Object.defineProperty(this, "isCurrentPage", { get: () => this.props.active });
    Object.defineProperty(this, "parent", { value: parentArticle, writable: false });
  }

  render() {
    const { pageName, parent, props: { active } } = this;

    const back = parent::maybe.isDefined()
      ? (<Link href={`./#${parent}`}><div className="back"></div></Link>)
      : nothing;
    
    const close = <Link href="./"><div className="close"></div></Link>;
    
    const klass = "active"::maybe.when(active);
    
    return (
      <article id={pageName} className={klass} style={{display: "none"}}>
        {back}
        {close}
        {this.content()}
      </article>
    );
  }

  content() { return nothing; }

}

const Page = (articleName, parentPage = null) => {
  return class NamedPage extends BasePage {
    static get pageName() { return articleName; }

    constructor(props) {
      super(props, articleName, Page.isPage(parentPage) ? parentPage.pageName : parentPage);
    }
  }
}

Page.isPage = (obj) => typeof obj === "function" && BasePage.isPrototypeOf(obj);

export default Page;