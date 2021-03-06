import {Injectable, NgZone} from 'angular2/core';

import {IonicApp} from '../app/app';
import {Config} from '../../config/config';
import {pointerCoord, hasPointerMoved} from '../../util/dom';
import {Activator} from './activator';
import {RippleActivator} from './ripple';


/**
 * @private
 */
@Injectable()
export class TapClick {
  private lastTouch: number = 0;
  private disableClick: number = 0;
  private lastActivated: number = 0;
  private usePolyfill: boolean;
  private activator: any;
  private startCoord: any;
  private pointerMove: any;

  constructor(
    config: Config,
    private app: IonicApp,
    private zone: NgZone
  ) {
    let self = this;

    if (config.get('activator') == 'ripple') {
      self.activator = new RippleActivator(app, config, zone);

    } else if (config.get('activator') == 'highlight') {
      self.activator = new Activator(app, config, zone);
    }

    self.usePolyfill = (config.get('tapPolyfill') === true);

    zone.runOutsideAngular(() => {
      addListener('click', self.click.bind(self), true);

      addListener('touchstart', self.touchStart.bind(self));
      addListener('touchend', self.touchEnd.bind(self));
      addListener('touchcancel', self.pointerCancel.bind(self));

      addListener('mousedown', self.mouseDown.bind(self), true);
      addListener('mouseup', self.mouseUp.bind(self), true);
    });


    self.pointerMove = function(ev) {
      if ( hasPointerMoved(POINTER_MOVE_UNTIL_CANCEL, self.startCoord, pointerCoord(ev)) ) {
        self.pointerCancel(ev);
      }
    };
  }

  touchStart(ev) {
    this.lastTouch = Date.now();
    this.pointerStart(ev);
  }

  touchEnd(ev) {
    this.lastTouch = Date.now();

    if (this.usePolyfill && this.startCoord && this.app.isEnabled()) {
      // only dispatch mouse click events from a touchend event
      // when tapPolyfill config is true, and the startCoordand endCoord
      // are not too far off from each other
      let endCoord = pointerCoord(ev);

      if (!hasPointerMoved(POINTER_TOLERANCE, this.startCoord, endCoord)) {
        // prevent native mouse click events for XX amount of time
        this.disableClick = this.lastTouch + DISABLE_NATIVE_CLICK_AMOUNT;

        if (this.app.isScrolling()) {
          // do not fire off a click event while the app was scrolling
          console.debug('click from touch prevented by scrolling ' + Date.now());

        } else {
          // dispatch a mouse click event
          console.debug('create click from touch ' + Date.now());

          let clickEvent: any = document.createEvent('MouseEvents');
          clickEvent.initMouseEvent('click', true, true, window, 1, 0, 0, endCoord.x, endCoord.y, false, false, false, false, 0, null);
          clickEvent.isIonicTap = true;
          ev.target.dispatchEvent(clickEvent);
        }
      }
    }

    this.pointerEnd(ev);
  }

  mouseDown(ev) {
    if (this.isDisabledNativeClick()) {
      console.debug('mouseDown prevent ' + ev.target.tagName + ' ' + Date.now());
      // does not prevent default on purpose
      // so native blur events from inputs can happen
      ev.stopPropagation();

    } else if (this.lastTouch + DISABLE_NATIVE_CLICK_AMOUNT < Date.now()) {
      this.pointerStart(ev);
    }
  }

  mouseUp(ev) {
    if (this.isDisabledNativeClick()) {
      console.debug('mouseUp prevent ' + ev.target.tagName + ' ' + Date.now());
      ev.preventDefault();
      ev.stopPropagation();
    }

    if (this.lastTouch + DISABLE_NATIVE_CLICK_AMOUNT < Date.now()) {
      this.pointerEnd(ev);
    }
  }

  pointerStart(ev) {
    let activatableEle = getActivatableTarget(ev.target);

    if (activatableEle) {
      this.startCoord = pointerCoord(ev);

      let now = Date.now();
      if (this.lastActivated + 150 < now) {
        this.activator && this.activator.downAction(ev, activatableEle, this.startCoord.x, this.startCoord.y);
        this.lastActivated = now;
      }

      this.moveListeners(true);

    } else {
      this.startCoord = null;
    }
  }

  pointerEnd(ev) {
    this.moveListeners(false);
    this.activator && this.activator.upAction();
  }

  pointerCancel(ev) {
    console.debug('pointerCancel from ' + ev.type + ' ' + Date.now());
    this.activator && this.activator.clearState();
    this.moveListeners(false);
  }

  moveListeners(shouldAdd) {
    removeListener(this.usePolyfill ? 'touchmove' : 'mousemove', this.pointerMove);

    if (shouldAdd) {
      addListener(this.usePolyfill ? 'touchmove' : 'mousemove', this.pointerMove);
    }
  }

  click(ev: any) {
    let preventReason = null;

    if (!this.app.isEnabled()) {
      preventReason = 'appDisabled';

    } else if (!ev.isIonicTap && this.isDisabledNativeClick()) {
      preventReason = 'nativeClick';
    }

    if (preventReason !== null) {
      console.debug('click prevent ' + preventReason + ' ' + Date.now());
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  isDisabledNativeClick() {
    return this.disableClick > Date.now();
  }

}


function getActivatableTarget(ele) {
  let targetEle = ele;
  for (let x = 0; x < 4; x++) {
    if (!targetEle) break;
    if (isActivatable(targetEle)) return targetEle;
    targetEle = targetEle.parentElement;
  }
  return null;
}

/**
 * @private
 */
export function isActivatable(ele) {
  if (ACTIVATABLE_ELEMENTS.test(ele.tagName)) {
    return true;
  }

  let attributes = ele.attributes;
  for (let i = 0, l = attributes.length; i < l; i++) {
    if (ACTIVATABLE_ATTRIBUTES.test(attributes[i].name)) {
      return true;
    }
  }

  return false;
}

function addListener(type, listener, useCapture?) {
  document.addEventListener(type, listener, useCapture);
}

function removeListener(type, listener) {
  document.removeEventListener(type, listener);
}

const ACTIVATABLE_ELEMENTS = /^(A|BUTTON)$/;
const ACTIVATABLE_ATTRIBUTES = /tappable|button/i;
const POINTER_TOLERANCE = 4;
const POINTER_MOVE_UNTIL_CANCEL = 10;
const DISABLE_NATIVE_CLICK_AMOUNT = 2500;
