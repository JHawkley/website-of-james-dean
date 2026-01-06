import Page from "components/Page";
import Jump from "components/Jump";
import styleVars from "styles/vars.json";

const QuestionsPage = (props) => (
  <Page {...props}>
    <h2 className="major">Questions &amp; Answers</h2>
    <p>Below I'll answer some questions that I suspect might be pretty common.</p>
    <dl>
      <dt>Are you able to move?</dt>
      <dd>I've been settled into the Seattle area for 5 years now and currently have two roommates.  Moving would be pretty disruptive, but not outside the realm of possibility.  It all depends on the economics of the situation and the housing market isn't what I would call &quot;healthy&quot; right now.</dd>
      <dd>Telepresence would be a much more agreeable solution, though, if you can support it.</dd>

      <dt>Are you willing to learn a programming language?</dt>
      <dd>Certainly.  I should be able to pick up most popular imperative languages pretty readily.  I can't imagine it would take me very long to pick up <Jump href="https://swift.org/">Swift</Jump> or <Jump href="https://www.rust-lang.org/">Rust</Jump>, for instance.</dd>
      <dd>As most of my experience has been in these imperative languages, learning a purely functional language may take more time; if you need a Haskell developer on short notice, you may want to search elsewhere.</dd>
      <dd>I do have an interest in learning a functional language, but they tend to require a different style of thinking from what I'm used to.  I've slowly been wrapping my head around it, thanks to my work in Scala, but I fear it would still be some time before my competency reaches acceptable levels.</dd>

      <dt>Can you work in <code>&lt;javascript web framework&gt;</code>?</dt>
      <dd>Yes, I can work in <code>&lt;javascript web framework&gt;</code>, no problem.</dd>
      <dd>I've got experience in Backbone, Angular, Ember, and now React; I've been around and am pretty aware of how these frameworks are organized and operate.  JavaScript frameworks are a dime-a-dozen and it seems like a new one pops up every few months that is the new darling of the JavaScript community.  I have good generalized experience that should allow me to become effective in an unfamiliar framework in just a couple of days.</dd>
      <dd>In fact, case in point is this website.  It uses React, which I had never used before, but in only a couple days, I was already building useful components for this site and had basic routing operating.</dd>
      <dd>As long as you're not looking to use something exotic, like <Jump href="https://elm-lang.org/">Elm</Jump>, I should be able to manage.</dd>

      <dt>How is your experience with back-end development?</dt>
      <dd>My experience with backend development had grown significantly while working at Test Innovators.  While I still view front-end as my core strength, I know that I am more than capable of handling back-end development too.</dd>
      <dd>Beyond simply building out RESTful APIs for client applications or running SQL migrations, I've also worked a little in AWS.  I haven't yet set up my own full-stack from the ground up with it, but I can find my way around and do useful work to support such a stack.  And if I had to set up a stack from scratch, I am pretty sure I'd manage, <em>eventually</em>.</dd>

      <dt>Do you have Unity experience?</dt>
      <dd>Very little direct experience.  I've been keeping tabs on it and ran through a few of the tutorials, but I have yet to build anything in it.  Most of my experience has been related to VRChat avatars and creating source-level mods for Unity-powered games using the <Jump href="https://github.com/pardeike/Harmony">Harmony library</Jump>, which isn't the best experience, but it's something!</dd>
      <dd>If you need a Unity dev, I can likely manage it.  Just be patient as I settle in and learn the ropes.</dd>
    </dl>
    <style jsx>{`dl dd { margin-bottom: ${styleVars["size"]["element-margin"]}; }`}</style>
  </Page>
);

export default QuestionsPage;