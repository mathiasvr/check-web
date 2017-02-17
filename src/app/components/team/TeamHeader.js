import React, { Component, PropTypes } from 'react';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import Relay from 'react-relay';
import { Link } from 'react-router';
import Pusher from 'pusher-js';
import TeamRoute from '../../relay/TeamRoute';
import teamFragment from '../../relay/teamFragment';
import CheckContext from '../../CheckContext';

const messages = defineMessages({
  back: {
    id: 'teamHeader.back',
    defaultMessage: 'Back to team'
  }
});

class TeamHeaderComponent extends Component {
  getPusher() {
    const context = new CheckContext(this);
    return context.getContextStore().pusher;
  }

  updateContext() {
    new CheckContext(this).setContextStore({ team: this.props.team });
  }

  componentWillMount() {
    this.updateContext();
  }

  componentWillUpdate() {
    this.updateContext();
  }

  subscribe() {
    const pusher = this.getPusher();
    if (pusher) {
      const that = this;
      pusher.subscribe(this.props.team.pusher_channel).bind('project_created', (data) => {
        that.props.relay.forceFetch();
      });
    }
  }

  componentDidMount() {
    this.subscribe();
  }

  unsubscribe() {
    const pusher = this.getPusher();
    if (pusher) {
      pusher.unsubscribe(this.props.team.pusher_channel);
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const team = this.props.team;

    return (
      <nav className="team-header">
        <Link to={`/${team.slug}`} className="team-header__clickable" title={team.name}>
          <div className="team-header__avatar" style={{ backgroundImage: `url(${team.avatar})` }}></div>
          <h3 className="team-header__name">
            {team.name}
          </h3>
        </Link>
      </nav>
    );
  }
}

TeamHeaderComponent.contextTypes = {
  store: React.PropTypes.object,
};

const TeamHeaderContainer = Relay.createContainer(TeamHeaderComponent, {
  fragments: {
    team: () => teamFragment,
  },
});

class TeamHeader extends Component {
  render() {
    const teamSlug = (this.props.params && this.props.params.team) ? this.props.params.team : '';
    const route = new TeamRoute({ teamSlug });
    const { formatMessage } = this.props.intl;
    return (
      <Relay.RootContainer
        Component={TeamHeaderContainer}
        route={route}
        renderLoading={function() {
          return (
            <nav className="team-header team-header--loading">
              <Link to={`/${teamSlug}`} className="team-header__clickable" title={formatMessage(messages.back)}>
                <div className="team-header__avatar"></div>
              </Link>
            </nav>
          );
        }}
      />
    );
  }
}

TeamHeader.propTypes = {
  intl: intlShape.isRequired
};

export default injectIntl(TeamHeader);
