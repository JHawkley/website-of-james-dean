import PropTypes from "prop-types";
import { withRouter } from "next/router";
import { resolve as urlResolve } from "url";
import toLower from "lodash/toLower";
import Jump from "components/Jump";
import { dew } from "tools/common";
import { extensions as maybe, nothing } from "tools/maybe";

const Article = (props) => {
  const { active, id, parent, children } = props;

  const back = parent::maybe.isDefined()
    ? (<Goto article={parent} scroll={false}><div className="back"></div></Goto>)
    : nothing;
  
  const close = <Goto scroll={false}><div className="close"></div></Goto>;
  
  const className = "active"::maybe.when(active);
  
  return (
    <article id={id} className={className}>
      {back}
      {close}
      {children}
    </article>
  );
};

Article.propTypes = {
  id: PropTypes.string.isRequired,
  parent: PropTypes.string,
  active: PropTypes.bool,
  children: PropTypes.node
};

Article.defaultProps = {
  active: false
};


const Goto = dew(() => {
  const Goto = (props) => {
    const { article, hash, router, ...restProps } = props;
  
    const basePath = router.pathname;

    const href = {
      pathname: basePath,
      query: !article ? void 0 : { article },
      hash: hash::maybe.isEmpty() ? void 0 : hash
    };

    const as = {
      pathname: !article ? basePath : urlResolve(basePath, `./${toLower(article)}.html`),
      hash: hash::maybe.isEmpty() ? void 0 : hash
    };
    
    return <Jump {...restProps} href={href} as={as} />
  };

  return withRouter(Goto);
});

Goto.propTypes = {
  article: PropTypes.string,
  hash: PropTypes.string
};

Goto.defaultProps = {
  article: ""
};

export default Article;
export { Goto };