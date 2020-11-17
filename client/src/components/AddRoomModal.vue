<template>
    <div class="modal">
        <div class="container">
            <b>Choose members</b>
            <div class="flex-lg-wrap">
                <md-list class="md-scrollbar mylist">
                    <md-list-item v-for="(user, index) in users" :key="user.username">
                        <span class="md-list-item-text">{{user.username}}</span>
                        <md-switch v-model="selection[index].selected"/>
                    </md-list-item>
                </md-list>
                <div class="modal__title">
                    <label for="groupname">Group name:</label>
                    <b-form-input id="groupname" v-model="name" placeholder="" type="text"/>
                </div>
            </div>
            <div class="button_wrapper">
                <b-button variant="danger" @click="cancelSend">
                    CANCEL
                </b-button>
                <b-button variant="success" @click="doSend">
                    CREATE
                </b-button>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "AddRoomModal",
        data() {
            return {
                name: "",
                selection: []
            }
        },
        props: {
            users: Array
        },
        methods: {
            doSend() {
                this.$emit("sendAddRoom", this.name, this.selection);
                this.selection = [];
                this.name = "";
            },
            cancelSend() {
                this.name = "";
                this.selection = [];
                this.$emit("cancelAddRoom");
            }
        },
        mounted() {
            for(const user of this.users){
                this.selection.push({
                    username: user.username,
                    id: user.id,
                    selected: false
                })
            }
        }
    }
</script>

<style scoped>
    .modal {
        position: fixed;
        z-index: 100;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);;
    }

    .container {
        display: flex;
        height: 600px;
        width: 500px;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
        background-color: white;
        border-radius: 5px;
        padding: 10px 20px;
        margin-top: -10%;
        box-shadow: 0 8px 8px rgba(0, 0, 0, 0.25);

    }

    .modal__title {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-evenly;
        /*height: 150px;*/
    }

    .button_wrapper {
        display: flex;
        flex-direction: row;
        width: 100%;
        justify-content: space-evenly;
    }

    label {
        margin-top: 10px;

    }

    input {
        padding: 3px;
        margin-left: 5px;
    }

    .mylist {
        height: 350px;
        overflow-y: scroll;
        width: 400px;
    }

</style>