import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Relay from 'react-relay/classic';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import CreateRelatedMedia from './CreateRelatedMedia';
import MediaRoute from '../../relay/MediaRoute';
import mediaFragment from '../../relay/mediaFragment';
import MediaDetail from './MediaDetail';
import MediasLoading from './MediasLoading';
import CheckContext from '../../CheckContext';
import { getFilters } from '../../helpers';
import {
  FlexRow,
  black54,
  black87,
  body1,
  subheading2,
  units,
} from '../../styles/js/shared';

const StyledHeaderRow = styled.div`
  justify-content: space-between;
  display: flex;
  color: ${black54};
  font: ${body1};
  height: ${units(6)};

  h2 {
    color: ${black87};
    flex: 1;
    font: ${subheading2};
    margin: 0;
  }
`;

const previousFilters = {};

class MediaRelatedComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.subscribe();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  getContext() {
    return new CheckContext(this).getContextStore();
  }

  subscribe() {
    const { pusher } = this.getContext();
    if (pusher) {
      pusher.subscribe(this.props.media.pusher_channel).bind('relationship_change', (data) => {
        const relationship = JSON.parse(data.message);
        if (
          (this.getContext().clientSessionId !== data.actor_session_id) &&
          (relationship.source_id === this.props.media.dbid)
        ) {
          this.props.relay.forceFetch();
        }
      });
    }
  }

  unsubscribe() {
    const { pusher } = this.getContext();
    if (pusher) {
      pusher.unsubscribe(this.props.media.pusher_channel);
    }
  }

  render() {
    const filters = getFilters();
    const { dbid } = this.props.media;

    let medias = [];
    const { relationships } = this.props.media;
    const { targets_count } = relationships;
    const targets = relationships.targets.edges;
    const sources = relationships.sources.edges;
    let filtered_count = 0;

    if (filters !== previousFilters[dbid]) {
      previousFilters[dbid] = filters;
      this.props.relay.setVariables({ filters });
      this.props.relay.forceFetch();
    } else if (targets.length > 0) {
      medias = targets[0].node.targets.edges;
      filtered_count = targets_count - medias.length;
    } else if (sources.length > 0) {
      medias.push({ node: sources[0].node.source });
      sources[0].node.siblings.edges.forEach((sibling) => {
        if (sibling.node.dbid !== this.props.media.dbid) {
          medias.push(sibling);
        }
      });
    }

    return (
      <div>
        { this.props.showHeader ?
          <StyledHeaderRow>
            <FlexRow>
              <h2>
                <FormattedMessage
                  id="mediaRelated.relatedItems"
                  defaultMessage="Related items"
                />
              </h2>
            </FlexRow>
            <CreateRelatedMedia style={{ marginLeft: 'auto' }} media={this.props.media} />
          </StyledHeaderRow> : null }

        { (this.props.showNumbers && medias.length > 0) ?
          <StyledHeaderRow>
            <FlexRow>
              <FormattedMessage
                id="mediaRelated.counter"
                defaultMessage="{total, number} related items ({hidden, number} hidden by filters)"
                values={{ total: targets_count, hidden: filtered_count }}
              />
            </FlexRow>
          </StyledHeaderRow> : null }

        <FlexRow>
          <ul style={{ width: '100%' }}>
            {medias.map((item) => {
              if (item.node.archived) {
                return null;
              }
              return (
                <li key={item.node.dbid} className="medias__item" style={{ paddingBottom: units(1) }}>
                  {<MediaDetail media={item.node} condensed parentComponent={this} hideRelated />}
                  {<ul className="empty" />}
                </li>
              );
            })}
          </ul>
        </FlexRow>
      </div>
    );
  }
}

MediaRelatedComponent.contextTypes = {
  store: PropTypes.object,
};

const MediaRelatedContainer = Relay.createContainer(MediaRelatedComponent, {
  initialVariables: {
    contextId: null,
    filters: getFilters(),
  },
  fragments: {
    media: () => Relay.QL`
      fragment on ProjectMedia {
        id
        dbid
        archived
        permissions
        pusher_channel
        media {
          quote
        }
        project {
          dbid
          search_id
          permissions
          team {
            search_id
            verification_statuses
            translation_statuses
          }
        }
        relationships {
          target_id
          source_id
          targets_count
          sources_count
          targets(first: 10000, filters: $filters) {
            edges {
              node {
                id
                type
                targets(first: 10000) {
                  edges {
                    node {
                      ${mediaFragment}
                    }
                  }
                }
              }
            }
          }
          sources(first: 10000) {
            edges {
              node {
                id
                type
                siblings(first: 10000) {
                  edges {
                    node {
                      ${mediaFragment}
                    }
                  }
                }
                source {
                  ${mediaFragment}
                }
              }
            }
          }
        }
      }
    `,
  },
});

const MediaRelated = (props) => {
  const ids = `${props.media.dbid},${props.media.project_id}`;
  const route = new MediaRoute({ ids });

  return (
    <Relay.RootContainer
      Component={MediaRelatedContainer}
      renderFetched={data => <MediaRelatedContainer {...props} {...data} />}
      route={route}
      renderLoading={() => <MediasLoading count={1} />}
    />
  );
};

export default MediaRelated;
