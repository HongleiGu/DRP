package com.lumiroom.lumiroom.ws;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Component;

@Component
public class WebSocketAckTracker {

    private final ConcurrentMap<String, CompletableFuture<Boolean>> pendingAcks = new ConcurrentHashMap<>();

    public CompletableFuture<Boolean> waitForAck(String ackKey, Duration timeout) {
        CompletableFuture<Boolean> future = new CompletableFuture<>();
        pendingAcks.put(ackKey, future);
        return future.orTimeout(timeout.toMillis(), TimeUnit.MILLISECONDS)
                     .whenComplete((r, e) -> pendingAcks.remove(ackKey));
    }

    public void confirmAck(String ackKey, boolean success) {
        CompletableFuture<Boolean> future = pendingAcks.get(ackKey);
        if (future != null) {
            future.complete(success);
        }
    }
}
