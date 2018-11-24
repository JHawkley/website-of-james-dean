import PropTypes from "prop-types";
import Link from "next/link";
import { extensions as maybe, nothing } from "tools/maybe";

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

      const back = parent::maybe.isDefined()
        ? (<Link href={`./#${parent}`}><div className="back"></div></Link>)
        : nothing;
      
      const close = <Link href="./"><div className="close"></div></Link>;
      
      const klass = "active"::maybe.when(articleName === activeArticle);
      
      return (
        <article id={articleName} className={klass} style={{display:'none'}}>
          {back}
          {close}
          {this.content()}
        </article>
      );
    }

    content() { return nothing; }

  }

  return NamedPage;
}

Page.knownArticles = knownArticles;

export default Page;