import React, { Component, PropTypes } from 'react';
import Relay from 'react-relay';
import MediaRoute from '../../relay/MediaRoute';
import Caret from '../Caret';
import MediaMetadataSummary from './MediaMetadataSummary';
import MediaUtil from './MediaUtil';
import CheckContext from '../../CheckContext';

class MediaHeaderComponent extends Component {
  setCurrentContext() {
    const context = new CheckContext(this).getContextStore();
    this.props.relay.setVariables({ contextId: context.project.dbid });
  }

  componentDidMount() {
    this.setCurrentContext();
  }

  componentDidUpdate() {
    this.setCurrentContext();
  }

  render() {
    const media = this.props.media;
    const data = JSON.parse(media.jsondata);
    const title = MediaUtil.truncatedTitle(media, data);

    if (this.props.relay.variables.contextId === null) {
      return null;
    }

    return (
      <div className="media-header">
        <div className="media-header__copy">
          <h1 className="media-header__title">{title}</h1>
          <MediaMetadataSummary media={media} data={data} />
        </div>
      </div>
    );
  }
}

MediaHeaderComponent.contextTypes = {
  store: React.PropTypes.object,
};

const MediaHeaderContainer = Relay.createContainer(MediaHeaderComponent, {
  initialVariables: {
    contextId: null,
  },
  fragments: {
    media: () => Relay.QL`
      fragment on ProjectMedia {
        id,
        dbid,
        published,
        url,
        jsondata,
        last_status,
        annotations_count,
        verification_statuses,
        domain,
        user {
          name,
          source {
            dbid
          }
        }
        tags(first: 10000) {
          edges {
            node {
              tag,
              id
            }
          }
        }
        account {
          source {
            dbid,
            name
          }
        }
      }
    `,
  },
});

class MediaHeader extends Component {
  render() {
    let projectId = 0;
    const context = new CheckContext(this);
    context.setContext();
    const store = context.getContextStore();
    if (store.project) {
      projectId = store.project.dbid;
    }
    const ids = this.props.params.mediaId;
    const route = new MediaRoute({ ids: ids });
    return (<Relay.RootContainer Component={MediaHeaderContainer} route={route} />);
  }
}

MediaHeader.contextTypes = {
  store: React.PropTypes.object,
};

export default MediaHeader;
