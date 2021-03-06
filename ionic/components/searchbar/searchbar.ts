import {ElementRef, Component, Directive, Host, HostBinding, HostListener, ViewChild, Input, Output, EventEmitter, Optional} from 'angular2/core';
import {NgIf, NgClass, NgControl, FORM_DIRECTIVES} from 'angular2/common';

import {Ion} from '../ion';
import {Config} from '../../config/config';
import {Icon} from '../icon/icon';
import {Button} from '../button/button';
import {isDefined} from '../../util/util';


/**
* @private
*/
@Directive({
  selector: '.searchbar-input',
})
export class SearchbarInput {
  @HostListener('input', ['$event'])
  /**
   * @private
   * Don't send the input's input event
   */
  private stopInput(ev) {
    event.preventDefault();
    event.stopPropagation();
  }

  constructor(private _elementRef: ElementRef) {

  }
}


/**
 * @name Searchbar
 * @module ionic
 * @description
 * Manages the display of a Searchbar which can be used to search or filter items.
 *
 * @usage
 * ```html
 * <ion-searchbar [(ngModel)]="defaultSearch" (input)="triggerInput($event)" (cancel)="onCancelSearchbar($event)" (clear)="onClearSearchbar($event)"></ion-searchbar>
 * ```
 *
 * @property {string} [cancelButtonText=Cancel] - Sets the cancel button text to the value passed in
 * @property {boolean} [hideCancelButton=false] - Hides the cancel button
 * @property {string} [placeholder=Search] - Sets input placeholder to the value passed in
 *
 * @property {Any} [input] - Expression to evaluate when the Searchbar input has changed including cleared
 * @property {Any} [keydown] - Expression to evaluate when a key is pushed down in the Searchbar input
 * @property {Any} [keypress] - Expression to evaluate when a character is inserted in the Searchbar input
 * @property {Any} [keyup] - Expression to evaluate when a key is released in the Searchbar input
 * @property {Any} [blur] - Expression to evaluate when the Searchbar input has blurred
 * @property {Any} [focus] - Expression to evaluate when the Searchbar input has focused
 * @property {Any} [cancel] - Expression to evaluate when the cancel button is clicked
 * @property {Any} [clear] - Expression to evaluate when the clear input button is clicked
 *
 * @see {@link /docs/v2/components#searchbar Searchbar Component Docs}
 */
@Component({
  selector: 'ion-searchbar',
  template:
    '<div class="searchbar-input-container">' +
      '<button (click)="cancelSearchbar()" (mousedown)="cancelSearchbar()" clear dark class="searchbar-md-cancel">' +
        '<ion-icon name="arrow-back"></ion-icon>' +
      '</button>' +
      '<div class="searchbar-search-icon"></div>' +
      '<input [value]="value" (keyup)="inputChanged($event)" (blur)="inputBlurred()" (focus)="inputFocused()" class="searchbar-input" type="search" [attr.placeholder]="placeholder">' +
      '<button clear *ngIf="value" class="searchbar-clear-icon" (click)="clearInput()" (mousedown)="clearInput()"></button>' +
    '</div>' +
    '<button clear (click)="cancelSearchbar()" (mousedown)="cancelSearchbar()" [hidden]="hideCancelButton" class="searchbar-ios-cancel">{{cancelButtonText}}</button>',
  directives: [FORM_DIRECTIVES, NgIf, NgClass, Icon, Button, SearchbarInput]
})
export class Searchbar extends Ion {
  @ViewChild(SearchbarInput) searchbarInput;

  /**
   * @private
   */
  @Input() cancelButtonText: string;
  /**
   * @private
   */
  @Input() hideCancelButton: any;
  /**
   * @private
   */
  @Input() placeholder: string;
  /**
   * @private
   */
  @Input() ngModel: any;

  /**
   * @private
   */
  @Output() input: EventEmitter<Searchbar> = new EventEmitter();
  /**
   * @private
   */
  @Output() blur: EventEmitter<Searchbar> = new EventEmitter();
  /**
   * @private
   */
  @Output() focus: EventEmitter<Searchbar> = new EventEmitter();
  /**
   * @private
   */
  @Output() cancel: EventEmitter<Searchbar> = new EventEmitter();
  /**
   * @private
   */
  @Output() clear: EventEmitter<Searchbar> = new EventEmitter();

  value: string = '';
  blurInput: boolean = true;
  inputElement: any;
  searchIconElement: any;
  mode: string;

  @HostBinding('class.searchbar-focused') isFocused;
  @HostBinding('class.searchbar-left-aligned') shouldLeftAlign;

  constructor(
    private _elementRef: ElementRef,
    private _config: Config,
    @Optional() ngControl: NgControl
  ) {
    super(_elementRef);

    // If the user passed a ngControl we need to set the valueAccessor
    if (ngControl) {
      ngControl.valueAccessor = this;
    }
  }

