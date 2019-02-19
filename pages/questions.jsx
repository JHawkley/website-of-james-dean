import Page from "components/Page";
import Jump from "components/Jump";
import styleVars from "styles/vars.json";

const QuestionsPage = (props) => (
  <Page {...props}>
    <h2 className="major">Questions &amp; Answers</h2>
    <p>Below I'll answer some questions that I suspect might be pretty common.</p>
    <dl>
      <dt>Are you able to move?</dt>
      <dd>I currently have a house and three roommates.  Moving would be a significant inconvenience for a lot of people.  I would be resistant to the idea of moving, but with the right offer and support during the move, I could be persuaded.</dd>
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
      <dd>Not the greatest.  I've worked closely with a back-end developer before and am familiar with a lot of the technologies involved and a number of the security pitfalls to avoid, but aside from some of my own toy projects, I haven't done much back-end development or systems administration of server environments.</dd>
      <dd>In a pinch, I feel like I could manage it, but I would be slower and more error-prone than someone with more focused experience, and this part of your web application infrastructure really does require the best talent.</dd>
      <dd>I feel that I would be best suited in a support role with more veteran back-end developers, where I could work under their guidance and learn from them, while taking some of the less critical workloads off their shoulders.</dd>

      <dt>Do you have Unity experience?</dt>
      <dd>Very little direct experience.  I've been keeping tabs on it and ran through a few of the tutorials, but I have yet to build anything in it.  Most of my experience has been related to creating source-level mods for Unity-powered games using the <Jump href="https://github.com/pardeike/Harmony">Harmony library</Jump>, which isn't the best experience, but it's something!</dd>
      <dd>I suppose I haven't started with it yet because I'm waiting for <Jump href="https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-7">C# 7</Jump> support, which is slated to come in <Jump href="https://blogs.unity3d.com/2018/09/13/unity-2018-3-beta-get-early-access-now/">Unity 2018.3</Jump>.  After my time with Scala, working in C# 6 and lower just seems like a chore by comparison.</dd>
      <dd>But, if you need a Unity dev, I can likely manage it.  I will just be a little sad without my pattern-matching and out-variables is all  ...for a few months anyways.  They do have the open beta out now; surely it won't be too much longer!</dd>
    </dl>
    <style jsx>{`dl dd { margin-bottom: ${styleVars["size"]["element-margin"]}; }`}</style>
  </Page>
);

export default QuestionsPage;