<template>
    <div style="height: 100vh">
<!--        <div id="app">-->
<!--            <img alt="Vue logo" src="./assets/logo.png">-->
<!--            <HelloWorld msg="Welcome to Your Vue.js App"/>-->
<!--        </div>-->
        <section style="height: 100%">
            <ChatPanel style="height: 100%;"/>
        </section>
    </div>
</template>

<script>
    //import HelloWorld from './components/HelloWorld.vue'

    import ChatPanel from "./components/ChatPanel";
    export default {
        name: 'App',
        components: {
            ChatPanel,
            //HelloWorld
        }
    }
</script>

<style>
    #app {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
    }
</style>
