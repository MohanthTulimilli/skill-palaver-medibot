package com.medibots.controller;

import com.medibots.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> raw = (List<Map<String, Object>>) body.getOrDefault("messages", List.of());
        List<Map<String, String>> messages = new ArrayList<>();
        for (Map<String, Object> m : raw) {
            messages.add(Map.of(
                "role", String.valueOf(m.getOrDefault("role", "user")),
                "content", String.valueOf(m.getOrDefault("content", ""))
            ));
        }
        String reply = chatService.chat(messages);
        return ResponseEntity.ok(Map.of("message", reply));
    }
}
