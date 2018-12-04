import PropTypes from "prop-types";
import Link from "next/link";
import { parse as parseUrl } from "url";
import { dew } from "tools/common";
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
    const parentName = getPageName(parentArticle);
    if (parentArticle::maybe.isDefined() && parentName::maybe.isEmpty())
      throw new Error([
        "only a named page can be a parent to a page",
        "pass either the page-component itself or a name as a string"
      ].join("; "));

    Object.defineProperty(this, "pageName", { value: articleName, writable: false });
    Object.defineProperty(this, "isCurrentPage", { get: () => this.props.active });
    Object.defineProperty(this, "parent", { value: parentName, writable: false });
  }

  render() {
    const { pageName, parent, props: { active } } = this;

    const back = parent::maybe.isDefined()
      ? (<Link href={Page.hrefFor(null, parent)} scroll={false}><div className="back"></div></Link>)
      : nothing;
    
    const close = <Link href="./" scroll={false}><div className="close"></div></Link>;
    
    const klass = "active"::maybe.when(active);
    
    return (
      <article id={pageName} className={klass}>
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
      const parent = dew(() => {
        if (parentPage::maybe.isEmpty()) return nothing;
        if (typeof parentPage === "string") return parentPage;
        if (Page.isPage(parentPage)) return parentPage;
        if (typeof parentPage === "function") {
          const result = parentPage();
          if (Page.isPage(result)) return result;
        }
        throw new Error([
          "could not derive a Page class from the `parentPage` argument",
          "watch out for circular dependencies!"
        ].join("; "));
      });
      super(props, articleName, parent);
    }
  }
}

const attachPageQuery = (urlObj, page) => {
  if (typeof urlObj.query === "string") {
    if (urlObj.query.length > 0)
      urlObj.query += "&";
    urlObj.query += `page=${page}`;
    return urlObj;
  }

  urlObj.query = Object.assign(urlObj.query ?? {}, { page });
  return urlObj;
};

const getPageName = (page) => {
  if (typeof page === "string") return page;
  if (Page.isPage(page)) return page.pageName;
  return nothing;
};

Page.isPage = (obj) => typeof obj === "function" && BasePage.isPrototypeOf(obj);

Page.hrefFor = (href = nothing, page = nothing) => {
  const pageName = page::maybe.map(getPageName);

  if (page::maybe.isDefined() && pageName::maybe.isEmpty())
    throw new Error(`could not build \`href\` for a page; \`${page}\` is not a page-component or a string`);

  if (href::maybe.isEmpty()) {
    if (pageName::maybe.isEmpty())
      throw new Error("expected an `href` and/or `page` property, but got neither");
    return `./?page=${pageName}`;
  }

  if (typeof href === "string") {
    if (pageName::maybe.isEmpty()) return href;
    return attachPageQuery(parseUrl(href, true), pageName);
  }

  if (typeof href === "object") {
    if (pageName::maybe.isEmpty()) return href;
    return attachPageQuery(href, pageName);
  }
};

export default Page;