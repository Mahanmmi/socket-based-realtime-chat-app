<template>
    <div>
        <loading
                :active.sync="isLoading"
                :is-full-page="true"
        >
        </loading>
        <transition enter-active-class="animate__animated animate__fadeIn"
                    leave-active-class="animate__animated animate__fadeOut" mode="out-in">
            <RegisterModal :show-err="regErr" v-if="!user && !isLoading" @sendRegister="register"/>
        </transition>
        <transition enter-active-class="animate__animated animate__fadeIn"
                    leave-active-class="animate__animated animate__fadeOut" mode="out-in">
            <RenameModal :show-err="regErr" v-if="renameMode && !isLoading" @sendRename="sendRename"
                         @cancelRename="cancelRename"/>
        </transition>
        <chat-window
                style="height: 98%"
                :currentUserId="currentUserId"
                :rooms="rooms"
                :roomId="roomId"
                :messages="messages"
                :theme="theme"
                :menuActions="menuActions"
                :messagesLoaded="messagesLoaded"
                :loadingRooms="false"
                @menuActionHandler="menuActionHandler"
                @fetchMessages="fetchMessages"
                @sendMessage="sendMessage"
                @openFile="openFile"
        />
    </div>
</template>

<script>
    import ChatWindow from 'vue-advanced-chat';
    import 'vue-advanced-chat/dist/vue-advanced-chat.css';
    import Loading from 'vue-loading-overlay';
    import 'vue-loading-overlay/dist/vue-loading.css';

    import {io} from 'socket.io-client';
    import RegisterModal from "./RegisterModal";

    import {configClient, sendFileInit} from "../helperFuncions";
    import RenameModal from "./RenameModal";


    let client;


    export default {
        name: "ChatPanel",
        components: {
            RenameModal,
            RegisterModal,
            ChatWindow,
            Loading
        },
        data() {
            return {
                isLoading: true,
                renameMode: false,
                user: undefined,
                regErr: false,
                roomId: null,
                rooms: [],
                messages: [],
                currentUserId: undefined,
                messagesLoaded: true,
                menuActions: [
                    {
                        name: 'rename',
                        title: 'Change Username'
                    }
                ],
                theme: 'dark'
            }
        },
        methods: {
            findRoom(id) {
                for (const room of this.rooms) {
                    if (room.roomId === id) {
                        return room;
                    }
                }
            },
            register(username) {
                this.isLoading = true;
                client.emit('register', username);
            },
            sendRename(username) {
                this.isLoading = true;
                client.emit('rename', {
                    old: this.user.username,
                    username
                });
            },
            cancelRename() {
                this.renameMode = false;
                this.regErr = false;
            },
            fetchMessages({room}) {
                this.messagesLoaded = false;
                this.messages = room.messages;
                this.roomId = room.roomId;
                room.unreadCount = 0;

                return (this.messagesLoaded = true);
            },
            sendMessage({roomId, content, file}) {
                const room = this.findRoom(roomId);
                if (!file) {
                    client.emit('message', {
                        from: this.currentUserId,
                        target: roomId,
                        content
                    });
                    const date = new Date();
                    const message = {
                        _id: roomId.toString() + room.messages.length.toString(),
                        content,
                        sender_id: this.currentUserId,
                        username: this.user.username,
                        date: `${date.toDateString()}`,
                        timestamp: `${date.getHours()}:${date.getMinutes()}`, saved: true,
                        distributed: true,
                        seen: true,
                        disable_actions: true,
                        disable_reactions: true,
                        file
                    }
                    room.messages.push(message);
                    room.lastMessage = message;
                } else {
                    this.isLoading = true;
                    sendFileInit(room, content, file);
                }

            },
            openFile({message}) {
                const win = window.open(message.file.url, '_blank');
                win.focus();
                console.log(message);
            },
            menuActionHandler({action}) {
                if (action.name === "rename") {
                    this.renameMode = true;
                }
            }
        },
        mounted() {
            this.isLoading = true;
            client = io('127.0.0.1:8778', {
                path: '/'
            });
            client.on('connect', () => {
                this.isLoading = false;
            });
            configClient(client, this);
        }
    }
</script>

<style scoped>

</style>