import React from "react";
import PropTypes from "prop-types";
import { promised } from "components/Preloadable";
import Preloader from "components/Preloader";
import LoadingSpinner from "components/LoadingSpinner";

import { fadeTime, componentCss, containerCss } from "styles/jsx/components/Nate";

const GameRunnerPreloader = promised(
  () => import(/* webpackPrefetch: true */ "components/Nate/GameRunner"),
  { name: "Nate.GameRunner" }
);

class Nate extends React.PureComponent {

  static propTypes = {
    onError: PropTypes.func,
    onLoad: PropTypes.func
  };

  state = {
    error: null,
    loaded: false,
    container: null
  };

  containerRef = (el) => this.setState({ container: el });

  handleError = (error) => {
    if (this.state.error) return;
    this.setState({ error }, () => this.props.onError?.(error));
  }

  handleLoad = () => {
    if (this.state.loaded) return;
    this.setState({ loaded: true }, this.props.onLoad);
  }

  renderGame = (module, props) => {
    if (!module) return null;
    const GameRunner = module.default || module;
    return <GameRunner {...props} />;
  }

  renderContainer(handleError, loaded) {
    const { containerRef, renderGame, state: { container } } = this;
    const className = [containerCss.className, !loaded && "loading"].filter(Boolean).join(" ");
    
    return (
      <div ref={containerRef} className={className}>
        <GameRunnerPreloader
          onPreloadError={handleError}
          onGameError={handleError}
          container={container}
          render={renderGame}
        />
      </div>
    );
  }

  render() {
    const { handleError, handleLoad, state: { error, loaded } } = this;
    
    return (
      <Preloader onError={handleError} onLoad={handleLoad} className={componentCss.className} display={!error}>
        <LoadingSpinner size="2x" fadeTime={fadeTime} show={!loaded} background />
        {this.renderContainer(handleError, loaded)}
        {componentCss.styles}
        {containerCss.styles}
      </Preloader>
    );
  }

}

export default Nate;
