import Page from "components/Page";

const ErrorSubmittedPage = (props) => (
  <Page {...props}>
    <h2 className="major">Thank You</h2>
    <p>The error report was submitted successfully.</p>
    <p>Please hit the close button in the upper-right to return to the landing page.</p>
  </Page>
);

export default ErrorSubmittedPage;