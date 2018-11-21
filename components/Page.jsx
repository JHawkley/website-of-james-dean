import PropTypes from "prop-types";
import Link from "next/link";

const knownArticles = new Set();

const Page = (articleName) => {
  if (knownArticles.has(articleName))
    throw new Error("an article with this name already defined elsewhere");
  knownArticles.add(articleName);

  class NamedPage extends React.PureComponent {

    static propTypes = {
      article: PropTypes.string.isRequired,
      parent: PropTypes.string
    };

    get name() { return articleName; }

    get isCurrentPage() { return this.props.article === articleName; }

    render() {
      const { parent, article: activeArticle } = this.props;

      const back = parent != null
        ? (<Link href={`./#${parent}`}><div className="back"></div></Link>)
        : null;
      
      const close = <Link href="./"><div className="close"></div></Link>;
      
      const klass = articleName === activeArticle ? "active" : null;
      
      return (
        <article id={articleName} className={klass} style={{display:'none'}}>
          {back}
          {close}
          {this.content()}
        </article>
      );
    }

    content() { return null; }

  }

  return NamedPage;
}

Page.knownArticles = knownArticles;

export default Page;