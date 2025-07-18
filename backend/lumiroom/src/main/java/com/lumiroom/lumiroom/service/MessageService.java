package com.lumiroom.lumiroom.service;

import com.lumiroom.lumiroom.model.Message;

import java.util.List;

/**
 * Service interface for managing chat messages using Redis.
 * Provides operations to add, retrieve, delete messages and create chat rooms.
 */
public interface MessageService {

    /**
     * Adds a new message to the Redis sorted set for the chat room.
     * Generates a unique ID and timestamp for the message.
     * 
     * @param messageData the message data to add; must contain chatRoomId and chatMessage
     * @return the message with generated ID and creation timestamp set
     * @throws IllegalArgumentException if messageData, chatRoomId, or chatMessage is null
     * @throws RuntimeException if serialization or Redis operation fails
     */
    Message addMessage(Message messageData);

    /**
     * Retrieves all messages for a given chat room in ascending order by creation time.
     * 
     * @param chatRoomId the chat room ID to fetch messages from
     * @return a list of messages in ascending order, or an empty list if none found
     * @throws IllegalArgumentException if chatRoomId is null
     */
    List<Message> getMessages(String chatRoomId);

    /**
     * Deletes a specific message from the chat room's sorted set by message ID.
     * 
     * @param chatRoomId the chat room ID
     * @param messageId the unique ID of the message to delete
     * @return a confirmation string on successful deletion
     * @throws IllegalArgumentException if chatRoomId or messageId is null
     * @throws RuntimeException if the message is not found or Redis operation fails
     */
    String deleteMessage(String chatRoomId, String messageId);

    /**
     * Creates a chat room by adding a placeholder system message to the sorted set.
     * 
     * @param chatRoomId the ID of the chat room to create
     * @return a confirmation string on successful creation
     * @throws IllegalArgumentException if chatRoomId is null
     * @throws RuntimeException if Redis operation fails
     */
    String createRoom(String chatRoomId);
}
