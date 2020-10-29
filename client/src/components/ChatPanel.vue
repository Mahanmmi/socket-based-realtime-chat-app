<template>
    <chat-window
            :currentUserId="currentUserId"
            :rooms="rooms"
            :messages="messages"
            :theme="theme"
            @fetchMessages="fetchMessages"
    />
</template>

<script>
    import ChatWindow from 'vue-advanced-chat'
    import 'vue-advanced-chat/dist/vue-advanced-chat.css'

    export default {
        name: "ChatPanel",
        components: {
            ChatWindow
        },
        data() {
            return {
                rooms: [
                    {
                        roomId: 1,
                        roomName: 'Room 1',
                        unreadCount: 4,
                        lastMessage: {
                            content: 'Last message received',
                            sender_id: 1234,
                            username: 'John Doe',
                            timestamp: '10:20',
                            date: 123242424,
                            seen: false,
                            new: true
                        },
                        users: [
                            {
                                _id: 1234,
                                username: 'John Doe',
                                status: {
                                    state: 'online',
                                    last_changed: 'today, 14:30'
                                }
                            },
                            {
                                _id: 4321,
                                username: 'John Snow',
                                status: {
                                    state: 'offline',
                                    last_changed: '14 July, 20:00'
                                }
                            }
                        ],
                        typingUsers: [4321]
                    }
                ],
                messages: [],
                currentUserId: 1234,
                theme: 'dark'
            }
        },
        methods: {
            fetchMessages({room, options = {}}) {
                if (options.reset) this.resetMessages()
                room;
            }
        }
    }
</script>

<style scoped>

</style>