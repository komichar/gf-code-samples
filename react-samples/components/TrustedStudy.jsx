/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import useWindowResize from '../../hooks/useWindowResize';

function TrustedStudy({
  ticket,
  contentUrl,
  exportStudyClicked,
  intendedStory,
  intendedPoint,
  stories,
  urls,
  onPointActivated,
  display,
  worksheetsAndDashboards,
  tableau,
  explore,
  onExplore,
  uuid,
}) {
  const vizRef = useRef(null);
  const trustedStudyRef = useRef();

  const setFrameSize = (screenWidth) => {
    if (vizRef.current) {
      let width = 800;
      let height = 800;

      try {
        width = vizRef.current.getWorkbook().getActiveSheet().getSize().minSize.width;
        height = vizRef.current.getWorkbook().getActiveSheet().getSize().minSize.height;
      } catch (e) {
        console.error('No minSize found, iframe set to default width and height');
      }

      vizRef.current.setFrameSize(width, height);

      const scaleCoef = screenWidth / width;
      if (scaleCoef < 1) {
        const iframe = trustedStudyRef.current.querySelector('iframe');
        iframe.style.transform = `scale(${scaleCoef})`;
        iframe.style.transformOrigin = 'top left';
      }
    }
  };

  // TODO: Update to pull initial values from window instead of resize event
  useWindowResize(({ width, height }) => {
    let studyWidth;

    try {
      studyWidth = trustedStudyRef.current.clientWidth;
    } catch {
      studyWidth = width - 224;
    }
    setFrameSize(studyWidth, height);
  }, true);

  /*
    This wraps Tableau's viz.getWorkbook().activateSheetAsync() call
    because Tableau SDK uses custom promise implementation
    and does not support .catch handler so the Error bubbles up
    to the component and crashes it.
   */
  const activateSheetAsync = async (viz, sheetName) => viz.getWorkbook().activateSheetAsync(sheetName);

  const activatePoint = async (viz, storyPoints, point, currentlyActiveStory) => {
    const pointToActivate = storyPoints.includes(point) ? point : storyPoints[0];

    if (!pointToActivate) {
      throw new Error('No story point to open');
    }

    try {
      const activatedStoryPoint = await activateSheetAsync(viz, pointToActivate);
      onPointActivated(currentlyActiveStory, activatedStoryPoint.getName());
      setFrameSize();
    } catch (error) {
      console.error(error);
      onPointActivated(currentlyActiveStory, null);
    }
  };

  const extractSheetUrl = (fullUrl) => {
    try {
      return fullUrl.split(`${uuid}/`)[1];
    } catch (error) {
      return null;
    }
  };

  const sequentiallyExploreTableauWorkbookStories = async (viz) => {
    const urlsMap = {};
    const storiesMap = {};
    const worksheetsAndDashboardsMap = {};

    const storySheetInfos = [];

    viz.getWorkbook().getPublishedSheetsInfo().forEach((sheetInfo) => {
      if (sheetInfo.getIsHidden()) {
        return;
      }
      const name = sheetInfo.getName();
      const url = sheetInfo.getUrl();

      urlsMap[name] = extractSheetUrl(url);

      if (sheetInfo.getSheetType() === 'story') {
        storySheetInfos.push(sheetInfo);
      } else {
        worksheetsAndDashboardsMap[name] = true;
      }
    });

    if (!storySheetInfos.length) {
      return {
        stories: {},
        worksheetsAndDashboards: {},
        urls: {},
      };
    }

    const storyNames = storySheetInfos.map((storySheetInfo) => storySheetInfo.getName());

    const accumulatorPromiseChainHead = viz.pauseAutomaticUpdatesAsync();
    const allStoriesExplored = storyNames
      .reduce((accumulatorPromiseChain, storyName) => accumulatorPromiseChain
        .then(() => viz.getWorkbook().activateSheetAsync(storyName))
        .then((story) => { // activated Sheet of type 'story' returns instance of Story class
          storiesMap[storyName] = {};
          const storyPointsNames = story.getStoryPointsInfo().map((storyPointInfo) => storyPointInfo.getCaption());
          storyPointsNames.forEach((spn, index) => {
            storiesMap[storyName][index] = spn;
          });
        }), accumulatorPromiseChainHead);

    return allStoriesExplored
      .then(() => viz.resumeAutomaticUpdatesAsync())
      .then(() => ({
        stories: storiesMap,
        worksheetsAndDashboards: worksheetsAndDashboardsMap,
        urls: urlsMap,
      }));
  };


  const activateStoryAndPoint = async (viz, availableStories, worksheetsAndDashboardsMap, storiesMap, story, point) => {
    const storyToActivate = availableStories.includes(story) ? story : availableStories[0];

    if (!storyToActivate) {
      throw new Error('No story to open');
    }

    if (storiesMap && storiesMap[story] && storiesMap[story].explored) {
      // Case 1: story is present, explored and it's storypoints are known
      const storyPoints = storiesMap[story].points;
      return activatePoint(viz, storyPoints, point, story);
    }
    // Case 2: story is not yet explored
    try {
      const activatedStory = await activateSheetAsync(viz, storyToActivate);
      const storyPoints = activatedStory.getStoryPointsInfo()
        .map((storyPointInfo) => storyPointInfo.getCaption())
        .filter((storyPointInfoCaption) => worksheetsAndDashboardsMap[storyPointInfoCaption]);

      return activatePoint(viz, storyPoints, point, activatedStory.getName());
    } catch (error) {
      console.error(error);
    }

    return null;
  };

  let container;

  useEffect(() => {
    let viz;

    const initialize = () => {
      vizRef.current = viz;

      if (explore) {
        sequentiallyExploreTableauWorkbookStories(vizRef.current)
          .then((content) => {
            onExplore(content);

            if (!Object.keys(content.stories).length) {
              onPointActivated(null, null);
              return;
            }

            // eslint-disable-next-line max-len
            activateStoryAndPoint(vizRef.current, Object.keys(content.stories), content.worksheetsAndDashboards, stories, intendedStory, intendedPoint)
              .catch((error) => {
                console.error(error);
                onPointActivated(null, null);
              });
          });
      } else {
        const initializedPoint = vizRef.current.getWorkbook().getActiveSheet().getName();

        // if onepager return early with null null
        if (!Object.keys(stories).length) {
          onPointActivated(null, null);
          return;
        }

        // This avoids double navigating to the same (story and) point from which the iframe was initialized
        if (intendedPoint === initializedPoint) {
          onPointActivated(intendedStory, intendedPoint);
          return;
        }

        // This updates url to the story and point from which the iframe was initialized
        if (intendedStory === null && intendedPoint === null) {
          const initializedStory = Object.keys(stories).find((s) => stories[s].points.includes(initializedPoint));
          onPointActivated(initializedStory, initializedPoint);
        }
      }
    };


    const initViz = () => {
      const tableauServerUrl = process.env.REACT_APP_TABLEAU_SERVER_PROXY_URL;
      const defaultStoryPointUrl = 'Presentation';
      const pointUrl = explore ? defaultStoryPointUrl : (urls[intendedPoint] || defaultStoryPointUrl);
      // eslint-disable-next-line max-len
      const trustedUrl = `${tableauServerUrl}/trusted/${ticket}/views/${contentUrl}/${pointUrl}?:embed=yes&:toolbar=top&:render=true`;

      const options = {
        hideTabs: true,
        hideToolbar: true,
        width: '100%',
        height: '800px',
        onFirstInteractive: initialize,
      };

      viz = new tableau.Viz(container, trustedUrl, options);
    };

    initViz();

    const cleanupViz = () => {
      if (viz) {
        viz.dispose();
      }
    };

    return cleanupViz;
  }, [container, ticket, contentUrl]);

  useEffect(() => {
    if (vizRef.current && explore) {
      sequentiallyExploreTableauWorkbookStories(vizRef.current)
        .then((content) => {
          onExplore(content);

          if (!Object.keys(content.stories).length) {
            onPointActivated(null, null);
            return;
          }

          // eslint-disable-next-line max-len
          activateStoryAndPoint(vizRef.current, Object.keys(content.stories), content.worksheetsAndDashboards, stories, intendedStory, intendedPoint)
            .catch((error) => {
              console.error(error);
              onPointActivated(null, null);
            });
        });
    }
  }, [explore]);

  useEffect(() => {
    if (vizRef.current) {
      // eslint-disable-next-line max-len
      activateStoryAndPoint(vizRef.current, Object.keys(stories), worksheetsAndDashboards, stories, intendedStory, intendedPoint)
        .catch((error) => {
          console.error(error);
          onPointActivated(null, null);
        });
    }
  }, [intendedStory, intendedPoint]);


  useEffect(() => {
    if (vizRef.current) {
      vizRef.current.showExportPDFDialog();
    }
  }, [exportStudyClicked]);

  return (
    <div className="trusted-study" style={{ opacity: display ? 1 : 0 }} ref={trustedStudyRef}>
      <div ref={(el) => {
        container = el;
      }}
      />
    </div>
  );
}

TrustedStudy.defaultProps = {
  intendedStory: null,
  intendedPoint: null,
};

TrustedStudy.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  tableau: PropTypes.object.isRequired,
  ticket: PropTypes.string.isRequired,
  uuid: PropTypes.string.isRequired,
  contentUrl: PropTypes.string.isRequired,
  exportStudyClicked: PropTypes.number.isRequired,
  intendedStory: PropTypes.string,
  intendedPoint: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  stories: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  urls: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  worksheetsAndDashboards: PropTypes.object.isRequired,
  display: PropTypes.bool.isRequired,
  explore: PropTypes.bool.isRequired,
  onExplore: PropTypes.func.isRequired,
  onPointActivated: PropTypes.func.isRequired,
};

export default TrustedStudy;
