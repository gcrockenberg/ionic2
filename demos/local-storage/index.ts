import {App, Page, IonicApp, Config, Platform} from 'ionic/ionic';
import {Storage, LocalStorage} from 'ionic/ionic';


@App({
  templateUrl: 'app.html'
})
class ApiDemoApp {

  constructor() {
    this.rootPage = InitialPage;
  }
}

@Page({
  templateUrl: 'main.html'
})
export class InitialPage {
  constructor() {
    this.local = new Storage(LocalStorage);
    this.myItem = {};
    this.delKey = '';
    this.localStorageDemo = '{}';
    window.localStorage.clear();
  }

  set() {
    this.local.set(this.myItem.key, this.myItem.value );
    this.localStorageDemo = JSON.stringify(window.localStorage, null, 2);
    this.myItem = {};
  }

  remove() {
    this.local.remove(this.delKey);
    this.localStorageDemo = JSON.stringify(window.localStorage, null, 2);
    this.delKey = '';
  }
}
