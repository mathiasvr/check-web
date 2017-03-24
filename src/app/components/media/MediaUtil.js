import lodashTruncate from 'lodash.truncate';
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  notesCount: {
    id: 'media.notesCount',
    defaultMessage: '{notesCount, plural, =0 {No notes} one {1 note} other {{notesCount} notes}}'
  },
});

const MediaUtil = {
  url(media, data) {
    try {
      return media.url || data.url || '';
    } catch (e) {
      return '';
    }
  },

  authorAvatarUrl(media, data) {
    return data.author_picture;
  },

  authorName(media, data) {
    switch (media.domain) {
    case 'twitter.com':
      return data.user ? data.user.name : '';
    case 'instagram.com':
      return data.author_name;
    case 'facebook.com':
      return data.user_name;
    default:
      return data.username || media.domain;
    }
  },

  authorUsername(media, data) {
    switch (media.domain) {
    case 'twitter.com':
    case 'instagram.com':
      return `@${data.username}`;
    case 'facebook.com':
      return data.username;
    case 'youtube.com':
      return '';
    default:
      return data.username;
    }
  },

  authorUrl(media, data) {
    return data.author_url;
  },

  typeLabel(media, data) {
    try {
      const socialMedia = ({
        'twitter.com': 'Tweet',
        'facebook.com': 'Facebook post',
        'instagram.com': 'Instagram',
        'youtube.com': 'Video',
      }[media.domain]);

      if (socialMedia) {
        return socialMedia;
      }
      if (media && media.quote) {
        return 'Claim';
      }
      if (media && media.embed_path) {
        return 'Image';
      }
      if (media && media.domain) {
        return 'Page';
      }
    } catch (e) {}
    return '';
  },

  attributedType(media, data) {
    let typeLabel;
    try {
      typeLabel = this.typeLabel(media, data);
      if (typeLabel === 'Page') {
        return `${typeLabel} on ${media.domain}`;
      } else if (typeLabel === 'Image') {
        return data.title || typeLabel;
      } else if (typeLabel === 'Claim') {
        return (data.title && data.title != media.quote) ? data.title : typeLabel;
      }
      const attribution = this.authorName(media, data);
      return `${typeLabel}${attribution ? ` by ${attribution}` : ''}`;
    } catch (e) {
      return typeLabel || '';
    }
  },

  title(media, data) {
    if (data && data.title && data.title.trim().length) {
      return this.truncate(data.title);
    }

    let typeLabel;
    try {
      typeLabel = this.typeLabel(media, data);
      if (typeLabel === 'Page') {
        return `${typeLabel} on ${media.domain}`;
      } else if (typeLabel === 'Claim') {
        const text = data.quote;
        return `${typeLabel}${text ? `: ${text}` : ''}`;
      }
      const attribution = this.authorName(media, data);
      const text = this.bodyText(media, data);
      return `${typeLabel}${attribution ? ` by ${attribution}` : ''}${text && text.length ? `: ${text}` : ''}`;
    } catch (e) {
      return typeLabel || '';
    }
  },

  truncatedTitle(media, data) {
    return this.truncate(this.title(media, data));
  },

  truncate(text, length = 100) {
    return lodashTruncate(text, { length, separator: /,? +/, ellipsis: '…' });
  },

  // Return a text fragment "X notes" with proper pluralization.
  notesCount(media, data, intl) {
    return intl.formatMessage(messages.notesCount, {notesCount: media.annotations_count})
  },

  createdAt(media) { // check media
    let date = '';
    try {
      date = new Date(parseInt(media.published) * 1000);
      if (isNaN(date)) date = null;
    } catch (e) {
      date = null;
    }
    return date;
  },

  embedPublishedAt(media, data) { // embedded media
    let date = '';
    try {
      date = new Date(data.published_at);
      if (isNaN(date)) date = null;
    } catch (e) {
      date = null;
    }
    return date;
  },

  bodyText(media, data) {
    return data.description;
  },

  bodyImageUrl(media, data) {
    try {
      switch (media.domain) {
      case 'twitter.com':
        return data.entities.media[0].media_url_https || data.entities.media[0].media_url;
      case 'facebook.com':
        return data.photos[0];
      case 'instagram.com':
        return data.picture;
      case 'youtube.com':
        return data.picture;
      }
    } catch (e) {
      return null;
    }
  },

  stats(media, data) {
    try {
      return ({
        'twitter.com': [
          `${data.favorite_count || 0} favorite${data.favorite_count !== 1 ? 's' : ''}`,
          `${data.retweet_count || 0} retweet${data.retweet_count !== 1 ? 's' : ''}`,
        ],
      }[media.domain] || []);
    } catch (e) {
      return [];
    }
  },
};

export default MediaUtil;
