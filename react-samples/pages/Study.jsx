import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Redirect, useParams, useHistory, Link,
} from 'react-router-dom';

import Loader from 'ogury-ui-kit/lib/js/ui/loader';
import useCountdown from './useCountdown';
import TrustedStudy from './TrustedStudy';
import TopBar from './TopBar';


function isTableauSDKFullyLoaded() {
  return !!(window.tableau && window.tableau.Viz);
}

const TABLEAU_SDK_COUNTDOWN_STEP = 1000;
const TABLEAU_SDK_COUNTDOWN_DURATION = 10000;

function Study({
  study,
  loading,
  error,
  fetchStudyByUUIDRequest,
  deselectStudy,
  studiesToggleFavoriteRequest,
  stories,
  worksheetsAndDashboards,
  showLayoutNavigation,
  toggleLayoutNavigation,
  explore,
  initializeMenuFromExplore,
  urls,
}) {
  const [exportStudyClicked, setExportStudyClicked] = useState(0);
  const [displayTrustedStudy, setDisplayTrustedStudy] = useState(false);
  const [tableauLoaded, setTableauLoaded] = useState(isTableauSDKFullyLoaded());
  const { uuid, story, point } = useParams();
  const history = useHistory();

  const countdown = useCountdown(TABLEAU_SDK_COUNTDOWN_STEP, TABLEAU_SDK_COUNTDOWN_DURATION, () => {
    window.location.reload();
  });

  useEffect(() => {
    setTableauLoaded(isTableauSDKFullyLoaded());
  }, [countdown.remainingMs]);

  const cleanupCallback = useCallback(() => {
    deselectStudy();
    showLayoutNavigation();
  }, [deselectStudy, showLayoutNavigation]);

  useEffect(() => () => { cleanupCallback(); }, [cleanupCallback]);

  useEffect(() => {
    setDisplayTrustedStudy(false);
  }, [story, point]);

  if (error) {
    return (
      <Redirect to="/studies" />
    );
  }

  if (!study) {
    if (!loading) {
      fetchStudyByUUIDRequest(uuid);
    }
    return (
      <div className="layout-content-box">
        {loading && <Loader isLoading />}
      </div>
    );
  }

  if (!tableauLoaded) {
    const remainingSeconds = Math.round(countdown.remainingMs / 1000);
    return (
      <div className="layout-content-box">
        <div className="jumbotron">
          <h1 className="display-4">Unable to display Tableau study</h1>
          <p className="lead">Error: Tableau JavaScript API is not present in window</p>
          <hr className="my-4" />
          <p>{remainingSeconds ? `Autorefreshing in: ${remainingSeconds}...` : 'Autorefreshing...'}</p>
          <Link to="/" className="btn btn-primary btn-lg">Overview</Link>
          <a className="btn btn-primary btn-lg" href={history.location.pathname} role="button">Refresh</a>
        </div>
      </div>
    );
  }

  if (countdown.isRunning && tableauLoaded) {
    countdown.cancel();
  }

  const onPointActivatedHandler = (activatedStory, activatedPoint) => {
    setDisplayTrustedStudy(true);

    const { pathname } = history.location;
    const pathUpToUUID = pathname.substring(0, pathname.indexOf(uuid));
    let nextPath = `${pathUpToUUID}/${uuid}/`;
    if (activatedStory !== null) {
      nextPath += `${activatedStory}/`;
      if (activatedPoint !== null) {
        nextPath += `${activatedPoint}/`;
      }
    }

    history.replace(nextPath.replace('//', '/'));
  };

  const onFullscreenClickHandler = () => {
    toggleLayoutNavigation();
  };

  const onFavoriteClickHandler = () => {
    studiesToggleFavoriteRequest(study.id);
  };

  const onExportStudyHandler = () => {
    setExportStudyClicked(exportStudyClicked + 1);
  };

  return (
    <div className="study">
      <TopBar
        onFullscreenClickHandler={onFullscreenClickHandler}
        onFavoriteClickHandler={onFavoriteClickHandler}
        onExportStudyHandler={onExportStudyHandler}
        study={study}
      />
      <Loader isLoading={!displayTrustedStudy || explore} />
      <TrustedStudy
        tableau={window.tableau}
        ticket={study.ticket}
        contentUrl={study.contentUrl}
        uuid={uuid}
        stories={stories}
        urls={urls}
        intendedStory={story}
        intendedPoint={point}
        explore={explore}
        exportStudyClicked={exportStudyClicked}
        display={displayTrustedStudy && !explore}
        onPointActivated={onPointActivatedHandler}
        worksheetsAndDashboards={worksheetsAndDashboards}
        onExplore={initializeMenuFromExplore}
      />
    </div>
  );
}

Study.defaultProps = {
  study: null,
  error: false,
};

Study.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  study: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  stories: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  urls: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  worksheetsAndDashboards: PropTypes.object.isRequired,
  error: PropTypes.bool,
  loading: PropTypes.bool.isRequired,
  fetchStudyByUUIDRequest: PropTypes.func.isRequired,
  deselectStudy: PropTypes.func.isRequired,
  studiesToggleFavoriteRequest: PropTypes.func.isRequired,
  explore: PropTypes.bool.isRequired,
  showLayoutNavigation: PropTypes.func.isRequired,
  toggleLayoutNavigation: PropTypes.func.isRequired,
  initializeMenuFromExplore: PropTypes.func.isRequired,
};

export default Study;