  /**
   * @private
   * On Initialization check for attributes
   */
  ngOnInit() {
    this.mode = this._config.get('mode');

    let hideCancelButton = this.hideCancelButton;
    if (typeof hideCancelButton === 'string') {
      this.hideCancelButton = (hideCancelButton === '' || hideCancelButton === 'true');
    }

    this.cancelButtonText = this.cancelButtonText || 'Cancel';
    this.placeholder = this.placeholder || 'Search';

    if (this.ngModel) this.value = this.ngModel;
    this.onChange(this.value);

    this.shouldLeftAlign = this.value && this.value.trim() != '';

    // Using querySelector instead of searchbarInput because at this point it doesn't exist
    this.inputElement = this._elementRef.nativeElement.querySelector('.searchbar-input');
    this.searchIconElement = this._elementRef.nativeElement.querySelector('.searchbar-search-icon');
    this.setElementLeft();
  }

  /**
   * @private
   * After View Initialization check the value
   */
  ngAfterViewInit() {
    // If the user passes an undefined variable to ngModel this will warn
    // and set the value to an empty string
    if (!isDefined(this.value)) {
      console.warn('Searchbar was passed an undefined value in ngModel. Please make sure the variable is defined.');
      this.value = '';
      this.onChange(this.value);
    }
  }

  /**
   * @private
   * Determines whether or not to add style to the element
   * to center it properly (ios only)
   */
  setElementLeft() {
    if (this.mode !== 'ios') return;

    if (this.shouldLeftAlign) {
      this.inputElement.removeAttribute("style");
      this.searchIconElement.removeAttribute("style");
    } else {
      this.addElementLeft();
    }
  }

  /**
   * @private
   * Calculates the amount of padding/margin left for the elements
   * in order to center them based on the placeholder width
   */
  addElementLeft() {
    // Create a dummy span to get the placeholder width
    let tempSpan = document.createElement('span');
    tempSpan.innerHTML = this.placeholder;
    document.body.appendChild(tempSpan);

    // Get the width of the span then remove it
    let textWidth = tempSpan.offsetWidth;
    tempSpan.remove();

    // Set the input padding left
    let inputLeft = "calc(50% - " + (textWidth / 2) + "px)";
    this.inputElement.style.paddingLeft = inputLeft;

    // Set the icon margin left
    let iconLeft = "calc(50% - " + ((textWidth / 2) + this.searchIconElement.offsetWidth + 15) + "px)";
    this.searchIconElement.style.marginLeft = iconLeft;
  }

  /**
   * @private
   * Update the Searchbar input value when the input changes
   */
  inputChanged(ev) {
    this.value = ev.target.value;
    this.onChange(this.value);
    this.input.emit(this);
  }

  /**
   * @private
   * Sets the Searchbar to focused and aligned left on input focus.
   */
  inputFocused() {
    this.focus.emit(this);

    this.isFocused = true;
    this.shouldLeftAlign = true;
    this.setElementLeft();
  }

  /**
   * @private
   * Sets the Searchbar to not focused and checks if it should align left
   * based on whether there is a value in the searchbar or not.
   */
  inputBlurred() {
    // blurInput determines if it should blur
    // if we are clearing the input we still want to stay focused in the input
    if (this.blurInput == false) {
      this.searchbarInput._elementRef.nativeElement.focus();
      this.blurInput = true;
      return;
    }
    this.blur.emit(this);

    this.isFocused = false;
    this.shouldLeftAlign = this.value && this.value.trim() != '';
    this.setElementLeft();
  }

  /**
   * @private
   * Clears the input field and triggers the control change.
   */
  clearInput() {
    this.clear.emit(this);

    this.value = '';
    this.onChange(this.value);
    this.input.emit(this);

    this.blurInput = false;
  }

  /**
   * @private
   * Clears the input field and tells the input to blur since
   * the clearInput function doesn't want the input to blur
   * then calls the custom cancel function if the user passed one in.
   */
  cancelSearchbar() {
    this.cancel.emit(this);

    this.clearInput();
    this.blurInput = true;
  }

  /**
   * @private
   * Write a new value to the element.
   */
  public writeValue(value: any) {
    this.value = value;
  }

  public onChange = (_:any) => {};
  public onTouched = () => {};

  /**
   * @private
   * Set the function to be called when the control receives a change event.
   */
  public registerOnChange(fn:(_:any) => {}):void {
    this.onChange = fn;
  }

  /**
   * @private
   * Set the function to be called when the control receives a touch event.
   */
  public registerOnTouched(fn:() => {}):void {
    this.onTouched = fn;
  }
}
