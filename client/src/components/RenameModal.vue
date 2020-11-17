<template>
    <div class="modal">
        <div class="container">
            <b>Change Username</b>
            <div class="flex-lg-wrap">
                <p v-if="showErr" style="color: darkred; font-size: smaller; text-align: center">Username already taken please choose
                    another one</p>
                <div class="modal__title">
                    <label for="username">Username:</label>
                    <b-form-input id="username" v-model="username" placeholder="" type="text"/>
                </div>
            </div>
            <div class="button_wrapper">
                <b-button variant="danger" @click="cancelSend">
                    CANCEL
                </b-button>
                <b-button variant="success" @click="doSend">
                    RENAME
                </b-button>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "RenameModal",
        data() {
            return {
                username: ""
            }
        },
        props: {
            showErr: Boolean
        },
        methods: {
            doSend() {
                this.$emit("sendRename", this.username);
                this.username = "";
            },
            cancelSend(){
                this.username = "";
                this.$emit("cancelRename");
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
        height: 200px;
        width: 300px;
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

</style>