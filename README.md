# Node

Code examples are some of my work on Studies automation project.

Studies are target audience reports, and Sales representatives need to be able to quickly submit a StudyRequest and have the API/ETL produce the study with the right audience **segment** for their Client's next marketing campaign in a given country.

Sales people fill out an interactive form and they choose
- Country in which they wanna find the audience Segment
- Keywords (segment markers)
- Assets - apps and domains which the audience segment has/visits

In order to run the study we need to make sure if the segment is feasible.

Feasibile audience segment means 2 things:
- The segment is large enough (a couple of hundred thousand users in volume)
- The segment is only a small percentage of the population of the given Country. The smaller the better. Small percentage means high discriminance.

## Keywords

Goal: Implement autocomplete and return the shortest (partial) match.

Searching in some countries might return the same keyword but in multiple languages. Mapping is provided.

## Assets

Goal: Implement fuzzy search, allowing partial matches and different word ordering. Sort by volume.
Example: Typing `instag` should return `Instagram` and `Boomerang for Instagram`, since more people have Instagram than Boomerang app.

Assets - android apps or domains on which we have usage data.
Volume - on how many devices is the asset present.

## Categories

Studies are organized in Categories in 2 levels. They are needed to show the side menu.


# React app

- Study page dispatches the action to get the study by ID.
- Study expects the tableau SDK to be present in the window, a requirement to load the study iframe.

- Saga listens and orchestrates the API call.

- Success action stores the study in redux store, and the Study page renders TrustedStudy component with the `ticket`.
- TrustedStudy exchanges the ticket with tableau server, allowing the study to load in the iframe.
- TrustedStudy might need to `explore` the study to find out its stories(parents) and points(children) to be able to draw the sidemenu and navigathe the study contents.
