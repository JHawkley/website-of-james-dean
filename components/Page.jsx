import PropTypes from "prop-types";
import { withRouter } from "next/router";
import { resolve as urlResolve } from "url";
import Jump from "components/Jump";
import { ImageSync } from "components/AsyncImage";
import { extensions as objEx, dew } from "tools/common";
import { extensions as maybe, nothing } from "tools/maybe";

const Page = (props) => {
  const { active, id, parent, children } = props;

  const back = parent::maybe.isDefined()
    ? (<Goto page={parent} scroll={false}><div className="back"></div></Goto>)
    : nothing;
  
  const close = <Goto scroll={false}><div className="close"></div></Goto>;
  
  const klass = "active"::maybe.when(active);
  
  return (
    <article id={id} className={klass}>
      {back}
      {close}
      {children}
    </article>
  );
};

Page.propTypes = {
  id: PropTypes.string.isRequired,
  parent: PropTypes.string,
  active: PropTypes.bool,
  imageSync: PropTypes.instanceOf(ImageSync),
  children: PropTypes.node
};

Page.defaultProps = {
  active: false
};

const Goto = withRouter((props) => {
  const { page, hash, router, ...restProps } = props;

  const basePath = router.pathname;

  const [href, as] = dew(() => {
    const haveHash = hash::maybe.isDefined();
    const indexPage = !page;
    switch (true) {
      case (!haveHash && !indexPage): return [`${basePath}/${page}`, urlResolve(basePath, `./${page}.html`)];
      case (!haveHash && indexPage): return basePath::objEx.times(2);
      case (haveHash && indexPage): return `${basePath}#${hash}`::objEx.times(2);
      default: return [`${basePath}/${page}#${hash}`, `./${page}.html#${hash}`];
    }
  });
  
  return <Jump {...restProps} href={href} as={as} />
});

Goto.propTypes = {
  page: PropTypes.string,
  hash: PropTypes.string
};

Goto.defaultProps = {
  page: ""
};

const pageDataFor = (name) => Object.freeze({ name, isPage: true });

const indexPageData = Object.freeze({ name: "index", isPage: false });

export default Page;
export { Goto, pageDataFor, indexPageData };