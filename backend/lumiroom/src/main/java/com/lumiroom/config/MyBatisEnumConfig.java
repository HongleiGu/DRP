package com.lumiroom.config;

import org.apache.ibatis.session.Configuration;
import org.apache.ibatis.type.TypeHandlerRegistry;
import org.mybatis.spring.boot.autoconfigure.ConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import com.lumiroom.model.ai.commons.Provider;
import com.lumiroom.model.messages.MessageScope;
import com.lumiroom.model.messages.MessageType;
import com.lumiroom.model.rooms.RoomType;
import com.lumiroom.utils.GenericEnumTypeHandler;

@Component
public class MyBatisEnumConfig {

  @Bean
  public ConfigurationCustomizer configurationCustomizer() {
    return new ConfigurationCustomizer() {
      @Override
      public void customize(Configuration configuration) {
        TypeHandlerRegistry registry = configuration.getTypeHandlerRegistry();

        // Register the GenericEnumTypeHandler for enums that implement GenericEnum
        registry.register(MessageScope.class, new GenericEnumTypeHandler<>(MessageScope.class));
        registry.register(MessageType.class, new GenericEnumTypeHandler<>(MessageType.class));
        registry.register(RoomType.class, new GenericEnumTypeHandler<>(RoomType.class));
        registry.register(Provider.class, new GenericEnumTypeHandler<>(Provider.class));
      }
    };
  }
}
