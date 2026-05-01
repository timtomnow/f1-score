import { mount } from 'svelte';
import App from './App.svelte';
import { loadPrefs } from './lib/prefs.svelte';
import { initTheme } from './lib/theme.svelte';
import './app.css';

loadPrefs();
void initTheme();

const app = mount(App, { target: document.getElementById('app')! });

export default app;
