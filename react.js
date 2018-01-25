import React from 'react';
import PropTypes from 'prop-types';
import { themr } from 'react-css-themr';
import classnames from 'utils/classnames';

import OptionsMenu from 'components/courses/OptionsMenu';
import Toolbar from 'components/courses/Interface/Toolbar';
import Spinner from 'components/Interface/Spinner';
import Icon from 'components/Interface/Icon';
import ButtonIcon from 'components/Interface/ButtonIcon';
import ShortText from 'components/courses/Interface/ShortText';
import defaultTheme from './FilePreview.scss';

const Root = ({ isLinkMode, downloadUrl, label, ...props }) =>
  isLinkMode && downloadUrl ?
    <a href={downloadUrl} download={label} {...props}/> :
    <div {...props}/>;

Root.propTypes = {
  isLinkMode: PropTypes.bool,
  label: PropTypes.string,
  downloadUrl: PropTypes.string,
};

const statusOptions = {
  loading: {
    spinner: true
  },
  ready: {
    toolbar: {
      optionalItems: {
        fullscreen: { id: 'fullscreen' }
      },
      items: [
        { id: 'remove', icon: 'cross' }
      ]
    }
  },
  pause: {
    statusLabel: 'common_stopped',
    menu: {
      items: [
        { id: 'retry', label: 'common_resume' },
        { id: 'remove', label: 'common_delete' }
      ],
    },
    icon: {
      name: 'spinner',
      className: 'pauseIcon'
    }
  },
  error: {
    statusLabel: 'common_error',
    menu: {
      items: [
        { id: 'retry', label: 'common_repeat' },
        { id: 'remove', label: 'common_delete' }
      ]
    },
    icon: {
      name: 'exclaim-round',
      className: 'errorIcon'
    }
  }
};

const translateMenu = (menuItems, i18n) => (
  menuItems.map(item => ({
    ...item,
    label: i18n.text(item.label),
  }))
);

class FilePreview extends React.Component {
  static propTypes = {
    theme: PropTypes.object.isRequired,
    className: PropTypes.string,
    i18n: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    imageUrl: PropTypes.string,
    downloadUrl: PropTypes.string,
    status: PropTypes.oneOf(['loading', 'pause', 'ready', 'error']).isRequired,
    draggable: PropTypes.bool,
    enableFullscreen: PropTypes.bool,
    isLinkMode: PropTypes.bool,
    typeFile: PropTypes.string,
    onDragStart: PropTypes.func,
    onRemoveClick: PropTypes.func,
    onRetryClick: PropTypes.func,
    onFullscreenRequest: PropTypes.func
  };

  state = { isHovered: false };

  handleItemClick = (id) => {
    const callback = this.idToCallback(id);
    callback && callback(this.props.id);
  };

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleOnMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  handleDragStart = (e) => {
    const { id, onDragStart } = this.props;
    onDragStart && onDragStart(id, e);
  };

  handleDoubleClick = () => {
    const { onFullscreenRequest, enableFullscreen } = this.props;
    enableFullscreen && onFullscreenRequest && onFullscreenRequest();
  };

  idToCallback(id) {
    switch (id) {
      case 'remove': return this.props.onRemoveClick;
      case 'retry': return this.props.onRetryClick;
      case 'fullscreen': return this.props.onFullscreenRequest;
      default: return;
    }
  }

  getToolbarItems({ items, optionalItems }) {
    if (this.props.enableFullscreen) {
      return [...items, optionalItems.fullscreen];
    }
    return items;
  }

  getNameIcon(typeFile) {
    switch (typeFile) {
      case 'audio': return 'volume-up';
      case 'video': return 'play';
      case 'presentation': return 'text-doc';
      case 'slide': return 'image';
      default: return 'archive';
    }
  }

  getButtonIcon(theme, typeFile, className) {
    return (
      <ButtonIcon
        icon={this.getNameIcon(typeFile)}
        className={classnames(theme.mobileIcon, className,
          {
            [theme.audio]: typeFile === 'audio',
            [theme.video]: typeFile === 'video',
            [theme.image]: typeFile === 'slide',
            [theme.presentation]: typeFile === 'presentation'
          }
        )}
      />
    );
  }

  render() {
    const {
      theme,
      className,
      i18n,
      label,
      imageUrl,
      downloadUrl,
      status,
      draggable,
      isLinkMode,
      typeFile
    } = this.props;

    const { isHovered } = this.state;
    const previewStyle = imageUrl ? { backgroundImage: `url(${imageUrl})` } : {};
    const opts = statusOptions[status];

    return (
      <Root
        className={classnames(theme.root, className)}
        isLinkMode={isLinkMode}
        draggable={draggable}
        downloadUrl={downloadUrl}
        label={label}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleOnMouseLeave}
        onDragStart={this.handleDragStart}
        onDoubleClick={this.handleDoubleClick}
      >
        <div className={theme.preview} style={previewStyle}>
          {!isLinkMode && opts.toolbar && isHovered &&
            <Toolbar
              className={theme.toolbar}
              items={this.getToolbarItems(opts.toolbar)}
              onItemClick={this.handleItemClick}
            />
          }
          {opts.spinner &&
            <Spinner className={theme.spinner} newUI={true}/>
          }
          {opts.icon &&
            <Icon
              name={opts.icon.name}
              className={classnames(theme.icon, theme[opts.icon.className])}
            />
          }
          {this.getButtonIcon(theme, typeFile)}
        </div>
        {this.getButtonIcon(theme, typeFile, theme.outside)}
        <div className={theme.menuBlock}>
          {(opts.statusLabel) ?
            <div className={theme.statusLabel}>{i18n.text(opts.statusLabel)}</div> :
            <ShortText
              text={label}
              className={theme.label}
            />}
          {opts.menu &&
            <OptionsMenu
              className={classnames(theme.menu, { [theme.menuOnHover]: isHovered })}
              menus={[{ id: 'options', label: label, items: translateMenu(opts.menu.items, i18n) }]}
              onItemClick={this.handleItemClick}
            />
          }
        </div>
      </Root>
    );
  }
}

export default themr('FilePreview', defaultTheme, { withRef: true })(FilePreview);
