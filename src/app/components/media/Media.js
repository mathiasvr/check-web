import React from 'react';
import PropTypes from 'prop-types';
import Relay from 'react-relay/classic';
import CheckContext from '../../CheckContext';
import MediaRoute from '../../relay/MediaRoute';
import MediaComponent from './MediaComponent';
import MediasLoading from './MediasLoading';
import MediaTitle from './MediaTitle'; // TODO put MediaComponent in this file

const MediaContainer = Relay.createContainer(MediaComponent, {
  initialVariables: {
    contextId: null,
  },
  fragments: {
    media: () => Relay.QL`
      fragment on ProjectMedia {
        id
        ${MediaTitle.getFragment('projectMedia')}
        dbid
        title
        metadata
        permissions
        pusher_channel
        verification_statuses
        project_id
        project_ids
        requests_count
        project {
          id
          dbid
          title
          search_id
          search { id, number_of_results }
          medias_count
        }
        media {
          url
          quote
          embed_path
        }
        team {
          id
          dbid
          slug
          name
          team_bots(first: 10000) {
            edges {
              node {
                login
              }
            }
          }
        }
      }
    `,
  },
});

const ProjectMedia = (props, context) => {
  let { projectId } = props;
  const { projectMediaId } = props;
  const checkContext = new CheckContext({ props, context });
  checkContext.setContext();
  if (!projectId) {
    const store = checkContext.getContextStore();
    if (store.project) {
      projectId = store.project.dbid;
    }
  }
  const ids = `${projectMediaId},${projectId}`;
  const route = new MediaRoute({ ids });

  return (
    <Relay.RootContainer
      Component={MediaContainer}
      route={route}
      renderLoading={() => <MediasLoading count={1} />}
    />
  );
};

ProjectMedia.contextTypes = {
  store: PropTypes.object,
};

export default ProjectMedia;
