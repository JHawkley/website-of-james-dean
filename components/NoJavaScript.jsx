// Special component for rendering a page when no JavaScript is detected.

export default function NoJavaScript() {
  return (
    <div id="main" className="article-timeout" style={{display: "flex"}}>
      <article id="no-js" className="active">
        <h2 className="major">JavaScript Disabled</h2>
        <p>JavaScript appears to be disabled during this visit.</p>
        <p>This site is a single-page web application and requires JavaScript to render properly.  If you wish to experience this web page, please add this domain as an exception to your browser's JavaScript blocker and then refresh the page.</p>
        <h3>Site Summary</h3>
        <p>This is the personal web site for James Dean, a programmer out of the Dallas/Fort Worth area in Texas, USA.  It showcases my work to potential employers or those otherwise interested in a programmer for a project.</p>
        <p>It is driven by the React JavaScript framework and has a few programming demonstrations that make use of per-frame animation; this site may, at times, consume a bit more of your device's power than the average website.</p>
        <p>I try my best to use JavaScript responsibly.</p>
      </article>
    </div>
  );
}