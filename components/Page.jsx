import PropTypes from "prop-types";
import Link from "next/link";

const Page = (props) => {
  const { id, children, parent, article } = props;

  const back = parent != null
    ? (<Link href={`./#${parent}`}><div className="back"></div></Link>)
    : null;
  
  const close = <Link href="./"><div className="close"></div></Link>;
  
  const klass = article === id ? "active" : null;
  
  return (
    <article id={id} className={klass} style={{display:'none'}}>
      {back}
      {close}
      {children}
    </article>
  );
}

Page.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  article: PropTypes.string.isRequired,
  parent: PropTypes.string
};

export default Page;