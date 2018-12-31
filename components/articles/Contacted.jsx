import Article from "components/Article";

const Contacted = (props) => (
  <Article {...props}>
    <h2 className="major">Thank You</h2>
    <p>Your message was sent successfully.  I'll try to reply to your inquiry when I can.</p>
    <p>Please hit the close button in the upper-right to return to the landing page.</p>
  </Article>
);

export default Contacted;