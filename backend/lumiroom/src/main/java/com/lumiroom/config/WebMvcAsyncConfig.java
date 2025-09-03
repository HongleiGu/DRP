package com.lumiroom.config;

// for all the controller functions that returns a Flux object (AIController)

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcAsyncConfig implements WebMvcConfigurer {

  @Override
  public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(20); // minimum threads
    executor.setMaxPoolSize(50); // maximum threads
    executor.setQueueCapacity(100); // queue for pending requests
    executor.setThreadNamePrefix("mvc-async-");
    executor.initialize();

    configurer.setTaskExecutor(executor);
    configurer.setDefaultTimeout(30_000L); // optional timeout
  }
}
