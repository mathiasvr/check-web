import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Relay from 'react-relay/classic';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ConfirmDialog from '../layout/ConfirmDialog';
import UserConnectedAccount from '../user/UserConnectedAccount';
import { logout } from '../../redux/actions';
import DeleteCheckUserMutation from '../../relay/mutations/DeleteCheckUserMutation';
import CheckContext from '../../CheckContext';
import FormattedGlobalMessage from '../FormattedGlobalMessage';
import { getErrorMessage } from '../../helpers';
import { stringHelper } from '../../customHelpers';
import { units } from '../../styles/js/shared';

class UserPrivacy extends Component {
  static handleSubmit(subject) {
    const email = 'privacy@meedan.com';
    window.location.href = `mailto:${email}?subject=${subject}`;
  }

  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      message: null,
    };
  }

  getCurrentUser() {
    return new CheckContext(this).getContextStore().currentUser;
  }

  handleOpenDialog() {
    this.setState({ dialogOpen: true });
  }

  handleCloseDialog() {
    this.setState({ dialogOpen: false });
  }

  handleDeleteAccount() {
    this.handleRequestDeleteAccount();
    this.handleCloseDialog();
  }

  handleRequestDeleteAccount() {
    const { user } = this.props;

    const onFailure = (transaction) => {
      const fallbackMessage = (
        <FormattedGlobalMessage
          messageKey="unknownError"
          values={{ supportEmail: stringHelper('SUPPORT_EMAIL') }}
        />
      );
      const message = getErrorMessage(transaction, fallbackMessage);
      this.setState({ message });
    };

    const onSuccess = () => {
      logout();
    };

    Relay.Store.commitUpdate(
      new DeleteCheckUserMutation({
        id: user.dbid,
      }),
      { onSuccess, onFailure },
    );
  }

  render() {
    const { user } = this.props;

    const currentUser = this.getCurrentUser();

    if (!currentUser || !user || currentUser.dbid !== user.dbid) {
      return null;
    }

    const linkStyle = {
      textDecoration: 'underline',
    };

    const style = {
      margin: `${units(2)} 0`,
    };

    const cardStyle = {
      margin: `${units(2)} 0`,
    };

    const cardTextStyle = {
      display: 'flex',
      alignItems: 'center',
    };

    const buttonStyle = {
      minWidth: 300,
      textAlign: 'end',
    };

    const confirmDialog = {
      blurb: <FormattedMessage
        id="userPrivacy.deleteAccountConfirmationText"
        defaultMessage="Are you sure? This will remove your account and log you out of the app."
      />,
    };

    const { providers } = this.props.user;
    providers.splice(providers.indexOf('google_oauth2'), 1);

    return (
      <div id="user__privacy">
        <h2 style={style}>
          <FormattedMessage id="userPrivacy.title" defaultMessage="Your information" />
        </h2>
        <p style={style}>
          <FormattedMessage
            id="userPrivacy.description"
            defaultMessage="Please review our <pp>Privacy Policy</pp> to learn how {appName} uses and stores your information."
            values={{
              appName: <FormattedGlobalMessage messageKey="appNameHuman" />,
              pp: (...chunks) => (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                  href={stringHelper('PP_URL')}
                >
                  {chunks}
                </a>
              ),
            }}
          />
        </p>
        <Card style={cardStyle}>
          <CardContent style={cardTextStyle}>
            <FormattedMessage
              id="userPrivacy.seeInformationText"
              defaultMessage="We will send you a file with the content and data you created and generated on {appName}. This can be kept for your records or transferred to another service."
              values={{ appName: <FormattedGlobalMessage messageKey="appNameHuman" /> }}
            />
            <Button
              id="user-privacy__see-info"
              style={buttonStyle}
              color="primary"
              onClick={UserPrivacy.handleSubmit.bind(this, 'Send information')}
            >
              <FormattedMessage id="userPrivacy.seeInformationButton" defaultMessage="See my information" />
            </Button>
          </CardContent>
        </Card>
        <Card style={cardStyle}>
          <CardContent style={cardTextStyle}>
            <FormattedMessage
              id="userPrivacy.stopProcessingText"
              defaultMessage="You can request {appName} to stop processing your information under certain conditions."
              values={{ appName: <FormattedGlobalMessage messageKey="appNameHuman" /> }}
            />
            <Button
              id="user-privacy__stop-processing"
              style={buttonStyle}
              color="primary"
              onClick={UserPrivacy.handleSubmit.bind(this, 'Stop processing')}
            >
              <FormattedMessage id="userPrivacy.stopProcessingButton" defaultMessage="Request to stop processing" />
            </Button>
          </CardContent>
        </Card>
        <h2 style={style}>
          <FormattedMessage id="userPrivacy.connectedAccounts" defaultMessage="Connected accounts" />
        </h2>
        <Card style={cardStyle}>
          <CardContent style={cardTextStyle}>
            <List>
              { providers.map(provider => (
                <UserConnectedAccount
                  provider={provider}
                  user={user}
                  key={provider.key}
                />
              ))}
            </List>
          </CardContent>
        </Card>
        <h2 style={Object.assign({}, style, { marginTop: units(6) })}>
          <FormattedMessage id="userPrivacy.delete" defaultMessage="Delete your account" />
        </h2>
        <Card style={cardStyle}>
          <CardContent style={cardTextStyle}>
            <FormattedMessage
              id="userPrivacy.deleteAccountText"
              defaultMessage="If you delete your account, your personal information will be erased. Comments, annotations, and workspace activity will become pseudonymous and remain on {appName}."
              values={{ appName: <FormattedGlobalMessage messageKey="appNameHuman" /> }}
            />
            <Button
              id="user-privacy__delete-account"
              style={buttonStyle}
              color="primary"
              onClick={this.handleOpenDialog.bind(this)}
            >
              <FormattedMessage id="userPrivacy.deleteAccountButton" defaultMessage="Delete my account" />
            </Button>
            <ConfirmDialog
              message={this.state.message}
              open={this.state.dialogOpen}
              title={
                <FormattedMessage id="UserPrivacy.deleteAccount" defaultMessage="Delete Account" />
              }
              blurb={confirmDialog.blurb}
              handleClose={this.handleCloseDialog.bind(this)}
              handleConfirm={this.handleDeleteAccount.bind(this)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }
}

UserPrivacy.contextTypes = {
  store: PropTypes.object,
};

export default UserPrivacy;
