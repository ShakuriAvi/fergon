/* App entry. Forces RTL (Hebrew) before the root renders so row layouts
   and text alignment flip across web + native, mirroring dir="rtl". */
import { I18nManager, Platform } from 'react-native';
import { registerRootComponent } from 'expo';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.setAttribute('dir', 'rtl');
  document.documentElement.setAttribute('lang', 'he');
}

import App from './App';

registerRootComponent(App);
