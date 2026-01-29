<template>
  <div id="app">
    <CompareView />
  </div>
</template>

<script>
import CompareView from './components/CompareView.vue'

export default {
  name: 'App',
  components: {
    CompareView
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  height: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
